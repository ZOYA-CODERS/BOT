document.addEventListener('DOMContentLoaded', () => {
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const messagesDiv = document.getElementById('messages');

  // Function to display messages
  function displayMessage(messageData) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    const messageInfo = document.createElement('div');
    messageInfo.classList.add('message-info');
    messageInfo.textContent = `${messageData.email} at ${new Date(messageData.timestamp).toLocaleTimeString()}`;
    
    const messageText = document.createElement('div');
    messageText.textContent = messageData.text;
    
    messageElement.appendChild(messageInfo);
    messageElement.appendChild(messageText);
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // Function to clean up old messages
  function cleanupOldMessages() {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    database.ref('messages').orderByChild('timestamp').endAt(cutoff).once('value', snapshot => {
      const updates = {};
      snapshot.forEach(child => {
        updates[child.key] = null;
      });
      if (Object.keys(updates).length > 0) {
        database.ref('messages').update(updates);
      }
    });
  }

  // Send message function
  sendBtn.addEventListener('click', () => {
    const messageText = messageInput.value.trim();
    if (messageText === '') return;

    const user = auth.currentUser;
    if (!user) return;

    const messageData = {
      text: messageText,
      email: user.email,
      timestamp: Date.now()
    };

    database.ref('messages').push(messageData)
      .then(() => {
        messageInput.value = '';
      })
      .catch(error => {
        console.error('Error sending message:', error);
      });
  });

  // Listen for new messages
  database.ref('messages').orderByChild('timestamp').startAt(Date.now() - 24 * 60 * 60 * 1000).on('child_added', snapshot => {
    displayMessage(snapshot.val());
  });

  // Run cleanup periodically (every hour)
  setInterval(cleanupOldMessages, 60 * 60 * 1000);
  cleanupOldMessages(); // Run once on load
});
