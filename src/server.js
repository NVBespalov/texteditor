const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const {readFile} = require('fs');
const { resolve } = require('path');


app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

io.on('connection', socket => {
    // let {handshake: {query: userName} } = socket;
    const userName = socket.handshake.query.userName;
    const documentName = socket.handshake.query.documentName;
    let document;

    function initializeConnectionToRoom() {
        socket.join(documentName);
        socket.emit('connected');
        socket.emit('connected to room');
        socket.emit('document updated', document);
        socket.broadcast.to(documentName).emit('new user connected to room', `User: ${userName} connected to Room: ${documentName}`);
        socket.on('document changed', newDocument => {
            document = newDocument;
            socket.broadcast.to(documentName).emit('document updated', newDocument);
        });
    }

    if(!document) {
        readFile(resolve(__dirname, `../data/${documentName}.html`), (error, file) => {
            if (error) {
                socket.emit('not found', `file not found ${documentName}`);
                socket.disconnect();
            } else {
                document = file.toString();
                initializeConnectionToRoom();
            }

        });
    } else {
        initializeConnectionToRoom();
    }


});

http.listen(3000, () => console.log('listening on *:3000'));
