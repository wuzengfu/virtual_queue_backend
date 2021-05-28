const express = require('express');
const queueManager = require('../managers/queue_manager');
const utils = require('../utils')
const db_manager = require('../managers/db_manager')

const router = express.Router();

//feature 2: GET /queue
router.get('/', ((req, res, next) => {
    queueManager.getQueue()
        .then((response) => res.status(200)
            .json(response))
        .catch(next,);
}));

//feature 7
router.post('/', (req, res, next) =>
// time t2 
{
    const from = utils.now().valueOf(); //start request
    return queueManager
        .enqueue()
        .then((response) => res.status(201).json(response))
        .catch(next)
        .finally(function () {
            // time t7 
            const to = utils.now().valueOf(); //End request
            const duration = to - from 


            db_manager.logProcessingTime(duration, "Enqueue")
        })
}
);

router.delete('/', (req, res, next) =>
// time t2 
{
    const from = utils.now().valueOf(); //start request
    return queueManager
        .dequeue()
        .then((response) => res.status(201).json(response))
        .catch(next)
        .finally(function () {
            // time t7 
            const to = utils.now().valueOf(); //End request
            const duration = to - from 


            db_manager.logProcessingTime(duration, "Dequeue")
        })
}
);

module.exports = router;
