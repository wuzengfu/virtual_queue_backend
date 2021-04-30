const { getPool } = require('../database/database');

const pool = getPool();

module.exports.enqueue = function () {
    return pool
        .query(
            `INSERT INTO queue_tab (id, served) 
            VALUES (DEFAULT, DEFAULT ) 
            RETURNING *`,
        )
        .then((result) => result.rows[0].id);
};

module.exports.dequeue = function () {
    return pool
        .query(
            `UPDATE queue_tab
            SET served = true
            WHERE id = (
                SELECT id FROM queue_tab
                WHERE not served ORDER BY id LIMIT 1
            )
            RETURNING *`,
        )
        .then((result) => (!result.rows.length ? 0 : result.rows[0].id));
};