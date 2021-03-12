// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

var allMessages = [];
var classData = [];
//file reading
const fs = require('fs');
const neatCsv = require('neat-csv');
const { parse } = require('path');
//var Teacherid = "";(Teacherid ==="") ? "hot":"cool";
const filePath = path.join(__dirname, 'Teacher.csv');
server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom

var numUsers = 0;

io.on('connection', (socket) => {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', (data) => {
    allMessages.push(data)
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', (username) => {
    console.log("--------------")
    console.log(username);//username
    fs.readFile(filePath, async (error, data) => {
      if (error) {
        return console.log('error reading file');
      }
      const parsedData = await neatCsv(data);
      for (var a = 0; a < parsedData.length; a++) { 
        classData.push((JSON.stringify(parsedData[a])).replace(/[{}"]/g,''));
      }
      //console.log(parsedData);
      console.log(classData)
    });
    // socket.emit('login', {
    //   numUsers: numUsers,
    //   allMessages: parsedData
    // });
    if (addedUser) return;
    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;

    socket.emit('login', {
      numUsers: numUsers,
      allMessages: allMessages,
      classData: classData
    });
    
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
