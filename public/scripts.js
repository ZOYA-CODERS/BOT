document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const authContainer = document.getElementById('authContainer');
  const chatContainer = document.getElementById('chatContainer');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const showRegister = document.getElementById('showRegister');
  const showLogin = document.getElementById('showLogin');
  const loginButton = document.getElementById('loginButton');
  const registerButton = document.getElementById('registerButton');
  const logoutButton = document.getElementById('logoutButton');
  const messagesContainer = document.getElementById('messagesContainer');
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  
  // State
  let currentUser = null;
  
  // Event Listeners
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
  
  loginButton.addEventListener('click', handleLogin);
  registerButton.addEventListener('click', handleRegister);
  logoutButton.addEventListener('click', handleLogout);
  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  
  // Check if user is already logged in (from sessionStorage)
  checkAuthState();
  
  // Functions
  function checkAuthState() {
    const userData = sessionStorage.getItem('chatUser');
    if (userData) {
      currentUser = JSON.parse(userData);
      showChatInterface();
      loadMessages();
      startMessageListener();
    }
  }
  
  async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
      showError(loginForm, 'Please enter both email and password');
      return;
    }
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        currentUser = {
          id: data.userId,
          email: data.userEmail,
          name: data.userName
        };
        
        sessionStorage.setItem('chatUser', JSON.stringify(currentUser));
        showChatInterface();
        loadMessages();
        startMessageListener();
      } else {
        showError(loginForm, data.error || 'Login failed');
      }
    } catch (error) {
      showError(loginForm, 'An error occurred during login');
      console.error('Login error:', error);
    }
  }
  
  async function handleRegister() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    if (!email || !password) {
      showError(registerForm, 'Please enter both email and password');
      return;
    }
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess(registerForm, 'Registration successful! Please login.');
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        document.getElementById('loginEmail').value = email;
        document.getElementById('loginPassword').value = '';
      } else {
        showError(registerForm, data.error || 'Registration failed');
      }
    } catch (error) {
      showError(registerForm, 'An error occurred during registration');
      console.error('Registration error:', error);
    }
  }
  
  function handleLogout() {
    sessionStorage.removeItem('chatUser');
    currentUser = null;
    showAuthInterface();
  }
  
  function showAuthInterface() {
    authContainer.classList.remove('hidden');
    chatContainer.classList.add('hidden');
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('registerName').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';
    
    // Clear any existing error/success messages
    const existingMessages = document.querySelectorAll('.error-message, .success-message');
    existingMessages.forEach(msg => msg.remove());
  }
  
  function showChatInterface() {
    authContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    messageInput.focus();
  }
  
  function showError(formElement, message) {
    // Remove any existing error messages
    const existingError = formElement.querySelector('.error-message');
    if (existingError) existingError.remove();
    
    const errorElement = document.createElement('p');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    formElement.appendChild(errorElement);
  }
  
  function showSuccess(formElement, message) {
    // Remove any existing success messages
    const existingSuccess = formElement.querySelector('.success-message');
    if (existingSuccess) existingSuccess.remove();
    
    const successElement = document.createElement('p');
    successElement.className = 'success-message';
    successElement.textContent = message;
    formElement.appendChild(successElement);
  }
  
  async function loadMessages() {
    try {
      const response = await fetch('/api/messages');
      const messages = await response.json();
      
      messagesContainer.innerHTML = '';
      messages.forEach(message => {
        addMessageToUI(message);
      });
      
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }
  
  function startMessageListener() {
    // In a real app with WebSockets or Firebase client SDK, you'd listen for new messages here
    // For this simplified version, we'll poll every 5 seconds
    setInterval(loadMessages, 5000);
  }
  
  async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentUser) return;
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          userId: currentUser.id,
          userEmail: currentUser.email,
          userName: currentUser.name
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        messageInput.value = '';
        loadMessages(); // Refresh messages to show the new one
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
  
  function addMessageToUI(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${
      message.userId === currentUser?.id ? 'user-message' : 'other-message'
    }`;
    
    const messageText = document.createElement('div');
    messageText.textContent = message.text;
    
    const messageInfo = document.createElement('div');
    messageInfo.className = 'message-info';
    
    const senderName = document.createElement('span');
    senderName.textContent = message.userName || message.userEmail.split('@')[0];
    
    const messageTime = document.createElement('span');
    messageTime.textContent = formatTime(message.timestamp);
    
    messageInfo.appendChild(senderName);
    messageInfo.appendChild(messageTime);
    
    messageElement.appendChild(messageText);
    messageElement.appendChild(messageInfo);
    
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
  }
  
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
});
