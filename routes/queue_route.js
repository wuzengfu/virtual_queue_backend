const express = require('express');
const queueManager = require('../managers/queue_manager');

const router = express.Router();

router.post('/', (req, res, next) => queueManager
    .enqueue()
    .then((response) => res.status(201)
        .json(response))
    .catch(next),);

router.delete('/', (req, res, next) => queueManager
    .dequeue()
    .then((response) => res.json(response))
    .catch(next),);

//feature 2: GET /queue
router.get('/', ((req, res, next) => {
    queueManager.getQueue()
        .then((response) => res.status(200)
            .json(response))
        .catch(next,);
}));

module.exports = router;
