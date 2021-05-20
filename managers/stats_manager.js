const utils = require('../utils');
const databaseManager = require('./db_manager');

//feature 1: GET /stats/arrival
module.exports.getArrivals = function (from, duration) {
    const {
        error,
        fromTimestamp,
        toTimestamp
    } = utils.getFromAndToTimestampInErrorObject(from, duration);
    if (error) return Promise.reject(error);
    return databaseManager.getArrivals(fromTimestamp, toTimestamp)
        .then(rows => rows.map(row => row.arrival_timestamp));
};

//feature 4: GET /stats/departures
module.exports.getDepartures = function (from, duration) {
    try {
        const [fromTimestamp, toTimestamp] = utils.getFromAndToTimestamp(from, duration);
        return databaseManager.getDepartures(fromTimestamp, toTimestamp)
            .then(rows => rows.map(row => row.departure_timestamp));
    } catch (error) {
        return Promise.reject(error);
    }
};

//feature 5: PUT /stats/lengths
module.exports.putLengths = function (duration, interval) {
    try {
        var runInterval = setInterval(databaseManager.putLengths, interval * 1000);
        setTimeout(intervalClear, duration * 1000 * 60);
        function intervalClear() {
            clearInterval(runInterval)
        }        
    } catch (error) {
        return Promise.reject(error);
    }
};

//feature 5: GET /stats/lengths
module.exports.getLengths = function (from, duration) {
    try {
        const [fromTimestamp, toTimestamp] = utils.getFromAndToTimestamp(from, duration);
        return databaseManager.getLengths(fromTimestamp, toTimestamp)
            .then(rows => rows.map(row => ({
                "timestamp": row.timestamp,
                "length":row.length
            })));
    } catch (error) {
        return Promise.reject(error);
    }
};

/**
 * Error Logging
 */
module.exports.logErrors = function (statusCode, payload) {
    try {
        const payloadJson = JSON.stringify(payload);
        return databaseManager.logError(statusCode, payloadJson);
    } catch (error) {
        return Promise.reject(error);
    }
};

/**
 *
 * @param {String} from
 * @param {Number} duration Number of minutes
 */
module.exports.getErrors = function (from, duration) {
    const {
        error,
        fromTimestamp,
        toTimestamp
    } = utils.getFromAndToTimestampInErrorObject(from, duration);
    if (error) return Promise.reject(error);
    return databaseManager.getErrorLogs(fromTimestamp, toTimestamp)
        .then((rows) => rows.map(({
            timestamp,
            status_code: statusCode,
            payload
        }) => ({
            timestamp,
            status_code: statusCode,
            payload: JSON.parse(payload),
        })),);
};
