import { 
  auth, 
  database, 
  ref, 
  set, 
  onValue, 
  off,
  onAuthStateChanged,
  serverTimestamp
} from './firebase-config.js';
import { updateUI } from './auth.js';

// DOM elements
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const chatMessages = document.getElementById('chatMessages');
const connectionStatus = document.getElementById('connectionStatus');
const statusDot = connectionStatus.querySelector('.status-dot');
const statusText = connectionStatus.querySelector('.status-text');

// Connection state monitoring
const connectedRef = ref(database, '.info/connected');

onValue(connectedRef, (snap) => {
  if (snap.val() === true) {
    console.log('Firebase connection established');
    statusDot.classList.add('connected');
    statusDot.classList.remove('disconnected');
    statusText.textContent = 'Connected';
  } else {
    console.log('Firebase connection lost');
    statusDot.classList.add('disconnected');
    statusDot.classList.remove('connected');
    statusText.textContent = 'Disconnected';
  }
});

// Initialize app
function init() {
  // Listen for auth state changes
  onAuthStateChanged(auth, (user) => {
    updateUI(user);
    
    if (user) {
      // User is signed in, load messages
      loadMessages();
    } else {
      // User is signed out, clean up
      cleanupChat();
    }
  });

  // Send message
  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
}

// Load messages from Firebase
function loadMessages() {
  const messagesRef = ref(database, 'messages');
  
  onValue(messagesRef, (snapshot) => {
    chatMessages.innerHTML = ''; // Clear existing messages
    
    if (snapshot.exists()) {
      const messages = [];
      
      // Convert snapshot to array
      snapshot.forEach((childSnapshot) => {
        messages.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      
      // Sort by timestamp (oldest first)
      messages.sort((a, b) => a.timestamp - b.timestamp);
      
      // Display messages
      messages.forEach((message) => {
        displayMessage(message);
      });
      
      // Scroll to bottom
      scrollToBottom();
    } else {
      chatMessages.innerHTML = '<div class="no-messages">No messages yet. Be the first to say hello!</div>';
    }
  });
}

// Display a message in the chat
function displayMessage(message) {
  const isCurrentUser = message.senderId === auth.currentUser?.uid;
  const messageElement = document.createElement('div');
  
  messageElement.classList.add('message');
  messageElement.classList.add(isCurrentUser ? 'sent' : 'received');
  
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  messageElement.innerHTML = `
    ${!isCurrentUser ? `<div class="message-sender">${message.senderName}</div>` : ''}
    <div class="message-text">${escapeHtml(message.text)}</div>
    <div class="message-info">
      <span>${formattedTime}</span>
    </div>
  `;
  
  chatMessages.appendChild(messageElement);
}

// Send a new message
function sendMessage() {
  const text = messageInput.value.trim();
  
  if (text && auth.currentUser) {
    const user = auth.currentUser;
    const newMessageRef = ref(database, 'messages').push();
    
    set(newMessageRef, {
      senderId: user.uid,
      senderName: user.displayName || 'Anonymous',
      text: text,
      timestamp: serverTimestamp()
    }).catch((error) => {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    });
    
    messageInput.value = '';
  }
}

// Clean up chat when user logs out
function cleanupChat() {
  // Remove all message listeners
  const messagesRef = ref(database, 'messages');
  off(messagesRef);
  
  // Clear chat
  chatMessages.innerHTML = '';
}

// Scroll chat to bottom
function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Basic HTML escaping for security
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
