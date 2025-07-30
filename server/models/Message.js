const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderUsername: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  }
}, {
  timestamps: true
});

// Create TTL index for auto-deletion
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to clean old messages
messageSchema.statics.cleanOldMessages = async function() {
  try {
    const result = await this.deleteMany({ 
      expiresAt: { $lte: new Date() } 
    });
    console.log(`Cleaned ${result.deletedCount} old messages`);
  } catch (error) {
    console.error('Error cleaning old messages:', error);
  }
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
module.exports.cleanOldMessages = messageSchema.statics.cleanOldMessages;
