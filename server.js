const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

const mongoURL = 'mongodb+srv://Zoya_coderz:@Passed123#@cluster0.lodgdul.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Replace this!

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
