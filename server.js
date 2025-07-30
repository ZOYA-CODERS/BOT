const express = require('express');
const socketio = require('socket.io');
const moment = require('moment');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Start server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Socket.io setup
const io = socketio(server);

// Store messages with timestamps
let messages = [];

// Clean up old messages periodically
setInterval(() => {
    const now = moment();
    messages = messages.filter(msg => {
        const msgTime = moment(msg.timestamp);
        return now.diff(msgTime, 'hours') < 24;
    });
}, 3600000); // Check every hour

io.on('connection', (socket) => {
    console.log('New user connected');

    // Send existing messages to new user
    socket.emit('load messages', messages);

    // Listen for new user joining
    socket.on('join', (username) => {
        socket.username = username;
        socket.broadcast.emit('user joined', username);
    });

    // Listen for new messages
    socket.on('chat message', (msg) => {
        const message = {
            username: socket.username,
            text: msg,
            timestamp: moment().format()
        };
        messages.push(message);
        io.emit('chat message', message);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        if (socket.username) {
            io.emit('user left', socket.username);
        }
    });
});
