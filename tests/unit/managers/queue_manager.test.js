const { it, run, makeRevertFunction } = require('../../test_driver');
const dbManager = require('../../../managers/db_manager');
const queueManager = require('../../../managers/queue_manager');

const revertDbManagerDequeue = makeRevertFunction(dbManager, 'dequeue');

// use `it` to add tests.
it('should resolve dequeue correctly', function () {
    dbManager.dequeue = function () {
        return Promise.resolve(12);
    };
    // Important: Return the promise
    return queueManager
        .dequeue()
        .then(
            (result) =>
                JSON.stringify(result) ==
                JSON.stringify({
                    customer_id: 12,
                }),
        )
        .then(revertDbManagerDequeue);
});

it('Should reject dequeue correctly', function () {
    dbManager.dequeue = function () {
        return Promise.reject('ERROR!');
    };
    return queueManager
        .dequeue()
        .then(() => false)
        .catch((error) => error === 'ERROR!')
        .then(revertDbManagerDequeue);
});

//feature 2: Get /queue
console.log("Getting current queue");
const revertDbManagerGetQueue = makeRevertFunction(dbManager, 'getQueue');
function testGetQueueSuccess(description, databaseResponseValue) {
    it(description, function () {
        const output = databaseResponseValue.map(row => {
            return {
                customer_id: row.id,
                arrival: row.arrival_timestamp
            }
        });
        dbManager.getQueue = function () {
            return Promise.resolve(databaseResponseValue);
        }
        return queueManager.getQueue().
        then((result) => JSON.stringify(result) === JSON.stringify(output))
            .then(revertDbManagerGetQueue);
    });
}

testGetQueueSuccess("getQueue should return empty array correctly",[]);
testGetQueueSuccess("getQueue should return array with 1 entry correctly",[{
    id: 5,
    arrival_timestamp: 123
}]);
testGetQueueSuccess("getQueue should return array with multiple entry correctly",[
    {
        id: 5,
        arrival_timestamp: 456
    },
    {
        id: 6,
        arrival_timestamp: 789
    },
    {
        id: 10,
        arrival_timestamp: 1234567
    }
])


it('getQueue should reject with rejected value correctly', function (){
    dbManager.getQueue = function () {
        return Promise.reject("error!");
    }
    return queueManager.getQueue()
        .then(() => false)
        .catch(error => error === "error!")
        .then(revertDbManagerGetQueue);
})

// Run the tests
// Important: Keep this as the last line
run();
