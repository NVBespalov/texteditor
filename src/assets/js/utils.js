function queryDocumentElementAsync(document, selector) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            const $element = document.querySelector(selector);
            $element ? resolve($element) : reject(new Error('Not found'));
        });
    })
}

function flip2 (fn) {
    return function (arg2, arg1) {
        return fn(arg1, arg2);
    }
}

function fromEvent(target, eventName) {
    return new Promise(function (resolve, reject) {
        target.on ? target.on(eventName, resolve) :
            target.addEventListener ? target.addEventListener(eventName, resolve) :
                reject(new Error('Target is not observable'));
    });
}

function fromEventChaining(target, eventName) {
    return function () {
        return fromEvent(target, eventName);
    }
}

function combinePromiseResultArgsWith(promise) {
    return function (...args) {
        return Promise.all([Promise.resolve.apply(Promise, args), promise]);
    }
}
