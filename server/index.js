require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const validator = require('validator');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  points: 10, // 10 points
  duration: 1, // per second
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ephemeral-chat', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Message model
const Message = require('./models/Message');

// Routes
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find({
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 }).limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Socket.io setup
const io = socketio(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join', async (username, callback) => {
    try {
      // Validate username
      if (!username || !validator.isAlphanumeric(username.replace(/_/g, '')) || username.length > 20) {
        throw new Error('Invalid username. Only alphanumeric characters and underscores are allowed (max 20 chars).');
      }

      // Rate limiting
      try {
        await rateLimiter.consume(socket.handshake.address);
      } catch (rlRejected) {
        throw new Error('Too many requests. Please try again later.');
      }

      socket.username = username;
      socket.join('main');
      
      // Notify others
      socket.broadcast.to('main').emit('userJoined', username);
      
      // Send current users
      const users = [];
      const sockets = await io.in('main').fetchSockets();
      sockets.forEach(s => {
        if (s.username) users.push(s.username);
      });
      io.to('main').emit('userList', users);
      
      callback({ status: 'ok' });
    } catch (err) {
      callback({ status: 'error', message: err.message });
    }
  });

  socket.on('sendMessage', async (message, callback) => {
    try {
      if (!socket.username) {
        throw new Error('You must join the chat first');
      }

      // Validate message
      if (!message || message.length > 500) {
        throw new Error('Message must be between 1 and 500 characters');
      }

      // Rate limiting
      try {
        await rateLimiter.consume(socket.handshake.address);
      } catch (rlRejected) {
        throw new Error('Too many messages. Please slow down.');
      }

      // Create message with 24-hour expiration
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const newMessage = new Message({
        username: socket.username,
        text: message,
        expiresAt
      });

      await newMessage.save();

      // Broadcast to all
      io.to('main').emit('newMessage', {
        username: socket.username,
        text: message,
        createdAt: newMessage.createdAt,
        expiresAt
      });

      callback({ status: 'ok' });
    } catch (err) {
      callback({ status: 'error', message: err.message });
    }
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      io.to('main').emit('userLeft', socket.username);
    }
    console.log('Client disconnected');
  });
});

// Cleanup expired messages every hour
setInterval(async () => {
  try {
    await Message.deleteMany({ expiresAt: { $lt: new Date() } });
    console.log('Cleaned up expired messages');
  } catch (err) {
    console.error('Error cleaning up messages:', err);
  }
}, 60 * 60 * 1000);
