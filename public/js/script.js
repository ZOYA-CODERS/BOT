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

  try {
    // Initialize Firebase
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    const database = firebase.database();
    const auth = firebase.auth();
  } catch (error) {
    console.error("Firebase initialization error:", error);
    showAlert("Failed to initialize Firebase. Please try again later.");
    return;
  }
  
  // DOM Elements
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const showRegister = document.getElementById('show-register');
  const showLogin = document.getElementById('show-login');
  const loginContainer = document.getElementById('login-container');
  const chatContainer = document.getElementById('chat-container');
  const messageContainer = document.getElementById('message-container');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const menuBtn = document.getElementById('menu-btn');
  const menuDropdown = document.getElementById('menu-dropdown');
  const logoutBtn = document.getElementById('logout-btn');
  const bingoLogo = document.getElementById('bingo-logo');
  
  // Check if elements exist before adding event listeners
  if (!loginForm || !registerForm || !showRegister || !showLogin || !messageContainer || !messageInput || !sendBtn) {
    console.error("Required elements not found in DOM");
    return;
  }

  let currentUser = null;
  
  // Event listeners
  showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    toggleForms(false);
  });
  
  showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    toggleForms(true);
  });
  
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleLogin(e);
  });
  
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleRegister(e);
  });

  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  if (menuBtn) menuBtn.addEventListener('click', toggleMenu);
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  if (bingoLogo) bingoLogo.addEventListener('click', () => {
    if (menuDropdown) menuDropdown.classList.add('hidden');
  });

  // Initialize the application
  checkAuthState();

  function toggleForms(showLogin) {
    if (loginForm && registerForm) {
      loginForm.classList.toggle('hidden', !showLogin);
      registerForm.classList.toggle('hidden', showLogin);
      
      // Clear forms when toggling
      if (showLogin) {
        registerForm.reset();
      } else {
        loginForm.reset();
      }
    }
  }
  
  async function handleLogin(e) {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
      showAlert("Please enter both username and password");
      return;
    }
    
    // For Firebase Auth, we need email, so we'll assume username is email
    const email = username.includes('@') ? username : `${username}@bingoo.com`;
    
    try {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      currentUser = userCredential.user;
      
      // Check if email is verified
      if (!currentUser.emailVerified) {
        showAlert("Please verify your email before logging in. Check your inbox.");
        await firebase.auth().signOut();
        return;
      }
      
      showChat();
      setupDatabaseListeners();
    } catch (error) {
      let errorMessage = "Login failed. Please try again.";
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "No user found with this username.";
          break;
        case 'auth/wrong-password':
          errorMessage = "Incorrect password.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid username format.";
          break;
        case 'auth/user-disabled':
          errorMessage = "This account has been disabled.";
          break;
      }
      showAlert(errorMessage);
      console.error("Login error:", error);
    }
  }
  
  async function handleRegister(e) {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    
    if (!username || !password) {
      showAlert("Please enter both username and password");
      return;
    }
    
    if (password.length < 6) {
      showAlert("Password must be at least 6 characters");
      return;
    }
    
    // For Firebase Auth, we need email, so we'll assume username is email or create one
    const email = username.includes('@') ? username : `${username}@bingoo.com`;
    
    try {
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      currentUser = userCredential.user;
      
      // Send verification email
      await currentUser.sendEmailVerification();
      
      // Save additional user data to database
      const usersRef = firebase.database().ref('users');
      await usersRef.child(currentUser.uid).set({
        username: username,
        email: email,
        createdAt: firebase.database.ServerValue.TIMESTAMP
      });
      
      showAlert('Registration successful! Please check your email for verification.');
      toggleForms(true); // Switch back to login form
      registerForm.reset();
    } catch (error) {
      let errorMessage = "Registration failed. Please try again.";
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "This username is already registered.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid username format.";
          break;
        case 'auth/weak-password':
          errorMessage = "Password is too weak.";
          break;
      }
      showAlert(errorMessage);
      console.error("Registration error:", error);
    }
  }

  function checkAuthState() {
    firebase.auth().onAuthStateChanged((user) => {
      if (user && user.emailVerified) {
        currentUser = user;
        showChat();
        setupDatabaseListeners();
      } else {
        showLoginForm();
      }
    });
  }
  
  function showChat() {
    if (loginContainer) loginContainer.classList.add('hidden');
    if (chatContainer) chatContainer.classList.remove('hidden');
    if (messageInput) messageInput.focus();
  }
  
  function showLoginForm() {
    if (chatContainer) chatContainer.classList.add('hidden');
    if (loginContainer) loginContainer.classList.remove('hidden');
    toggleForms(true);
  }
  
  function showAlert(message) {
    // You can replace this with a more elegant notification system
    alert(message);
  }

  function toggleMenu() {
    if (menuDropdown) menuDropdown.classList.toggle('hidden');
  }

  async function handleLogout() {
    try {
      await firebase.auth().signOut();
      currentUser = null;
      showLoginForm();
      if (menuDropdown) menuDropdown.classList.add('hidden');
    } catch (error) {
      console.error("Logout error:", error);
      showAlert("Failed to logout. Please try again.");
    }
  }

  function setupDatabaseListeners() {
    if (!currentUser) return;

    // Clear previous messages
    if (messageContainer) messageContainer.innerHTML = '';

    // Reference to the messages in database
    const messagesRef = firebase.database().ref('messages').limitToLast(100);
    
    // Listen for new messages
    messagesRef.on('child_added', (snapshot) => {
      const message = snapshot.val();
      displayMessage(message);
    });
  }

  function displayMessage(message) {
    if (!messageContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    
    // Check if the message is from the current user
    if (message.userId === currentUser.uid) {
      messageDiv.classList.add('sent');
    } else {
      messageDiv.classList.add('received');
    }

    const senderName = document.createElement('span');
    senderName.classList.add('sender');
    senderName.textContent = message.username || 'Anonymous';
    
    const messageText = document.createElement('p');
    messageText.textContent = message.text;
    
    const timestamp = document.createElement('span');
    timestamp.classList.add('timestamp');
    timestamp.textContent = formatTimestamp(message.timestamp);
    
    messageDiv.appendChild(senderName);
    messageDiv.appendChild(messageText);
    messageDiv.appendChild(timestamp);
    
    messageContainer.appendChild(messageDiv);
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }

  function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function sendMessage() {
    if (!currentUser || !messageInput || !messageInput.value.trim()) return;

    const messageText = messageInput.value.trim();
    const username = currentUser.email.split('@')[0]; // Get username from email
    
    // Create message object
    const message = {
      text: messageText,
      username: username,
      userId: currentUser.uid,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    // Push message to database
    firebase.database().ref('messages').push(message)
      .then(() => {
        messageInput.value = ''; // Clear input
      })
      .catch((error) => {
        console.error("Error sending message:", error);
        showAlert("Failed to send message. Please try again.");
      });
  }
});
