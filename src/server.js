const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const {readFile, writeFile} = require('fs');
const { resolve } = require('path');
const documents = {};
function initializeConnectionToRoom(client, documentName, userName) {
    client.join(documentName);
    client.emit('connected');
    client.emit('connected to room');
    client.emit('document updated', documents[documentName]);

    client.broadcast
        .to(documentName)
        .emit('new user connected to room', `User: ${userName} connected to Room: ${documentName}`);

    client.on('document changed', newDocument => {
        documents[documentName] = newDocument;
        client.broadcast.to(documentName).emit('document updated', newDocument);
    });

    client.on('save document', (document, next) => {

        writeFile(resolve(__dirname, `../data/${documentName}.html`), document, function (error) {
           if(error) {
               client.emit('save document error', `can not save file ${documentName}`);
           } else {
               client.emit('save document success');
           }
        });
    })

}
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

io.on('connection', client => {

    const userName = client.handshake.query.userName;
    const documentName = client.handshake.query.documentName;

    if(!documents[documentName]) {
        readFile(resolve(__dirname, `../data/${documentName}.html`), (error, file) => {
            if (error) {
                client.emit('open document error', `requested file ${documentName} not found `);
                client.disconnect();
            } else {
                documents[documentName]= file.toString();
                initializeConnectionToRoom(client,documentName, userName);
            }
        });
    } else {
        initializeConnectionToRoom(client, documentName, userName);
    }


});

http.listen(3000, () => console.log('listening on *:3000'));
