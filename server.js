const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

mongoose.connect('mongodb+srv://Zoya_coderz:Passed123%23@cluster0.lodgdul.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const messageSchema = new mongoose.Schema({
  text: String,
  time: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messageSchema);

app.use(express.static('public'));

io.on('connection', async (socket) => {
  const lastMessages = await Message.find().sort({ time: -1 }).limit(25);
  socket.emit('loadMessages', lastMessages.reverse());

  socket.on('chat message', async (msg) => {
    const newMsg = new Message({ text: msg });
    await newMsg.save();
    io.emit('chat message', msg);
  });
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
