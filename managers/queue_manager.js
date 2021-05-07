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
    return dbManager.getQueue()
        .then(rows => {
            /**
             * Rename object key from db_manager
             * id => customer_id
             * arrival_timestamp => arrival
             */
            return rows.map(item => {
                return {
                    customer_id: item['id'],
                    arrival: item['arrival_timestamp']
                };
            });
        });
};
