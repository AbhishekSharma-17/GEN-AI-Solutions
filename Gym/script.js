document.addEventListener('DOMContentLoaded', function() {
    // Handle form submissions
    const enquiryForm = document.getElementById('enquiryForm');
    const contactForm = document.getElementById('contactForm');
    const notification = document.getElementById('notification');

    function handleFormSubmit(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const formData = new FormData(form);
            const formValues = Object.fromEntries(formData.entries());

            // Here you would typically send this data to a server
            // For now, we'll just log it to the console
            console.log('Form submitted:', formValues);

            // Show the notification
            notification.classList.add('show');

            // Hide the notification after 5 seconds
            setTimeout(() => {
                notification.classList.remove('show');
            }, 5000);

            // Reset the form
            form.reset();
        });
    }

    if (enquiryForm) handleFormSubmit(enquiryForm);
    if (contactForm) handleFormSubmit(contactForm);

    // Add smooth scrolling to all links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Add active class to current nav item
    const currentPage = window.location.pathname.split("/").pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });

    // Class filtering functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    const classItems = document.querySelectorAll('.class-item');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            classItems.forEach(item => {
                if (filter === 'all' || item.getAttribute('data-category') === filter) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // Simple image slider for homepage
    const sliderImages = document.querySelectorAll('.slider-image');
    let currentImageIndex = 0;

    function showNextImage() {
        sliderImages[currentImageIndex].classList.remove('active');
        currentImageIndex = (currentImageIndex + 1) % sliderImages.length;
        sliderImages[currentImageIndex].classList.add('active');
    }

    if (sliderImages.length > 0) {
        setInterval(showNextImage, 5000); // Change image every 5 seconds
    }

    // Responsive menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('nav ul');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('show');
        });
    }
});
