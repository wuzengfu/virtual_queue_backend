const {it, run} = require('../test_driver');
const fetch = require('node-fetch');

// We will call run() only after the server has started at a later step.

const {Client} = require('pg');
const database = require('../../database/database');
require('dotenv').config({path:"../../.env"});
const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_TEST_PORT, // DB_TEST_PORT instead of DB_PORT
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

database.getPool = function () {
    return client;
};

const testPort = 3456;
const url = `http://localhost:${testPort}`;
it('Should respond with status = 404', function () {
    return fetch(`${url}/fsldkjflsdjflksd`).then((response) => response.status === 404);
});

it('Should enqueue first customer with customer_id = 1', function () {
    return fetch(`${url}/queue`, {method: 'POST'})
        .then((response) => response.json())
        .then((json) => json.customer_id === 1); // Identity equality to ensure numerical type
});

it('Should dequeue first customer with customer_id = 1', function () {
    return fetch(`${url}/queue`, { method: 'DELETE' })
        .then((response) => response.json())
        .then((json) => json.customer_id === 1); // Identity equality to ensure numerical type
});


const app = require('../../router.js');
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
