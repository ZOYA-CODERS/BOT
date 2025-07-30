document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const loginContainer = document.getElementById('login-container');
    const chatContainer = document.getElementById('chat-container');
    const usernameInput = document.getElementById('username');
    const loginBtn = document.getElementById('login-btn');
    const messagesContainer = document.getElementById('messages');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');

    // Handle login
    loginBtn.addEventListener('click', () => {
        const username = usernameInput.value.trim();
        if (username) {
            socket.emit('join', username);
            loginContainer.classList.add('hidden');
            chatContainer.classList.remove('hidden');
            messageInput.focus();
        }
    });

    // Allow login on Enter key
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loginBtn.click();
        }
    });

    // Handle sending messages
    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            socket.emit('chat message', message);
            messageInput.value = '';
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Display new messages
    socket.on('chat message', (msg) => {
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.innerHTML = `
            <span class="username">${msg.username}</span>
            <span class="timestamp">${formatTime(msg.timestamp)}</span>
            <div class="text">${msg.text}</div>
        `;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });

    // Display notification when user joins
    socket.on('user joined', (username) => {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = `${username} joined the chat`;
        messagesContainer.appendChild(notification);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });

    // Display notification when user leaves
    socket.on('user left', (username) => {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = `${username} left the chat`;
        messagesContainer.appendChild(notification);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });

    // Load existing messages
    socket.on('load messages', (msgs) => {
        messagesContainer.innerHTML = '';
        msgs.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            messageElement.innerHTML = `
                <span class="username">${msg.username}</span>
                <span class="timestamp">${formatTime(msg.timestamp)}</span>
                <div class="text">${msg.text}</div>
            `;
            messagesContainer.appendChild(messageElement);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });

    // Format timestamp
    function formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
});
