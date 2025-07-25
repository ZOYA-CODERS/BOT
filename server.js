const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

const mongoURL = 'YOUR_MONGODB_CONNECTION_STRING_HERE'; // Replace this!

mongoose.connect(mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

const requestSchema = new mongoose.Schema({
  name: String,
  message: String,
  reply: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
