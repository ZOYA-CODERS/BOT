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
  const database = firebase.database();
  
  // DOM Elements
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const showRegister = document.getElementById('show-register');
  const showLogin = document.getElementById('show-login');
  const loginContainer = document.getElementById('login-container');
  const chatContainer = document.getElementById('chat-container');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const messageContainer = document.getElementById('message-container');
  const logoutBtn = document.getElementById('logout-btn');
  const menuBtn = document.getElementById('menu-btn');
  const menuDropdown = document.getElementById('menu-dropdown');
  
  let currentUser = null;
  let messagesRef;
  let usersRef;
  let typingRef;
  
  // Initialize the application
  initApp();
  
  // Event listeners
  showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    toggleForms(false);
  });
  
  showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    toggleForms(true);
  });
  
  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
  logoutBtn.addEventListener('click', handleLogout);
  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', handleMessageKeyPress);
  menuBtn.addEventListener('click', toggleMenu);
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menuBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
      closeMenu();
    }
  });
  
  // Initialize the application
  function initApp() {
    checkAuthState();
    setupEventListeners();
  }
  
  function setupEventListeners() {
    // Typing indicator
    let typingTimeout;
    messageInput.addEventListener('input', () => {
      if (messageInput.value.trim() && currentUser) {
        // Set that user is typing
        typingRef.child(currentUser.uid).set(true);
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          // Remove typing status after 2 seconds of inactivity
          typingRef.child(currentUser.uid).remove();
        }, 2000);
      }
    });
  }
  
  function toggleForms(showLogin) {
    loginForm.classList.toggle('hidden', !showLogin);
    registerForm.classList.toggle('hidden', showLogin);
  }
  
  function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        currentUser = userCredential.user;
        showChat();
        setupDatabaseListeners();
      })
      .catch((error) => {
        showAlert(error.message);
      });
  }
  
  function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Save additional user data to database
        return usersRef.child(userCredential.user.uid).set({
          email: email,
          createdAt: firebase.database.ServerValue.TIMESTAMP
        });
      })
      .then(() => {
        return firebase.auth().currentUser.sendEmailVerification();
      })
      .then(() => {
        showAlert('Registration successful! Please check your email for verification.');
        toggleForms(true);
      })
      .catch((error) => {
        showAlert(error.message);
      });
  }
  
  function handleLogout() {
    // Remove typing status on logout
    if (currentUser) {
      typingRef.child(currentUser.uid).remove();
    }
    
    firebase.auth().signOut()
      .then(() => {
        currentUser = null;
        showLoginForm();
        closeMenu();
        
        // Remove all database listeners
        if (messagesRef) messagesRef.off();
        if (typingRef) typingRef.off();
      })
      .catch((error) => {
        showAlert('Logout failed: ' + error.message);
      });
  }
  
  function handleMessageKeyPress(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  }
  
  function toggleMenu() {
    menuDropdown.classList.toggle('hidden');
  }
  
  function closeMenu() {
    menuDropdown.classList.add('hidden');
  }
  
  function checkAuthState() {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        currentUser = user;
        showChat();
        setupDatabaseListeners();
      }
    });
  }
  
  function setupDatabaseListeners() {
    // Initialize database references
    messagesRef = database.ref('messages');
    usersRef = database.ref('users');
    typingRef = database.ref('typing');
    
    // Listen for new messages
    messagesRef.orderByChild('timestamp').startAt(Date.now() - 24 * 60 * 60 * 1000).on('child_added', (snapshot) => {
      const msg = snapshot.val();
      addMessage(msg);
    });
    
    // Listen for typing indicators
    typingRef.on('child_added', (snapshot) => {
      if (snapshot.key !== currentUser.uid) {
        usersRef.child(snapshot.key).once('value').then((userSnapshot) => {
          const user = userSnapshot.val();
          showTypingIndicator(user.email);
        });
      }
    });
    
    typingRef.on('child_removed', (snapshot) => {
      const typingIndicator = document.querySelector('.typing-indicator');
      if (typingIndicator) {
        typingIndicator.remove();
      }
    });
    
    // Clean up old messages periodically
    setInterval(cleanupOldMessages, 60 * 60 * 1000); // Run hourly
  }
  
  function cleanupOldMessages() {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    messagesRef.orderByChild('timestamp').endAt(cutoff).once('value').then((snapshot) => {
      const updates = {};
      snapshot.forEach((child) => {
        updates[child.key] = null; // Mark for deletion
      });
      return messagesRef.update(updates);
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
    toggleForms(true);
    messageContainer.innerHTML = '';
  }
  
  function sendMessage() {
    const text = messageInput.value.trim();
    if (text && currentUser) {
      const message = {
        username: currentUser.email,
        userId: currentUser.uid,
        text: text,
        timestamp: Date.now()
      };
      
      // Push message to database
      messagesRef.push(message)
        .then(() => {
          messageInput.value = '';
          // Remove typing status
          typingRef.child(currentUser.uid).remove();
        })
        .catch((error) => {
          showAlert('Failed to send message: ' + error.message);
        });
    }
  }
  
  function addMessage(msg) {
    // Check if this message already exists to prevent duplicates
    const messageId = 'msg-' + msg.timestamp + '-' + msg.userId;
    if (document.getElementById(messageId)) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.id = messageId;
    
    if (msg.userId === currentUser.uid) {
      messageDiv.classList.add('sent');
    } else {
      messageDiv.classList.add('received');
    }
    
    messageDiv.innerHTML = `
      <div class="message-header">
        <span class="message-username">${msg.username}</span>
        <span class="message-time">${formatTime(msg.timestamp)}</span>
      </div>
      <div class="message-text">${msg.text}</div>
    `;
    
    messageContainer.appendChild(messageDiv);
    scrollToBottom();
  }
  
  function showTypingIndicator(username) {
    // Don't show typing indicator for current user
    if (username === currentUser.email) return;
    
    // Remove existing indicator if any
    const existingIndicator = document.querySelector('.typing-indicator');
    if (existingIndicator) {
      if (existingIndicator.dataset.user === username) {
        // Already showing for this user
        return;
      }
      existingIndicator.remove();
    }
    
    const indicator = document.createElement('div');
    indicator.classList.add('typing-indicator');
    indicator.dataset.user = username;
    indicator.innerHTML = `
      <span>${username} is typing</span>
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    
    messageContainer.appendChild(indicator);
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
  
  function showAlert(message) {
    // In a real app, you might use a more sophisticated notification system
    alert(message);
  }
});
