import { 
  auth, 
  googleProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  signInWithPopup,
  database,
  ref,
  set,
  onDisconnect
} from './firebase-config.js';

// DOM elements
const authContainer = document.getElementById('authContainer');
const chatContainer = document.getElementById('chatContainer');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const googleAuthBtn = document.getElementById('googleAuthBtn');
const logoutButton = document.getElementById('logoutButton');
const userAvatar = document.getElementById('userAvatar');
const userProfile = document.getElementById('userProfile');

// Tab switching
loginTab.addEventListener('click', () => {
  loginTab.classList.add('active');
  registerTab.classList.remove('active');
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
});

registerTab.addEventListener('click', () => {
  registerTab.classList.add('active');
  loginTab.classList.remove('active');
  registerForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
});

// Email/Password Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    showAuthError(error);
  }
});

// Email/Password Registration
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  
  if (password.length < 8) {
    showAuthError({ message: 'Password must be at least 8 characters' });
    return;
  }
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Update user profile with display name
    await updateUserProfile(name);
    // Create user in database
    await createUserInDatabase(userCredential.user.uid, name, email);
  } catch (error) {
    showAuthError(error);
  }
});

// Google Authentication
googleAuthBtn.addEventListener('click', async () => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;
    
    // Check if user is new
    if (userCredential._tokenResponse.isNewUser) {
      await createUserInDatabase(user.uid, user.displayName, user.email);
    }
  } catch (error) {
    showAuthError(error);
  }
});

// Logout
logoutButton.addEventListener('click', async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
  }
});

// Update user profile in Firebase Auth
async function updateUserProfile(displayName, photoURL = null) {
  try {
    await updateProfile(auth.currentUser, {
      displayName,
      photoURL
    });
  } catch (error) {
    console.error('Error updating profile:', error);
  }
}

// Create user in Realtime Database
async function createUserInDatabase(uid, name, email) {
  try {
    await set(ref(database, `users/${uid}`), {
      name,
      email,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });
    
    // Set up presence system
    const presenceRef = ref(database, `presence/${uid}`);
    await set(presenceRef, true);
    await onDisconnect(presenceRef).set(false);
  } catch (error) {
    console.error('Error creating user in database:', error);
  }
}

// Show authentication errors
function showAuthError(error) {
  let errorMessage = 'Authentication failed. Please try again.';
  
  switch (error.code) {
    case 'auth/email-already-in-use':
      errorMessage = 'Email is already in use.';
      break;
    case 'auth/invalid-email':
      errorMessage = 'Invalid email address.';
      break;
    case 'auth/weak-password':
      errorMessage = 'Password should be at least 8 characters.';
      break;
    case 'auth/user-not-found':
      errorMessage = 'User not found. Please register.';
      break;
    case 'auth/wrong-password':
      errorMessage = 'Incorrect password.';
      break;
    case 'auth/too-many-requests':
      errorMessage = 'Too many attempts. Try again later.';
      break;
    case 'auth/popup-closed-by-user':
      return; // Don't show error if user closed popup
    default:
      console.error('Auth error:', error);
  }
  
  alert(errorMessage);
}

// Update UI based on auth state
export function updateUI(user) {
  if (user) {
    // User is signed in
    authContainer.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    
    // Update user profile display
    const displayName = user.displayName || 'User';
    const firstLetter = displayName.charAt(0).toUpperCase();
    document.querySelector('.user-name').textContent = displayName;
    userAvatar.textContent = firstLetter;
    
    // If user has photo URL, use it
    if (user.photoURL) {
      userAvatar.innerHTML = `<img src="${user.photoURL}" alt="${displayName}">`;
    }
  } else {
    // User is signed out
    authContainer.classList.remove('hidden');
    chatContainer.classList.add('hidden');
    
    // Reset forms
    loginForm.reset();
    registerForm.reset();
  }
}
