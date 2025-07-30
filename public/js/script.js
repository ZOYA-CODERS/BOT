document.addEventListener('DOMContentLoaded', () => {
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
  let isSending = false; // Flag to prevent duplicate messages
  const socket = io();
  
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
  
  // Socket.io events
  socket.on('chat message', (msg) => {
    // Only add message if it's not from the current user (to prevent duplicates)
    if (msg.username !== currentUser || !isSending) {
      addMessage(msg);
    }
    isSending = false;
  });
  
  socket.on('user typing', (username) => {
    showTypingIndicator(username);
  });
  
  // Initialize the application
  function initApp() {
    checkSession();
    setupEventListeners();
  }
  
  function setupEventListeners() {
    // Typing indicator
    let typingTimeout;
    messageInput.addEventListener('input', () => {
      if (messageInput.value.trim() && currentUser) {
        socket.emit('typing', currentUser);
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          const typingIndicator = document.querySelector('.typing-indicator');
          if (typingIndicator) typingIndicator.remove();
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
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    authenticateUser('/login', { username, password });
  }
  
  function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    
    authenticateUser('/register', { username, password });
  }
  
  function authenticateUser(endpoint, credentials) {
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include' // Important for session cookies
    })
    .then(handleResponse)
    .then(data => {
      if (data.success) {
        currentUser = credentials.username;
        showChat();
        loadMessages();
      } else {
        showAlert(data.message || `${endpoint === '/login' ? 'Login' : 'Registration'} failed`);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      showAlert('An error occurred. Please try again.');
    });
  }
  
  function handleResponse(response) {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  }
  
  function handleLogout() {
    fetch('/logout', { 
      method: 'POST',
      credentials: 'include' // Important for session cookies
    })
      .then(() => {
        currentUser = null;
        showLoginForm();
        closeMenu();
        socket.disconnect(); // Disconnect socket on logout
      })
      .catch(error => {
        console.error('Logout error:', error);
        showAlert('Logout failed. Please try again.');
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
  
  function checkSession() {
    fetch('/check-session', {
      credentials: 'include' // Important for session cookies
    })
      .then(handleResponse)
      .then(data => {
        if (data.authenticated) {
          currentUser = data.username;
          showChat();
          loadMessages();
        }
      })
      .catch(error => {
        console.error('Session check error:', error);
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
  
  function loadMessages() {
    fetch('/messages', {
      credentials: 'include' // Important for session cookies
    })
      .then(handleResponse)
      .then(messages => {
        messageContainer.innerHTML = '';
        messages.forEach(msg => addMessage(msg));
        scrollToBottom();
      })
      .catch(error => {
        console.error('Error loading messages:', error);
        showAlert('Failed to load messages');
      });
  }
  
  function sendMessage() {
    if (isSending) return; // Prevent duplicate sends
    
    const text = messageInput.value.trim();
    if (text && currentUser) {
      isSending = true;
      const message = {
        username: currentUser,
        text: text,
        timestamp: new Date().toISOString()
      };
      
      socket.emit('chat message', message);
      messageInput.value = '';
      
      // Optimistically add the message only if we're not getting it back from the server
      // This prevents duplicates when the server echoes the message back
      // addMessage(message); // Commented out to prevent duplicates
    }
  }
  
  function addMessage(msg) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    
    if (msg.username === currentUser) {
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
    
    // Remove any existing typing indicator
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
    
    // Check if this message already exists to prevent duplicates
    const messages = messageContainer.querySelectorAll('.message');
    const isDuplicate = Array.from(messages).some(existingMsg => {
      const existingText = existingMsg.querySelector('.message-text').textContent;
      const existingTime = existingMsg.querySelector('.message-time').textContent;
      return existingText === msg.text && existingTime === formatTime(msg.timestamp);
    });
    
    if (!isDuplicate) {
      messageContainer.appendChild(messageDiv);
      scrollToBottom();
    }
  }
  
  function showTypingIndicator(username) {
    // Don't show typing indicator for current user
    if (username === currentUser) return;
    
    // Remove existing indicator if any
    const existingIndicator = document.querySelector('.typing-indicator');
    if (existingIndicator) {
      if (existingIndicator.dataset.user === username) {
        // Already showing for this user, just reset the timer
        clearTimeout(existingIndicator.dataset.timer);
        existingIndicator.dataset.timer = setTimeout(() => {
          existingIndicator.remove();
        }, 2000);
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
    
    // Set timeout to remove the indicator
    indicator.dataset.timer = setTimeout(() => {
      indicator.remove();
    }, 2000);
    
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

  // Handle page refresh - maintain session
  window.addEventListener('beforeunload', () => {
    // You might want to save some state here if needed
  });
});
