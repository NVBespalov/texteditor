const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const {readdir, stat, writeFile, readFile, promises: {access}} = require('fs');
const {resolve} = require('path');
const {fromNodeCallback, fromEvent} = require('./utils');

app.use(express.static(__dirname + '/assets/'));

const statsPromise = fromNodeCallback(stat);
const readDirPromise = fromNodeCallback(readdir);
const writeFilePromise = fromNodeCallback(writeFile);
const readFilePromise = fromNodeCallback(readFile);
const dataDir = resolve(__dirname, `../data/`);

io.on('connection', async client => {
    client.emit('connected');
    client.on('documents', () => {
        const toNodeCallbackStat = fileName => statsPromise(resolve(dataDir, fileName));
        readDirPromise(dataDir)
            .then((files) => Promise.all([Promise.resolve(files), Promise.all(files.map(toNodeCallbackStat))]))
            .then(([files, stats]) => stats.reduce((memo, it, index) => [...memo, {...it, filename: files[index]}], []))
            .then(dirInfo => client.emit('documents', dirInfo))
            .catch(error => client.emit('documents:error', error));
    });
    client.on('document:new', docName => {
        writeFilePromise(resolve(dataDir, `${docName}.html`), '').then(() => client.emit('document:new'));
    });
    const userName = client.handshake.query.userName;

    client.on('document:open', async (documentName) => {
        const documentPath = resolve(dataDir, documentName);
        const error = await access(documentPath);
        if (error) {
            client.emit('document:error');
        } else {
            try {
                client.emit('document:open', (await readFilePromise(documentPath)).toString());
            } catch (e) {
                client.emit('error', e);
            }
        }
    });


    const tap = (fn) => (observable) => {
        debugger
        const subscription = observable.subscribe({
            next(...args) {
                debugger
                fn.apply(null, args);
                observable.unsubscribe(subscription);
            }
        });
    };

    fromEvent(client, 'document:save').pipe(tap((a, b) => {
        debugger
    })).subscribe({
        async next(document, docName) {
            await writeFilePromise(resolve(dataDir, `${docName}`), document);
            client.emit('document:save', document);
        }
    });
    // client.on('document:save', async (doc, docName) => {
    //     try {
    //         await writeFilePromise(resolve(dataDir, `${docName}`), doc);
    //         client.emit('document:save', doc)
    //     } catch (e) {
    //         client.emit('document:error', e);
    //     }
    // });


});

http.listen(3000, () => console.log('listening on *:3000'));
