const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

mongoose.connect("mongodb+srv://Zoya_coderz:@Passed123#@cluster0.lodgdul.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Message = mongoose.model("Message", new mongoose.Schema({
  username: String,
  message: String,
  time: { type: Date, default: Date.now },
}));
