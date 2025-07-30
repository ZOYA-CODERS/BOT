<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Beautiful Chat</title>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="app-container">
    <div class="auth-container" id="authContainer">
      <div class="auth-form" id="loginForm">
        <h2>Login</h2>
        <input type="email" id="loginEmail" placeholder="Email" required>
        <input type="password" id="loginPassword" placeholder="Password" required>
        <button id="loginButton">Login</button>
        <p>Don't have an account? <a href="#" id="showRegister">Register</a></p>
      </div>
      
      <div class="auth-form hidden" id="registerForm">
        <h2>Register</h2>
        <input type="text" id="registerName" placeholder="Your Name">
        <input type="email" id="registerEmail" placeholder="Email" required>
        <input type="password" id="registerPassword" placeholder="Password" required>
        <button id="registerButton">Register</button>
        <p>Already have an account? <a href="#" id="showLogin">Login</a></p>
      </div>
    </div>
    
    <div class="chat-container hidden" id="chatContainer">
      <div class="chat-header">
        <h2>Beautiful Chat</h2>
        <button id="logoutButton">Logout</button>
      </div>
      
      <div class="messages-container" id="messagesContainer">
        <!-- Messages will be loaded here -->
      </div>
      
      <div class="message-input">
        <input type="text" id="messageInput" placeholder="Type your message...">
        <button id="sendButton">Send</button>
      </div>
    </div>
  </div>
  
  <script src="scripts.js"></script>
</body>
</html>
