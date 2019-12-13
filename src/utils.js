module.exports.fromNodeCallback = function (asyncFunction, context = null) {
    return function (...args) {
        return new Promise((resolve, reject) => {
            asyncFunction.apply(context, [...args, function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            }]);
        })
    }
};

function Observable(fn) {
    const subscribers = [];
    const pipes = [];
    this.subscribe = (subscriber) => {
        return subscribers.push(subscriber);
    };
    this.unsubscribe = (subscriptionIndex) => subscribers.splice(subscriptionIndex, 1);
    this.pipe = (opFn) => opFn(this);
    const observer = {
        next: (...args) => Promise
            .resolve(pipes)
            .then(operators => operators.length ? operators.reduce(((promise, operator) => promise.then(operator)), Promise.resolve(args)) : Promise.resolve(args))
            .then((args) => subscribers.filter(hasMethodName('next')).forEach(evokeObjectMethodWithArgs('next', args)))
    };
    setTimeout(() => {
        try {
            fn(observer);
        } catch (e) {
            subscribers.filter(hasMethodName('error')).forEach(evokeObjectMethodWithArgs('error', e));
        }
    });

}

/**
 * Side effect operator
 * @param fn
 * @returns {function(*=): Observable}
 */
const tap = (fn) => (observable) => {
    return new Observable((obs) => {
        const subscription = observable.subscribe({
            next(...args) {
                fn.apply(null, args);
                obs.next.apply(null, args);
                observable.unsubscribe(subscription);
            }
        });
    });
};

const flatMap = (fn) => (observable) => {
    return new Observable((obs) => {
        const subscription = observable.subscribe({
            next(...args) {
                fn.apply(null, args).subscribe({
                    next() {
                        obs.next.apply(null,);
                        // observable.unsubscribe(subscription);
                    }
                });

            }
        });
    });
};

module.exports.fromCallback = function fromCallback(fn, context = null) {
    return function (...args) {
        return new Promise(function (resolve, reject) {
            try {
                fn.apply(context, [...args, resolve]);
            } catch (e) {
                reject(e);
            }
        });
    }
};

const evokeObjectMethodWithArgs = (methodName, args) => (src) => src[methodName].apply(null, args);

module.exports.evokeObjectMethodWithArgs = evokeObjectMethodWithArgs;

const hasMethodName = name => (target) => typeof target[name] === 'function';

module.exports.hasMethodName = hasMethodName;

module.exports.fromCallbackEventBase = function fromCallbackEventBase(fn, context = null) {
    return function (...args) {
        return new Promise(function (resolve, reject) {
            try {
                fn.apply(context, [...args, resolve]);
            } catch (e) {
                reject(e);
            }
        }).then(function (result) {

            return new Promise(function (resolve, reject) {
                try {
                    fn.apply(context, [...args, resolve]);
                } catch (e) {
                    reject(e);
                }
            })
        });
    }
};

module.exports.tap = tap;

module.exports.Observable = Observable;

module.exports.fromEvent = (target, eventName) => new Observable((obs) => target.on(eventName, (...args) => {
    obs.next.apply(null, args);
}));
