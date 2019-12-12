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

module.exports.fromCallbackEventBase = function fromCallbackEventBase (fn, context = null) {
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