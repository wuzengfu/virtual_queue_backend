const { it, run } = require('../test_driver');
const { Client } = require('pg');
const { now } = require('../../utils');
const { DATE_FORMAT } = require('../../commons');
const database = require('../../database/database');
require('dotenv').config({path:'../../.env'});
const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_TEST_PORT, // DB_TEST_PORT instead of DB_PORT
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionString: process.env.DB_TEST_CONNECTION_STRING,
});
database.getPool = function () {
    return client;
};

const fetch = require('node-fetch');
const testPort = 3456;
const url = `http://localhost:${testPort}`;

it('Should respond with status = 404', function () {
    return fetch(`${url}/fsldkjflsdjflksd`).then((response) => response.status == 404);
});

it('Should enqueue first customer with customer_id = 1', function () {
    return fetch(`${url}/queue`, { method: 'POST' })
        .then((response) => response.json())
        .then((json) => json.customer_id === 1); // Identity equality to ensure numerical type
});
it('Should enqueue second customer with customer_id = 2', function () {
    return fetch(`${url}/queue`, { method: 'POST' })
        .then((response) => response.json())
        .then((json) => json.customer_id === 2); // Identity equality to ensure numerical type
});
it('Should dequeue first customer with customer_id = 1', function () {
    return fetch(`${url}/queue`, { method: 'DELETE' })
        .then((response) => response.json())
        .then((json) => json.customer_id === 1); // Identity equality to ensure numerical type
});
it('Should dequeue second customer with customer_id = 2', function () {
    return fetch(`${url}/queue`, { method: 'DELETE' })
        .then((response) => response.json())
        .then((json) => json.customer_id === 2); // Identity equality to ensure numerical type
});
it('Should dequeue empty queue with customer_id = 0', function () {
    return fetch(`${url}/queue`, { method: 'DELETE' })
        .then((response) => response.json())
        .then((json) => json.customer_id === 0); // Identity equality to ensure numerical type
});
it('Should enqueue next customer with customer_id = 3', function () {
    return fetch(`${url}/queue`, { method: 'POST' })
        .then((response) => response.json())
        .then((json) => json.customer_id === 3); // Identity equality to ensure numerical type
});

function resetErrorTab() {
    return client.query('truncate error_tab RESTART IDENTITY;');
}

it('Should not log any error when response is success', () => {
    const from = encodeURIComponent(now().subtract(1, 'minute').format(DATE_FORMAT));
    return resetErrorTab()
        .then(() => fetch(`${url}/stats/errors?from=${from}&duration=3`))
        .then(response => response.json())
        .then(json => json.length === 0);
});

it('Should record error when an error occurred, 404 not found', () => {
    const from = encodeURIComponent(now().subtract(1, 'minute').format(DATE_FORMAT));
    return resetErrorTab()
        .then(() => fetch(`${url}/flksdjflds`))
        .then(() => fetch(`${url}/stats/errors?from=${from}&duration=3`))
        .then(response => response.json())
        .then(
            json =>
                json.length === 1 && json[0].status_code === 404 && json[0].payload.code === ERROR_CODE.URL_NOT_FOUND,
        );
});

it('Should be able to record multiple errors', () => {
    const from = encodeURIComponent(now().subtract(1, 'minute').format(DATE_FORMAT));
    return resetErrorTab()
        .then(() =>
            Promise.all(
                Array(5)
                    .fill()
                    .map(() => fetch(`${url}/flksdjflds`)),
            ),
        )
        .then(() => fetch(`${url}/stats/errors?from=${from}&duration=3`))
        .then(response => response.json())
        .then(json =>
            json.every((errorLog) => errorLog.payload && errorLog.payload.code === ERROR_CODE.URL_NOT_FOUND),
        );
});

function resetQueueTab() {
    return client.query('truncate queue_tab RESTART IDENTITY;');
}

//feature 1: GET /stats/arrivals
it('getArrivals should respond with 400 if parameters are invalid', function (){
    const from = encodeURIComponent(now().subtract(1, 'minute').format(DATE_FORMAT));

    const invalidFromParameter = `${url}/stats/arrivals?from=${'asdlgjop'}&duration=3`;
    const invalidDurationParameter1 = `${url}/stats/arrivals?from=${from}&duration=0`;
    const invalidDurationParameter2 = `${url}/stats/arrivals?from=${from}&duration=2000`;

    return resetErrorTab()
        .then(() => Promise.all(
            [fetch(invalidFromParameter)],
            [fetch(invalidDurationParameter1)],
            [fetch(invalidDurationParameter2)]
            )
        )
        .then(() => fetch(`${url}/stats/errors?from=${from}&duration=3`))
        .then(response => response.json())
        .then(json =>
            json.every(
                errorLog =>
                    errorLog.payload && errorLog.payload.code === ERROR_CODE.INVALID_QUERY_PARAMETER && errorLog.status_code === 400
            )
        );
});

it('getArrivals should return empty array when no record is found', function () {
    const from = encodeURIComponent(now().subtract(1, 'minute').format(DATE_FORMAT));
    return resetQueueTab()
        .then(() => fetch(`${url}/stats/arrivals?from=${from}&duration=3`))
        .then(response => response.json())
        .then(json => json.length === 0)
});

it('getArrivals should respond when a record is found', function () {
    const from = encodeURIComponent(now().subtract(1, 'minute').format(DATE_FORMAT));

    return resetQueueTab()
        .then(() => fetch(`${url}/queue`, {method: 'POST'})
            .then(() => fetch(`${url}/stats/arrivals?from=${from}&duration=3`))
            .then(response => response.json())
            .then(json => json.length === 1))
});

it('getArrivals should respond when multiple records are found', function (){
    const from = encodeURIComponent(now().subtract(1, 'minute').format(DATE_FORMAT));
    const recordsToInsert = 5;

    return resetQueueTab()
        .then(() => Promise.all(
            Array(recordsToInsert)
                .fill()
                .map(() => fetch(`${url}/queue`, {method: 'POST'})))
            .then(() => fetch(`${url}/stats/arrivals?from=${from}&duration=3`))
            .then(response => response.json())
            .then(json => json.length === recordsToInsert))
})

//feature 2: GET /queue
it('getQueue should return empty array when no record is found', function (){
    return resetQueueTab()
        .then(() => fetch(`${url}/queue`))
        .then(response => response.json())
        .then(json => json.length === 0);
});

it('getQueue should return arrival and customer_id:1 when one record inserted', function (){
    return resetQueueTab()
        .then(() => fetch(`${url}/queue`, {method: 'POST'}))
        .then(() => fetch(`${url}/queue`))
        .then(response => response.json())
        .then(json => json[0])
        .then(json => json.arrival && json.customer_id === 1);
});

it('getQueue should return arrival and customer_id when multiple records inserted', function (){
    const recordsToInsert = 3;

    return resetQueueTab()
        .then(() => Promise.all(
            Array(recordsToInsert)
                .fill()
                .map(() => () => fetch(`${url}/queue`, {method: 'POST'}))
        ))
        .then(() => fetch(`${url}/queue`))
        .then(response => response.json())
        .then(jsons => jsons.map((json,i) => json.arrival && json.customer_id === i + 1));
});

// at the bottom of the file.
const app = require('../../router.js');
const { ERROR_CODE } = require('../../errors');
// Create server connection
const server = app.listen(testPort, function (error) {
    if (error) {
        client.end();
        return console.log(error);
    }
    client
        .connect() // Connect to database
        .then(() => client.query(`TRUNCATE queue_tab RESTART IDENTITY;`))
        .then(() => run())
        .catch(console.log) // Simply console.log any errors
        .finally(() => client.end()) // Close database connection
        .then(() => server.close()); // Close server connection
});
