// Main JavaScript file for Abhishek's website

document.addEventListener('DOMContentLoaded', function() {
    // Initialize smooth scrolling
    initializeSmoothScrolling();
    
    // Initialize publications
    initializePublications();
    
    // Initialize news toggle
    initializeNewsToggle();
    
    // Add fade-in animation to sections
    addFadeInAnimation();
});

function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function initializePublications() {
    const publicationsContainer = document.querySelector('.publications-list');
    if (!publicationsContainer) return;

    // Add fade-in animation to each publication
    const publications = publicationsContainer.querySelectorAll('.publication-item');
    publications.forEach((pub, index) => {
        pub.style.animationDelay = `${index * 0.1}s`;
        pub.classList.add('fade-in');
    });
}

function initializeNewsToggle() {
    const toggleButton = document.querySelector('button[onclick="toggleblock(\'hiddennews\')"]');
    if (!toggleButton) return;

    toggleButton.addEventListener('click', function(e) {
        e.preventDefault();
        const hiddenNews = document.getElementById('hiddennews');
        if (hiddenNews) {
            if (hiddenNews.classList.contains('show')) {
                hiddenNews.classList.remove('show');
                this.textContent = 'Show more';
            } else {
                hiddenNews.classList.add('show');
                this.textContent = 'Show less';
            }
        }
    });
}

function addFadeInAnimation() {
    const sections = document.querySelectorAll('section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    sections.forEach(section => {
        observer.observe(section);
    });
}

// Function to toggle abstract visibility
function toggleblock(id) {
    const element = document.getElementById(id);
    if (element) {
        if (element.style.display === 'none') {
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    }
}

// Function to toggle bibtex visibility
function togglebib(id) {
    const element = document.getElementById(id);
    if (element) {
        const bibtex = element.querySelector('.bibtex_text');
        if (bibtex) {
            if (bibtex.style.display === 'none') {
                bibtex.style.display = 'block';
            } else {
                bibtex.style.display = 'none';
            }
        }
    }
} 