<!DOCTYPE html>
<html>
<head>
  <title>Chat Room</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="chat-container">
    <div id="chat-box"></div>
    <form id="chat-form">
      <input type="hidden" id="username" value="<%= username %>" />
      <input type="text" id="message" placeholder="Type message..." required />
      <button>Send</button>
    </form>
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    const chatBox = document.getElementById("chat-box");
    const username = document.getElementById("username").value;

    socket.on("loadMessages", msgs => {
      msgs.forEach(m => addMessage(m.username, m.message));
    });

    socket.on("newMessage", data => {
      addMessage(data.username, data.message);
    });

    document.getElementById("chat-form").addEventListener("submit", e => {
      e.preventDefault();
      const msg = document.getElementById("message").value;
      socket.emit("sendMessage", { username, message: msg });
      document.getElementById("message").value = "";
    });
function addMessage(user, text) {
      const msg = document.createElement("div");
      msg.innerHTML = `<strong>user:</strong>{text}`;
      chatBox.appendChild(msg);
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  </script>
</body>
</html>
