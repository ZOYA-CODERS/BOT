const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    validate(value) {
      if (!validator.isAlphanumeric(value)) {
        throw new Error('Username must be alphanumeric');
      }
    }
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true
});

// Generate auth token
userSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET || 'chatappsecret');
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

// Hash plain text password before saving
userSchema.pre('save', async function(next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

// Find user by credentials
userSchema.statics.findByCredentials = async (username, password) => {
  const user = await User.findOne({ username });
  if (!user) {
    throw new Error('Unable to login');
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Unable to login');
  }
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
