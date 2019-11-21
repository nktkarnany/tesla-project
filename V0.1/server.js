const five = require("johnny-five");
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const board = five.Board();
let led = null;
let led12 = null;

let leds = [];

app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res, next) {
  res.sendFile(__dirname + '/index.html')
});

board.on("ready", function () {
  for(let i = 2; i < 11; i++){
    leds.push(new five.Led(i));
  }

  io.on('connection', function (client) {
    client.on('join', function (handshake) {
      console.log(handshake);
    });

    client.on('status', function (data) {
      if (data.on) {
        leds[data.id].on();
      } else {
        leds[data.id].off();
      }
      client.emit('status', data);
      client.broadcast.emit('status', data);
    });
  });
});

const port = process.env.PORT || 3000;

server.listen(port);
console.log(`Server listening on http://localhost:${port}`);
