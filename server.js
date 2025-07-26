const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const socketio = require("socket.io");
const bodyParser = require("body-parser");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

mongoose.connect("mongodb+srv://Zoya_coderz:@Passed123#@cluster0.lodgdul.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", { useNewUrlParser: true, useUnifiedTopology: true });

const Message = mongoose.model("Message", new mongoose.Schema({
  username: String,
  message: String,
  time: { type: Date, default: Date.now }
}));

const adminPassword = "@Passed123#"; // change this!

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/admin", (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
});

app.post("/admin", (req, res) => {
  if (req.body.password === adminPassword) {
    res.redirect("/");
  } else {
    res.send("Wrong password");
  }
});

io.on("connection", async (socket) => {
  const lastMessages = await Message.find().sort({ time: -1 }).limit(75);
  socket.emit("loadMessages", lastMessages.reverse());

  socket.on("sendMessage", async (data) => {
    const msg = new Message(data);
    await msg.save();
    io.emit("newMessage", data);
  });
});

server.listen(3000, () => console.log("Chat app running on port 3000"));
