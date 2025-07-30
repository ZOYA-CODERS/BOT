document.addEventListener('DOMContentLoaded', () => {
  // Firebase configuration
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const database = firebase.database();
  const messagesRef = database.ref('messages');

  // DOM elements
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const showRegister = document.getElementById('show-register');
  const showLogin = document.getElementById('show-login');
  const loginContainer = document.getElementById('login-container');
  const chatContainer = document.getElementById('chat-container');
  const logoutBtn = document.getElementById('logout-btn');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const messageContainer = document.getElementById('message-container');
  const verifyEmailBtn = document.getElementById('verify-email-btn');
  const passwordResetForm = document.getElementById('password-reset-form');
  const showResetPassword = document.getElementById('show-reset-password');
  const backToLoginFromReset = document.getElementById('back-to-login-from-reset');
  const menuBtn = document.getElementById('menu-btn');
  const menuDropdown = document.getElementById('menu-dropdown');
  
  let currentUser = null;
  const socket = io();

  // Event listeners
  showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    passwordResetForm.classList.add('hidden');
  });
  
  showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    passwordResetForm.classList.add('hidden');
  });
  
  // Toggle menu dropdown
  menuBtn.addEventListener('click', (e) => {
    e.preventDefault();
    menuDropdown.classList.toggle('hidden');
  });

  // Close menu when clicking elsewhere
  document.addEventListener('click', (e) => {
    if (!menuBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
      menuDropdown.classList.add('hidden');
    }
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-username').value; // Using username field for email
    const password = document.getElementById('login-password').value;
    
    loginUser(email, password);
  });
  
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('register-username').value; // Using username field for email
    const password = document.getElementById('register-password').value;
    
    if (!validatePassword(password)) {
      alert('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      return;
    }
    
    registerUser(email, password);
  });
  
  passwordResetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('reset-email').value;
    resetPassword(email);
  });
  
  logoutBtn.addEventListener('click', () => {
    logoutUser();
  });
  
  if (verifyEmailBtn) {
    verifyEmailBtn.addEventListener('click', () => {
      sendEmailVerification();
    });
  }
  
  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // Firebase Auth State Listener
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      
      // Check if email is verified
      if (!user.emailVerified) {
        showEmailVerificationNotice();
        return;
      }
      
      showChat();
      loadMessages();
    } else {
      showLoginForm();
    }
  });

  // Functions
  function validatePassword(password) {
    // At least 8 characters, one uppercase, one lowercase, one number and one special character
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  }

  function loginUser(email, password) {
    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        
        if (!user.emailVerified) {
          auth.signOut();
          showEmailVerificationNotice();
          throw new Error('Email not verified');
        }
        
        currentUser = user;
        showChat();
        loadMessages();
      })
      .catch((error) => {
        let errorMessage = error.message;
        
        // More user-friendly error messages
        switch(error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No user found with this email address';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Account temporarily disabled. Try again later or reset your password.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled';
            break;
        }
        
        alert(errorMessage);
      });
  }
  
  function registerUser(email, password) {
    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Send email verification
        return userCredential.user.sendEmailVerification();
      })
      .then(() => {
        alert('Registration successful! Please check your email for verification link.');
        showLoginForm();
      })
      .catch((error) => {
        let errorMessage = error.message;
        
        switch(error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak';
            break;
        }
        
        alert(errorMessage);
      });
  }
  
  function logoutUser() {
    auth.signOut()
      .then(() => {
        currentUser = null;
        showLoginForm();
      })
      .catch((error) => {
        alert('Error signing out: ' + error.message);
      });
  }
  
  function sendEmailVerification() {
    if (!currentUser) return;
    
    currentUser.sendEmailVerification()
      .then(() => {
        alert('Verification email sent. Please check your inbox.');
      })
      .catch((error) => {
        alert('Error sending verification email: ' + error.message);
      });
  }
  
  function resetPassword(email) {
    auth.sendPasswordResetEmail(email)
      .then(() => {
        alert('Password reset email sent. Please check your inbox.');
        showLoginForm();
      })
      .catch((error) => {
        let errorMessage = error.message;
        
        switch(error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No user found with this email address';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address';
            break;
        }
        
        alert(errorMessage);
      });
  }
  
  function showEmailVerificationNotice() {
    loginContainer.classList.remove('hidden');
    chatContainer.classList.add('hidden');
    loginForm.classList.add('hidden');
    registerForm.classList.add('hidden');
    passwordResetForm.classList.add('hidden');
    
    const verificationNotice = document.createElement('div');
    verificationNotice.className = 'verification-notice';
    verificationNotice.innerHTML = `
      <h2>Email Verification Required</h2>
      <p>We've sent a verification email to ${currentUser.email}. Please verify your email to continue.</p>
      <p>Didn't receive the email? <a href="#" id="resend-verification">Resend verification email</a></p>
      <button id="logout-from-verification">Logout</button>
    `;
    
    loginContainer.appendChild(verificationNotice);
    
    document.getElementById('resend-verification').addEventListener('click', (e) => {
      e.preventDefault();
      sendEmailVerification();
    });
    
    document.getElementById('logout-from-verification').addEventListener('click', () => {
      logoutUser();
      verificationNotice.remove();
      showLoginForm();
    });
  }

  function showChat() {
    loginContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    messageInput.focus();
  }
  
  function showLoginForm() {
    chatContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    passwordResetForm.classList.add('hidden');
    
    // Clear verification notice if it exists
    const notice = document.querySelector('.verification-notice');
    if (notice) notice.remove();
    
    // Clear form fields
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('register-username').value = '';
    document.getElementById('register-password').value = '';
    document.getElementById('reset-email').value = '';
  }
  
  function loadMessages() {
    messagesRef.limitToLast(100).on('value', (snapshot) => {
      messageContainer.innerHTML = '';
      snapshot.forEach((childSnapshot) => {
        const msg = childSnapshot.val();
        addMessage(msg);
      });
      scrollToBottom();
    });
  }
  
  function sendMessage() {
    const text = messageInput.value.trim();
    if (text && currentUser) {
      const message = {
        username: currentUser.displayName || currentUser.email.split('@')[0],
        text: text,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        userId: currentUser.uid
      };
      
      messagesRef.push(message)
        .catch((error) => {
          alert('Error sending message: ' + error.message);
        });
      
      messageInput.value = '';
    }
  }
  
  function addMessage(msg) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    
    if (msg.userId === currentUser.uid) {
      messageDiv.classList.add('sent');
    }
    
    messageDiv.innerHTML = `
      <div class="message-info">
        <span class="message-username">${msg.username}</span>
        <span class="message-time">${formatTime(msg.timestamp)}</span>
      </div>
      <div class="message-text">${msg.text}</div>
    `;
    
    messageContainer.appendChild(messageDiv);
    scrollToBottom();
  }
  
  function scrollToBottom() {
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }
  
  function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
});
