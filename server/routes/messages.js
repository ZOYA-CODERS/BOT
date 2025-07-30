const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Get all messages
router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'username');
      
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a message
router.post('/', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    const message = new Message({
      content,
      sender: req.user._id,
      senderUsername: req.user.username
    });
    
    await message.save();
    
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
