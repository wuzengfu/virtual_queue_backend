const express = require('express');
const statsManager = require('../managers/stats_manager');

const router = express.Router();

//feature 1: GET /stats/arrivals
router.get('/arrivals', (req, res, next) => {
    const {
        from,
        duration
    } = req.query;

    return statsManager.getArrivals(from, duration)
        .then((response) => res.status(200)
            .json(response))
        .catch(next);
});

//feature 4: GET /stats/departures
router.get('/departures', (req, res, next) => {
    const {
        from,
        duration
    } = req.query;

    return statsManager.getDepartures(from, duration)
        .then((response) => res.status(200)
            .json(response))
        .catch(next);
});

router.get('/errors', (req, res, next) => {
    const {
        from,
        duration,
        status_codes: statusCodes
    } = req.query;
    return statsManager
        .getErrors(from, duration, statusCodes)
        .then((response) => res.json(response))
        .catch(next);
});

module.exports = router;
