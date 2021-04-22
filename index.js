//import Set from "core-js-pure/features/set";

// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
const quirc = require("node-quirc");
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

var allMessages = [];
//file reading
const fs = require('fs');
const neatCsv = require('neat-csv');
const { parse } = require('path');

const msFilePath = path.join(__dirname, 'middle_school.csv');
server.listen(port, () => {
    console.log('Server listening at port %d', port);
});


let classData = {
    '5': [],
    '6': [],
    '7': [],
    '8': [],
};

fs.readFile(msFilePath, async (error, data) => {
  if (error) {
    return console.log('error reading middle school roster');
  }
  const parsedData = await neatCsv(data);

  for (let student of parsedData) {
      classData[student['Grade']].push(student['First Name'] + ' ' + student['Last Name']);
  }
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

// Chatroom

var numUsers = 0;

io.on('connection', (socket) => {
    let addedUser = false;

    // when the client emits 'new message', this listens and executes
    socket.on('new message', (data) => {
        allMessages.push({
            username: socket.username,
            message: data,
        })

        // we tell the client to execute 'new message'
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
        });
    });
    // when the client emits 'add user', this listens and executes
    socket.on('add user', (username) => {
        if (addedUser) return;

        // we store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        addedUser = true;
        socket.emit('login', {
            numUsers: numUsers,
            allMessages: allMessages,
            classData: classData[username],
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers,
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

    socket.on('student arrived', (img) => {
        console.log("student arrived recieved");
        let buffer = Buffer.from(img.split(',')[1], 'base64');

        quirc.decode(buffer).then((codes) => {
            // do something with codes.
            let name = codes[0].data.toString('utf8');
            console.log(name);
            let message = {
                username: "Student Arrived",
                message: name,
            };
            allMessages.push(message);
            socket.broadcast.emit('new message', message);

            socket.emit('qr read', name);
        }).catch((err) => {
            console.error(`decode failed: ${err.message}`);

            socket.emit('qr failed')
        });
    })

    socket.on('student arrived manual', (data) => {
        let message = {
            username: "Student Arrived",
            message: data,
        };

        console.log("Sending student", data);
        socket.broadcast.emit('new message', message)
    })

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
