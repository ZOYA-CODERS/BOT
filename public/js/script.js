document.addEventListener('DOMContentLoaded', () => {
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
  
  let currentUser = null;
  const socket = io();
  
  // Check if user is already logged in
  checkSession();
  
  // Event listeners
  showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  });
  
  showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });
  
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        currentUser = username;
        showChat();
        loadMessages();
      } else {
        alert(data.message || 'Login failed');
      }
    });
  });
  
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    
    fetch('/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        currentUser = username;
        showChat();
        loadMessages();
      } else {
        alert(data.message || 'Registration failed');
      }
    });
  });
  
  logoutBtn.addEventListener('click', () => {
    fetch('/logout', { method: 'POST' })
      .then(() => {
        currentUser = null;
        showLoginForm();
      });
  });
  
  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  // Socket.io events
  socket.on('chat message', (msg) => {
    addMessage(msg);
  });
  
  // Functions
  function checkSession() {
    // In a real app, you would check with the server
    // For simplicity, we'll just check localStorage
    const user = localStorage.getItem('chatUser');
    if (user) {
      currentUser = user;
      showChat();
      loadMessages();
    }
  }
  
  function showChat() {
    loginContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    localStorage.setItem('chatUser', currentUser);
    messageInput.focus();
  }
  
  function showLoginForm() {
    chatContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    localStorage.removeItem('chatUser');
  }
  
  function loadMessages() {
    fetch('/messages')
      .then(response => response.json())
      .then(messages => {
        messageContainer.innerHTML = '';
        messages.forEach(msg => addMessage(msg));
        scrollToBottom();
      });
  }
  
  function sendMessage() {
    const text = messageInput.value.trim();
    if (text && currentUser) {
      const message = {
        username: currentUser,
        text: text
      };
      socket.emit('chat message', message);
      messageInput.value = '';
    }
  }
  
  function addMessage(msg) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    
    if (msg.username === currentUser) {
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
