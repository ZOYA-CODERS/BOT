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
  
  // Check if elements exist before adding event listeners
  if (!loginForm || !registerForm || !showRegister || !showLogin) {
    console.error("Required form elements not found in DOM");
    return;
  }

  let currentUser = null;
  
  // Event listeners
  showRegister?.addEventListener('click', (e) => {
    e.preventDefault();
    toggleForms(false);
  });
  
  showLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    toggleForms(true);
  });
  
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleLogin(e);
  });
  
  registerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleRegister(e);
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
    const email = document.getElementById('login-username')?.value;
    const password = document.getElementById('login-password')?.value;
    
    if (!email || !password) {
      showAlert("Please enter both email and password");
      return;
    }
    
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
          errorMessage = "No user found with this email.";
          break;
        case 'auth/wrong-password':
          errorMessage = "Incorrect password.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email format.";
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
    const email = document.getElementById('register-username')?.value;
    const password = document.getElementById('register-password')?.value;
    
    if (!email || !password) {
      showAlert("Please enter both email and password");
      return;
    }
    
    if (password.length < 6) {
      showAlert("Password must be at least 6 characters");
      return;
    }
    
    try {
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      currentUser = userCredential.user;
      
      // Send verification email
      await currentUser.sendEmailVerification();
      
      // Save additional user data to database
      const usersRef = firebase.database().ref('users');
      await usersRef.child(currentUser.uid).set({
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
          errorMessage = "This email is already registered.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email format.";
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
  }
  
  function showLoginForm() {
    if (chatContainer) chatContainer.classList.add('hidden');
    if (loginContainer) loginContainer.classList.remove('hidden');
    toggleForms(true);
  }
  
  function showAlert(message) {
    // Replace with your preferred alert/notification system
    alert(message);
  }

  // ... rest of your existing code (setupDatabaseListeners, etc.)
});
