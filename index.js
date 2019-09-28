const http = require('http');
const path = require('path');
const express = require('express');
const socket = require('socket.io');
const wordFilter = require('bad-words');
const { messageGenerator, locationGenerator } = require('./utils/messages');
const {
  getUser,
  addUser,
  removeUser,
  getUsersInRoom
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socket(server);

const port = process.env.PORT || 3000;
const publicDirectory = path.join(__dirname, './public');

app.use(express.static(publicDirectory));

io.on('connection', socket => {
  console.log(`New web socket connected ...`);

  socket.on('join', (connectInfo, callback) => {
    //* Add a new user to current room
    const { error, user } = addUser({ id: socket.id, ...connectInfo });
    if (error) {
      return callback(error);
    }
    //* User join a specific room
    socket.join(user.room);

    //* Say welcome to the current User
    socket.emit(
      'message',
      messageGenerator('System', `Welcome ${user.username} ...`, true)
    );
    //* Broadcast to the room abt new user
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        messageGenerator('System', `${user.username} has joined ...`, true)
      );

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);
    const filter = new wordFilter();
    if (filter.isProfane(message)) {
      return callback('Profanity is not allowed ...');
    } else {
      io.to(user.room).emit(
        'message',
        messageGenerator(user.username, message, true)
      );
      callback();
    }
  });

  socket.on('sendLocation', (coords, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      'locationMessage',
      locationGenerator(
        user.username,
        `https://google.com/maps?q=${coords.latitude},${coords.longtitude}`
      )
    );
    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        messageGenerator(
          'System',
          `${user.username} has left the room ...`,
          true
        )
      );
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
