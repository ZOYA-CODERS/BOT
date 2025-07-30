document.addEventListener('DOMContentLoaded', () => {
  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyDhiYhW5vlzumEScjaNXywh_JLVNRMWwy8",
    authDomain: "zoya-694aa.firebaseapp.com",
    databaseURL: "https://zoya-694aa-default-rtdb.firebaseio.com",
    projectId: "zoya-694aa",
    storageBucket: "zoya-694aa.firebasestorage.app",
    messagingSenderId: "274392639729",
    appId: "1:274392639729:web:6386ac182bae69e4c0a150"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();
  const auth = firebase.auth();

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
  
  let currentUser = null;

  // Check if user is already logged in
  checkAuthState();

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
    const email = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        currentUser = userCredential.user;
        showChat();
        loadMessages();
        setupMessageCleanup();
      })
      .catch((error) => {
        alert(error.message);
      });
  });
  
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    
    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        currentUser = userCredential.user;
        showChat();
        loadMessages();
        setupMessageCleanup();
      })
      .catch((error) => {
        alert(error.message);
      });
  });
  
  logoutBtn.addEventListener('click', () => {
    auth.signOut()
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

  // Functions
  function checkAuthState() {
    auth.onAuthStateChanged((user) => {
      if (user) {
        currentUser = user;
        showChat();
        loadMessages();
        setupMessageCleanup();
      } else {
        showLoginForm();
      }
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
  }
  
  function loadMessages() {
    const messagesRef = database.ref('messages').orderByChild('timestamp');
    
    messagesRef.on('value', (snapshot) => {
      messageContainer.innerHTML = '';
      const messages = [];
      
      snapshot.forEach((childSnapshot) => {
        messages.push(childSnapshot.val());
      });
      
      // Sort messages by timestamp (oldest first)
      messages.sort((a, b) => a.timestamp - b.timestamp);
      
      messages.forEach(msg => addMessage(msg));
      scrollToBottom();
    });
  }
  
  function sendMessage() {
    const text = messageInput.value.trim();
    if (text && currentUser) {
      const message = {
        username: currentUser.email,
        text: text,
        timestamp: Date.now()
      };
      
      // Push message to Firebase
      database.ref('messages').push(message)
        .then(() => {
          messageInput.value = '';
        })
        .catch((error) => {
          console.error("Error sending message:", error);
        });
    }
  }
  
  function addMessage(msg) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    
    if (msg.username === currentUser.email) {
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
  
  function setupMessageCleanup() {
    // Run cleanup every hour
    setInterval(cleanupOldMessages, 60 * 60 * 1000);
    // Also run it immediately
    cleanupOldMessages();
  }
  
  function cleanupOldMessages() {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    database.ref('messages').orderByChild('timestamp').endAt(twentyFourHoursAgo).once('value')
      .then((snapshot) => {
        const updates = {};
        
        snapshot.forEach((childSnapshot) => {
          updates[childSnapshot.key] = null;
        });
        
        if (Object.keys(updates).length > 0) {
          return database.ref('messages').update(updates);
        }
      })
      .catch((error) => {
        console.error("Error cleaning up messages:", error);
      });
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
