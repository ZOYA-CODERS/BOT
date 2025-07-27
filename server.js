const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// In-memory storage (replace with database in production)
const users = [];
const messages = [];

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Serve static files
app.use(express.static('public'));

// Routes
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  
  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user = user;
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  
  if (users.some(u => u.username === username)) {
    return res.json({ success: false, message: 'Username already exists' });
  }
  
  const hashedPassword = bcrypt.hashSync(password, 8);
  const user = { username, password: hashedPassword };
  users.push(user);
  req.session.user = user;
  res.json({ success: true });
});

app.get('/messages', (req, res) => {
  res.json(messages.slice(-50)); // Return last 50 messages
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('a user connected');
  
  socket.on('chat message', (msg) => {
    const message = {
      username: msg.username,
      text: msg.text,
      timestamp: new Date().toISOString()
    };
    messages.push(message);
    if (messages.length > 100) messages.shift(); // Keep only last 100 messages
    io.emit('chat message', message);
  });
  
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
