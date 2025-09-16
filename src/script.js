document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const itineraryForm = document.getElementById('itinerary-form');
    const generateBtn = document.getElementById('generate-btn');
    
    const placeholder = document.getElementById('placeholder');
    const loading = document.getElementById('loading');
    const errorDisplay = document.getElementById('error');
    const errorMessage = document.getElementById('error-message');
    const itineraryResult = document.getElementById('itinerary-result');

    const chatToggle = document.getElementById('chat-toggle');
    const chatWidget = document.getElementById('chat-widget');
    const chatClose = document.getElementById('chat-close');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatContainer = document.getElementById('chat-container');
    const chatLoading = document.getElementById('chat-loading');

    // --- State Management ---
    let currentItinerary = null;
    let chatHistory = [];
    let isChatOpen = false;

    // --- API Configuration (Client-Side Backend) ---
    // IMPORTANT: Replace "YOUR_API_KEY_HERE" with your actual Google AI API key.
    // You can get a free key from https://aistudio.google.com/app/apikey
    const API_KEY = "AIzaSyCR4osy5CHCoE6rjVWT-h6ZV84IISVFcmc"; 
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;
    
    // --- Itinerary Generation Logic ---
    itineraryForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (API_KEY === "YOUR_API_KEY_HERE") {
            showError("Please add your Google AI API key to the script.js file.");
            return;
        }

        const formData = new FormData(itineraryForm);
        const destination = formData.get('destination');
        const duration = formData.get('duration');
        const interests = formData.get('interests');
        const budget = formData.get('budget');

        if (!destination || !duration) return;

        // Update UI state to show loading
        placeholder.classList.add('hidden');
        itineraryResult.classList.add('hidden');
        errorDisplay.classList.add('hidden');
        loading.classList.remove('hidden');
        generateBtn.disabled = true;
        generateBtn.innerHTML = `
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Generating...`;
        
        try {
            // System prompt defines the AI's role and expected output format
            const systemPrompt = `You are an expert travel planner. Your task is to create a detailed, personalized travel itinerary.
            The user will provide a destination, duration, interests, and budget.
            You MUST respond with a valid JSON object that follows this exact schema. Do not include any text, notes, or markdown formatting before or after the JSON object.

            JSON Schema:
            {
              "tripTitle": "string",
              "summary": "string (A brief, engaging 2-3 sentence summary of the trip)",
              "days": [
                {
                  "day": "number",
                  "title": "string (A creative title for the day, e.g., 'Ancient Temples & Modern Marvels')",
                  "theme": "string (e.g., 'History', 'Adventure', 'Relaxation')",
                  "activities": [
                    {
                      "time": "string (e.g., 'Morning', '9:00 AM', 'Afternoon', 'Evening')",
                      "description": "string (What to do)",
                      "location": "string (Name of the place, if applicable)",
                      "details": "string (A short, helpful tip or more info)"
                    }
                  ]
                }
              ]
            }`;

            const userQuery = `Generate an itinerary for a trip to ${destination} for ${duration} days.
            My interests are: ${interests}.
            My budget is: ${budget}.`;

            const payload = {
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: {
                    responseMimeType: "application/json",
                }
            };
            
            // API call to Gemini
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`API Error: ${errorBody.error?.message || 'Unknown error'}`);
            }

            const result = await response.json();
            const jsonString = result.candidates[0].content.parts[0].text;
            currentItinerary = JSON.parse(jsonString);

            displayItinerary(currentItinerary);

        } catch (err) {
            console.error('Itinerary Generation Error:', err);
            showError(err.message);
            currentItinerary = null;
        } finally {
            // Restore UI state
            loading.classList.add('hidden');
            generateBtn.disabled = false;
            generateBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 mr-2"><path d="M17.5 12h-15m5.4-8.L2.5 12l5.4 4.8"/><path d="M21.5 5.2v13.6"/></svg>
                Generate Itinerary`;
        }
    });

    // --- UI Display Functions ---
    function displayItinerary(itinerary) {
        itineraryResult.innerHTML = ''; // Clear previous results
        
        const contentWrapper = document.createElement('div');
        
        const header = document.createElement('div');
        header.className = 'mb-8';
        header.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-900">${itinerary.tripTitle}</h2>
            <p class="mt-2 text-gray-600">${itinerary.summary}</p>
        `;
        contentWrapper.appendChild(header);

        const itineraryContent = document.createElement('div');
        itineraryContent.className = 'itinerary-content';

        itinerary.days.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'mb-6';

            let activitiesHtml = '<ol>';
            day.activities.forEach(activity => {
                activitiesHtml += `
                    <li>
                        <div class="flex-start items-center">
                            <div class="ml-4">
                                <h4 class="font-semibold text-lg text-gray-800">${activity.time}: ${activity.description}</h4>
                                <p class="text-sm text-gray-500 font-medium">${activity.location}</p>
                                <p class="mt-1 text-gray-600">${activity.details}</p>
                            </div>
                        </div>
                    </li>
                `;
            });
            activitiesHtml += '</ol>';

            dayElement.innerHTML = `
                <div class="flex items-center mb-4">
                     <span class="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">${day.theme}</span>
                </div>
                <h3 class="text-2xl font-semibold mb-4 text-blue-700">Day ${day.day}: ${day.title}</h3>
                ${activitiesHtml}
            `;
            itineraryContent.appendChild(dayElement);
        });
        
        contentWrapper.appendChild(itineraryContent);

        // Add Download PDF button
        const downloadBtn = document.createElement('button');
        downloadBtn.id = 'download-pdf-btn';
        downloadBtn.className = 'mt-8 w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center justify-center transition-all duration-200';
        downloadBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Itinerary as PDF
        `;
        downloadBtn.addEventListener('click', () => generatePDF(itinerary));
        
        itineraryResult.appendChild(contentWrapper);
        itineraryResult.appendChild(downloadBtn);
        itineraryResult.classList.remove('hidden');
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorDisplay.classList.remove('hidden');
        placeholder.classList.add('hidden');
        itineraryResult.classList.add('hidden');
    }

    // --- PDF Generation ---
    function generatePDF(itinerary) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        const margin = 15;
        let y = 20; // Vertical position start

        const checkPageBreak = (neededHeight) => {
            if (y + neededHeight > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
        };

        // --- PDF Header ---
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        const titleLines = doc.splitTextToSize(itinerary.tripTitle, pageWidth - margin * 2);
        doc.text(titleLines, margin, y);
        y += (titleLines.length * 8) + 2;

        // --- PDF Summary ---
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        const summaryLines = doc.splitTextToSize(itinerary.summary, pageWidth - margin * 2);
        checkPageBreak(summaryLines.length * 5);
        doc.text(summaryLines, margin, y);
        y += (summaryLines.length * 5) + 10;

        // --- PDF Body (Days and Activities) ---
        itinerary.days.forEach(day => {
            checkPageBreak(20); // Space for day header

            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(37, 99, 235); // Blue color
            const dayTitleText = `Day ${day.day}: ${day.title}`;
            const dayTitleLines = doc.splitTextToSize(dayTitleText, pageWidth - margin * 2);
            doc.text(dayTitleLines, margin, y);
            y += (dayTitleLines.length * 7) + 2;

            day.activities.forEach(activity => {
                checkPageBreak(30); // Estimate space for an activity
                
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(15, 23, 42); // Dark gray
                const activityTitle = `${activity.time}: ${activity.description}`;
                const activityTitleLines = doc.splitTextToSize(activityTitle, pageWidth - margin * 2 - 2);
                doc.text(activityTitleLines, margin + 2, y);
                y += (activityTitleLines.length * 5) + 2;
                
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(100, 116, 139); // Lighter gray
                
                if (activity.location) {
                    const locationText = `Location: ${activity.location}`;
                    const locationLines = doc.splitTextToSize(locationText, pageWidth - margin * 2 - 2);
                    checkPageBreak(locationLines.length * 4);
                    doc.text(locationLines, margin + 4, y);
                    y += (locationLines.length * 4) + 2;
                }

                const detailLines = doc.splitTextToSize(activity.details, pageWidth - margin * 2 - 2);
                checkPageBreak(detailLines.length * 4);
                doc.text(detailLines, margin + 4, y);
                y += (detailLines.length * 4) + 8;
            });
        });

        // --- Save the PDF ---
        doc.save(`Itinerary for ${itinerary.tripTitle}.pdf`);
    }

    // --- Chatbot Logic ---
    function toggleChat() {
        isChatOpen = !isChatOpen;
        if (isChatOpen) {
            chatWidget.classList.remove('hidden');
            chatWidget.classList.add('flex');
        } else {
            chatWidget.classList.add('hidden');
            chatWidget.classList.remove('flex');
        }
    }
    
    chatToggle.addEventListener('click', toggleChat);
    chatClose.addEventListener('click', toggleChat);

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (API_KEY === "YOUR_API_KEY_HERE") {
            appendChatMessage('model', "The chatbot is disabled. Please add your Google AI API key to the script.js file.");
            return;
        }

        const userInput = chatInput.value.trim();
        if (!userInput) return;

        appendChatMessage('user', userInput);
        chatInput.value = '';
        chatLoading.classList.remove('hidden');

        try {
            const systemPrompt = `You are a friendly and helpful multilingual travel assistant.
            Your goal is to answer user questions concisely and accurately.
            If the user asks a question in a specific language, you MUST respond in that same language.
            You have access to the user's current travel itinerary. Use it as context to provide relevant answers. If the itinerary is not available, inform the user that they need to generate one first to ask specific questions about it.
            Keep your answers helpful and to the point.`;
            
            let chatContextForAPI = [...chatHistory, { role: "user", parts: [{ text: userInput }] }];
            
            const payload = {
                contents: chatContextForAPI,
                systemInstruction: { 
                    parts: [
                        { text: systemPrompt },
                        { text: `Current Itinerary Context: ${JSON.stringify(currentItinerary) || 'Not available.'}` }
                    ] 
                },
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`API Error: ${errorBody.error?.message || 'Unknown chat error'}`);
            }
            
            const result = await response.json();
            const botResponse = result.candidates[0].content.parts[0].text;
            
            appendChatMessage('model', botResponse);
            
            chatHistory.push({ role: "user", parts: [{ text: userInput }] });
            chatHistory.push({ role: "model", parts: [{ text: botResponse }] });

        } catch (err) {
            console.error('Chat Error:', err);
            appendChatMessage('model', "Sorry, I'm having a little trouble right now. Please try again.");
        } finally {
            chatLoading.classList.add('hidden');
        }
    });

    function appendChatMessage(role, text) {
        const messageWrapper = document.createElement('div');
        const icon = role === 'user' ? 
            `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-gray-600"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>` :
            `<div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-blue-600"><path d="M12.57 2.43A14.5 14.5 0 0 1 21.5 14.2c0 8.07-10.09 9.38-11.23 2.16a12.5 12.5 0 0 1 10.46-15.06Z"/><path d="M12.57 2.43A14.5 14.5 0 0 0 3.5 14.2c0 8.07 10.09 9.38 11.23 2.16A12.5 12.5 0 0 0 4.27 1.11Z"/></svg>
            </div>`;

        messageWrapper.className = `flex items-start gap-2.5 mb-4 ${role === 'user' ? 'justify-end' : ''}`;
        
        const messageContent = `
            <div class="flex flex-col gap-1 w-full max-w-[320px]">
                <div class="leading-1.5 p-3 border-gray-200 ${role === 'user' ? 'bg-blue-600 text-white rounded-s-xl rounded-es-xl' : 'bg-gray-100 rounded-e-xl rounded-es-xl'}">
                    <p class="text-sm font-normal">${text}</p>
                </div>
            </div>`;
        
        if (role === 'user') {
            messageWrapper.innerHTML = messageContent + icon;
        } else {
            messageWrapper.innerHTML = icon + messageContent;
        }

        chatContainer.appendChild(messageWrapper);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
});

