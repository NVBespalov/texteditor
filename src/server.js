const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const {readdir, writeFile, stat} = require('fs');
const {resolve} = require('path');
const documents = {};

function initializeConnectionToRoom(client, documentName, userName) {
    client.join(documentName);
    client.emit('connected');
    client.emit('connected to room', documentName);
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
            if (error) {
                client.emit('save document error', `can not save file ${documentName}`);
            } else {
                client.emit('save document success');
            }
        });
    })

}

app.use(express.static(__dirname + '/assets/'));

const fromNodeCallback = (...[asyncFunction, ...params]) => new Promise((resolve, reject) => {
    asyncFunction.apply(null, [...params, (err, result) => {
        if (err) {
            reject(err);
        } else {
            resolve(result);
        }
    }])
});

io.on('connection', client => {
    const userName = client.handshake.query.userName;
    client.emit('connected');
    client.on('get documents list', (a, b) => {
        fromNodeCallback(readdir, resolve(__dirname, `../data/`))
            .then((files) => Promise
                .all(files.map(fileName => fromNodeCallback(stat, resolve(__dirname, `../data/${fileName}`)).then(stat => ({
                    ...stat,
                    fileName
                })))))
            .then(dirInfo => client.emit('documents list', dirInfo))
            .catch(error => client.emit('get documents list error', error));
    });
    // const documentName = client.handshake.query.documentName;
    // if(!documents[documentName]) {
    //     readFile(resolve(__dirname, `../data/${documentName}.html`), (error, file) => {
    //         if (error) {
    //             client.emit('open document error', `requested file ${documentName} not found `);
    //             client.disconnect();
    //         } else {
    //             documents[documentName]= file.toString();
    //             initializeConnectionToRoom(client,documentName, userName);
    //         }
    //     });
    // } else {
    //     initializeConnectionToRoom(client, documentName, userName);
    // }


});

http.listen(3000, () => console.log('listening on *:3000'));
