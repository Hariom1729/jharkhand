const menuBtn = document.getElementById('menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

const heading = document.getElementById("aiPersonalization");
  const frame = document.getElementById("aiFrame");

  heading.addEventListener("click", () => {
   window.open("src/inde.html", "_blank");  // show/hide toggle
  });