const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const {readdir, stat, writeFile, readFile, promises: { access }} = require('fs');
const {resolve} = require('path');
const {fromNodeCallback, fromCallback} = require('./utils');

app.use(express.static(__dirname + '/assets/'));

// function initializeConnectionToRoom(client, documentName, userName) {
//     client.join(documentName);
//     client.emit('connected');
//     client.emit('connected to room', documentName);
//     client.emit('document updated', documents[documentName]);
//
//     client.broadcast
//         .to(documentName)
//         .emit('new user connected to room', `User: ${userName} connected to Room: ${documentName}`);
//
//     client.on('document changed', newDocument => {
//         documents[documentName] = newDocument;
//         client.broadcast.to(documentName).emit('document updated', newDocument);
//     });
//
//     client.on('save document', (document, next) => {
//
//         writeFile(resolve(__dirname, `../data/${documentName}.html`), document, function (error) {
//             if (error) {
//                 client.emit('save document error', `can not save file ${documentName}`);
//             } else {
//                 client.emit('save document success');
//             }
//         });
//     })
//
// }

const statsPromise = fromNodeCallback(stat);
const readDirPromise = fromNodeCallback(readdir);
const writeFilePromise = fromNodeCallback(writeFile);
const readFilePromise = fromNodeCallback(readFile);
const dataDir = resolve(__dirname, `../data/`);

io.on('connection', client => {
    client.emit('connected');
    client.on('documents', () => {
        const toNodeCallbackStat = fileName => statsPromise(resolve(dataDir, fileName));
        readDirPromise(dataDir)
                .then((files) => Promise.all([Promise.resolve(files), Promise.all(files.map(toNodeCallbackStat))]))
                .then(([files, stats]) => stats.reduce((memo, it, index) => [...memo, {...it, filename: files[index]}], []))
                .then(dirInfo => client.emit('documents', dirInfo))
                .catch(error => client.emit('documents:error', error));
    });
    client.on('document:new', function (docName) {
        writeFilePromise(resolve(dataDir, `${docName}.html`), '').then(() => client.emit('document:new'));
    });
    const userName = client.handshake.query.userName;

    client.on('document:open', async (documentName) => {
        const documentPath = resolve(dataDir, documentName);
        const error = await access(documentPath);
        if(error) {
            client.emit('document:error');
        } else {
            try {
                client.emit('document:open', (await readFilePromise(documentPath)).toString());
            } catch (e) {
                client.emit('error', e);
            }
        }
    });


});

http.listen(3000, () => console.log('listening on *:3000'));
