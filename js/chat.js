let currentUser = null;

function loadChat(user) {
    currentUser = user;
    
    // Get username from database
    database.ref('users/' + user.uid).once('value')
        .then(function(snapshot) {
            const username = snapshot.val().username;
            currentUser.username = username;
            
            // Setup message sending
            setupMessageSending(username);
            
            // Load messages
            loadMessages();
            
            // Setup automatic message cleanup check
            setInterval(checkForOldMessages, 3600000); // Check every hour
        });
}

function setupMessageSending(username) {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    
    function sendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText === '') return;
        
        const timestamp = Date.now();
        
        database.ref('messages').push().set({
            username: username,
            text: messageText,
            timestamp: timestamp,
            userId: currentUser.uid
        })
        .then(function() {
            messageInput.value = '';
        })
        .catch(function(error) {
            console.error('Error sending message:', error);
        });
    }
    
    sendBtn.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

function loadMessages() {
    const messagesRef = database.ref('messages').orderByChild('timestamp');
    const messagesContainer = document.getElementById('messages');
    
    messagesRef.on('child_added', function(snapshot) {
        const message = snapshot.val();
        displayMessage(message);
    });
}

function displayMessage(message) {
    const messagesContainer = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    
    const time = new Date(message.timestamp);
    const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageElement.innerHTML = `
        <div>
            <span class="username">${message.username}</span>
            <span class="time">${timeString}</span>
        </div>
        <div class="content">${message.text}</div>
    `;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function checkForOldMessages() {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    database.ref('messages').orderByChild('timestamp').endAt(twentyFourHoursAgo).once('value')
        .then(function(snapshot) {
            const updates = {};
            
            snapshot.forEach(function(childSnapshot) {
                updates[childSnapshot.key] = null;
            });
            
            if (Object.keys(updates).length > 0) {
                return database.ref('messages').update(updates);
            }
        })
        .catch(function(error) {
            console.error('Error cleaning up old messages:', error);
        });
}
