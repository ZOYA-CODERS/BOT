// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// DOM elements
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const usernameDisplay = document.getElementById('username-display');
const changeNameBtn = document.getElementById('change-name-btn');
const nameModal = document.getElementById('name-modal');
const nameInput = document.getElementById('name-input');
const saveNameBtn = document.getElementById('save-name-btn');

// User data
let username = localStorage.getItem('username') || 'Guest';

// Initialize the app
function init() {
    usernameDisplay.textContent = username;
    loadMessages();
    setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    changeNameBtn.addEventListener('click', () => {
        nameModal.classList.add('active');
        nameInput.value = username === 'Guest' ? '' : username;
        nameInput.focus();
    });
    
    saveNameBtn.addEventListener('click', saveUsername);
    
    // Close modal when clicking outside
    nameModal.addEventListener('click', (e) => {
        if (e.target === nameModal) {
            nameModal.classList.remove('active');
        }
    });
}

// Send message to Firebase
function sendMessage() {
    const messageText = messageInput.value.trim();
    if (messageText === '') return;
    
    const timestamp = new Date().getTime();
    const message = {
        text: messageText,
        username: username,
        timestamp: timestamp
    };
    
    database.ref('messages').push(message);
    messageInput.value = '';
}

// Load messages from Firebase
function loadMessages() {
    database.ref('messages').on('child_added', (snapshot) => {
        const message = snapshot.val();
        displayMessage(message);
    });
}

// Display a message in the chat
function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    // Determine if the message is from the current user
    if (message.username === username) {
        messageElement.classList.add('sent');
    } else {
        messageElement.classList.add('received');
    }
    
    const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageElement.innerHTML = `
        <div class="message-text">${message.text}</div>
        <div class="message-info">
            <span>${message.username}</span>
            <span>${formattedTime}</span>
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Save username to localStorage
function saveUsername() {
    const newUsername = nameInput.value.trim() || 'Guest';
    if (newUsername !== username) {
        username = newUsername;
        localStorage.setItem('username', username);
        usernameDisplay.textContent = username;
    }
    nameModal.classList.remove('active');
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
