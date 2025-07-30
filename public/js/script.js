document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const authContainer = document.getElementById('auth-container');
  const chatContainer = document.getElementById('chat-container');
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const logoutBtn = document.getElementById('logout-btn');
  const messageForm = document.getElementById('message-form');
  const messageInput = document.getElementById('message-input');
  const chatMessages = document.getElementById('chat-messages');
  
  // Socket.io connection
  const socket = io();
  
  // Tab switching
  loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  });
  
  registerTab.addEventListener('click', () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
  });
  
  // Check if user is already logged in
  const token = localStorage.getItem('chatToken');
  if (token) {
    verifyToken(token);
  }
  
  // Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('chatToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        showChatInterface(data.user);
        loadMessages();
      } else {
        showError(data.error);
      }
    } catch (error) {
      showError('An error occurred. Please try again.');
    }
  });
  
  // Register
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('chatToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        showChatInterface(data.user);
        loadMessages();
      } else {
        showError(data.error);
      }
    } catch (error) {
      showError('An error occurred. Please try again.');
    }
  });
  
  // Logout
  logoutBtn.addEventListener('click', async () => {
    try {
      const token = localStorage.getItem('chatToken');
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      localStorage.removeItem('chatToken');
      localStorage.removeItem('currentUser');
      showAuthInterface();
    } catch (error) {
      showError('An error occurred during logout.');
    }
  });
  
  // Send message
  messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = messageInput.value.trim();
    const token = localStorage.getItem('chatToken');
    
    if (!content) return;
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });
      
      if (response.ok) {
        messageInput.value = '';
      } else {
        const data = await response.json();
        showError(data.error);
      }
    } catch (error) {
      showError('Failed to send message.');
    }
  });
  
  // Socket.io message listener
  socket.on('message', (message) => {
    addMessageToChat(message);
  });
  
  // Helper functions
  function showAuthInterface() {
    authContainer.style.display = 'flex';
    chatContainer.style.display = 'none';
    loginForm.reset();
    registerForm.reset();
  }
  
  function showChatInterface(user) {
    authContainer.style.display = 'none';
    chatContainer.style.display = 'flex';
    document.querySelector('.chat-header h2').textContent = `Welcome, ${user.username}`;
  }
  
  function showError(message) {
    alert(message); // In a real app, you'd show this in a nicer way
  }
  
  async function verifyToken(token) {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const user = await response.json();
        localStorage.setItem('currentUser', JSON.stringify(user));
        showChatInterface(user);
        loadMessages();
      } else {
        localStorage.removeItem('chatToken');
        localStorage.removeItem('currentUser');
        showAuthInterface();
      }
    } catch (error) {
      localStorage.removeItem('chatToken');
      localStorage.removeItem('currentUser');
      showAuthInterface();
    }
  }
  
  async function loadMessages() {
    try {
      const token = localStorage.getItem('chatToken');
      const response = await fetch('/api/messages', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const messages = await response.json();
        chatMessages.innerHTML = '';
        messages.reverse().forEach(message => {
          addMessageToChat(message);
        });
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }
  
  function addMessageToChat(message) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const isCurrentUser = currentUser && message.sender._id === currentUser._id;
    
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(isCurrentUser ? 'sent' : 'received');
    
    const messageInfo = document.createElement('div');
    messageInfo.classList.add('message-info');
    messageInfo.innerHTML = `
      <span>${message.sender.username || message.senderUsername}</span>
      <span>${new Date(message.createdAt).toLocaleTimeString()}</span>
    `;
    
    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    messageContent.textContent = message.content;
    
    messageElement.appendChild(messageInfo);
    messageElement.appendChild(messageContent);
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});
