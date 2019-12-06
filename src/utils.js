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

module.exports.fromCallback = function(fn, context = null) {
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