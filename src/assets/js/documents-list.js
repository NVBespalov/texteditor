function socketDocumentsList(socket, document) {
    Promise.all([
        fromEvent(socket, 'documents list'),
        queryDocumentElementAsync(document, '#thumbnail')
    ]).then(([documents, $template]) => {
       ;
    });
}