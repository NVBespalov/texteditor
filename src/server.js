const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

io.on('connection', socket => {
    socket.on('room', (roomName) => {
        socket.join(roomName);
        io.in(roomName).emit('connected to room', 'welcome to new room');
        socket.on('document change', msg => socket.broadcast.to(roomName).emit('document updated', msg));
    });
});

http.listen(3000, () => console.log('listening on *:3000'));
