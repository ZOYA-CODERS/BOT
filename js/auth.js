document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const authContainer = document.getElementById('auth-container');
    const chatContainer = document.getElementById('chat-container');
    const menuBtn = document.getElementById('menu-btn');
    const menu = document.getElementById('menu');
    const contactUs = document.getElementById('contact-us');

    // Toggle between login and register forms
    showRegister.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    showLogin.addEventListener('click', function(e) {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    // Toggle menu
    menuBtn.addEventListener('click', function() {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });

    // Contact Us
    contactUs.addEventListener('click', function(e) {
        e.preventDefault();
        alert('Contact us at: 94702932200');
        menu.style.display = 'none';
    });

    // Check auth state
    auth.onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in
            authContainer.style.display = 'none';
            chatContainer.style.display = 'flex';
            loadChat(user);
        } else {
            // User is signed out
            authContainer.style.display = 'flex';
            chatContainer.style.display = 'none';
        }
    });

    // Login
    loginBtn.addEventListener('click', function() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then(function() {
                // Login successful
            })
            .catch(function(error) {
                alert(error.message);
            });
    });

    // Register
    registerBtn.addEventListener('click', function() {
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const username = document.getElementById('register-username').value;

        auth.createUserWithEmailAndPassword(email, password)
            .then(function(userCredential) {
                // Save additional user info to database
                return database.ref('users/' + userCredential.user.uid).set({
                    username: username,
                    email: email,
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                });
            })
            .then(function() {
                // Registration successful
            })
            .catch(function(error) {
                alert(error.message);
            });
    });

    // Logout
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        auth.signOut()
            .then(function() {
                menu.style.display = 'none';
            })
            .catch(function(error) {
                alert(error.message);
            });
    });
});
