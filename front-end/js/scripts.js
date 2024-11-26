document.addEventListener("DOMContentLoaded", function() {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            if (i === index) {
                slide.classList.add('active');
            }
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
    }

    document.querySelector('.next-button').addEventListener('click', nextSlide);

    showSlide(currentSlide);
});

document.getElementById('signupBtn').addEventListener('click', function() {
    window.location.href = 'signup.html';
});

document.getElementById('loginBtn').addEventListener('click', function() {
    window.location.href = 'login.html';
});

// Signup Form Handling
document.getElementById('signupForm')?.addEventListener('Register', function(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Store the user credentials in Local Storage
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userPassword', password);

    alert('Account created successfully for ' + email);
    location.href = 'login.html'; // Redirect to login after sign up
});

// Login Form Handling
document.getElementById('loginForm')?.addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Retrieve stored credentials
    const storedEmail = localStorage.getItem('userEmail');
    const storedPassword = localStorage.getItem('userPassword');

    // Validate the input against stored credentials
    if (email === storedEmail && password === storedPassword) {
        alert('Login successful!');
        location.href = 'services.html'; // Redirect to services page after login
    } else {
        alert('Invalid email or password');
    }
});

// Get elements
const welcomeMessage = document.getElementById('welcomeMessage');
const serviceDetails = document.getElementById('serviceDetails');

// Function to show welcome message
function showWelcomeMessage() {
    welcomeMessage.textContent = "It’s simple arithmetic: Your income can grow only to the extent that you do.";
    serviceDetails.innerHTML = ''; // Clear previous service details
}

// Function to handle service tab clicks
function showService(serviceName) {
    welcomeMessage.textContent = `Welcome to the ${serviceName} Service!`;
    serviceDetails.innerHTML = `<p>This section will provide information about ${serviceName}.</p>`;
}

// Event listeners for service tabs
document.getElementById('accountTab').addEventListener('click', () => showService('Account'));
document.getElementById('insuranceTab').addEventListener('click', () => showService('Insurance'));
document.getElementById('loansTab').addEventListener('click', () => showService('Loans'));
document.getElementById('transactionsTab').addEventListener('click', () => showService('Transactions'));
document.getElementById('notificationsTab').addEventListener('click', () => showService('Notifications'));

// Show the default welcome message on page load
showWelcomeMessage();

// Slider functionality

document.addEventListener("DOMContentLoaded", function() {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            if (i === index) {
                slide.classList.add('active');
            }
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
    }

    document.querySelector('.next-button').addEventListener('click', nextSlide);

    document.getElementById('signupBtn').addEventListener('click', function() {
        window.location.href = 'signup.html';
    });

    document.getElementById('loginBtn').addEventListener('click', function() {
        window.location.href = 'login.html';
    });

    showSlide(currentSlide);
});
