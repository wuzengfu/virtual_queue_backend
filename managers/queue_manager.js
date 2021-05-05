const dbManager = require('./db_manager');

module.exports.enqueue = function () {
    return dbManager.enqueue()
        .then((customerId) => ({ customer_id: customerId }));
};

module.exports.dequeue = function () {
    return dbManager.dequeue()
        .then((customerId) => ({ customer_id: customerId }));
};

//feature 2: GET /queue
module.exports.getQueue = function () {
    return dbManager.getQueue();
};
