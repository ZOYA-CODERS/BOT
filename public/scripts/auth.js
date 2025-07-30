document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const authMessage = document.getElementById('auth-message');
  const authContainer = document.getElementById('auth-container');
  const chatContainer = document.getElementById('chat-container');

  // Check auth state
  auth.onAuthStateChanged(user => {
    if (user) {
      // User is signed in
      authContainer.classList.add('hidden');
      chatContainer.classList.remove('hidden');
    } else {
      // User is signed out
      authContainer.classList.remove('hidden');
      chatContainer.classList.add('hidden');
    }
  });

  // Login function
  loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        authMessage.textContent = 'Login successful!';
        authMessage.style.color = 'green';
      })
      .catch(error => {
        authMessage.textContent = error.message;
        authMessage.style.color = 'red';
      });
  });

  // Signup function
  signupBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    auth.createUserWithEmailAndPassword(email, password)
      .then(() => {
        authMessage.textContent = 'Registration successful!';
        authMessage.style.color = 'green';
      })
      .catch(error => {
        authMessage.textContent = error.message;
        authMessage.style.color = 'red';
      });
  });

  // Logout function
  logoutBtn.addEventListener('click', () => {
    auth.signOut()
      .then(() => {
        authMessage.textContent = 'Logged out successfully!';
        authMessage.style.color = 'green';
      })
      .catch(error => {
        authMessage.textContent = error.message;
        authMessage.style.color = 'red';
      });
  });
});
