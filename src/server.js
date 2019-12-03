const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', socket => {
    console.log('a user connected');
    socket.join('some room');
    socket.on('document change', msg => {
        io.to('some room').emit('some event');

        console.log(`message: ${msg}`);
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});