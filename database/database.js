const { Pool } = require('pg');
const { DB_CONFIG } = require('../commons');

let pool;
module.exports.getPool = function () {
    if (!pool) pool = new Pool(DB_CONFIG);
    return pool;
};