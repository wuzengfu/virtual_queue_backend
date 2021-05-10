// const dbManager = require('../../managers/db_manager');
// const queueManager = require('../../managers/queue_manager');
// const oldDbManagerDequeue = dbManager.dequeue; // Store original implementation
//
// dbManager.dequeue = function () {
//     return Promise.resolve(12);
// };
//
// queueManager.dequeue().then((result) => {
//     if (
//         JSON.stringify(result) ===
//         JSON.stringify({
//             customer_id: 12,
//         })
//     ) {
//         console.log('✔ queueManager.dequeue resolves correctly');
//     } else {
//         console.log('❌ queueManager.dequeue resolves incorrectly');
//     }
// }) .finally(function () {
//     // Do it only at the end of the test.
//     dbManager.dequeue = oldDbManagerDequeue; // Revert to original implementation
// });

const { it, run } = require('../test_driver');
const dbManager = require('../../managers/db_manager');
const queueManager = require('../../managers/queue_manager');
const oldDbManagerDequeue = dbManager.dequeue;

function revertDbManagerDequeue(result) {
    dbManager.dequeue = oldDbManagerDequeue;
    return result;
}

// use `it` to add tests.
it('should resolve dequeue correctly -12', function () {
    dbManager.dequeue = function () {
        return Promise.resolve(12);
    };
    // Important: Return the promise
    return queueManager
        .dequeue()
        .then(
            (result) =>
                JSON.stringify(result) ===
                JSON.stringify({
                    customer_id: 12,
                }),
        )
        .then(revertDbManagerDequeue);
        // .then((result) => revertDbManagerDequeue(result));
});

it('should not resolve dequeue correctly -0', function () {
    dbManager.dequeue = function () {
        return Promise.resolve(0);
    };
    // Important: Return the promise
    return queueManager
        .dequeue()
        .then(
            (result) =>
                JSON.stringify(result) ===
                JSON.stringify({
                    customer_id: 12,
                }),
        )
        .then(revertDbManagerDequeue);
});


it('should not resolve dequeue correctly -1', function () {
    dbManager.dequeue = function () {
        return Promise.resolve(-1);
    };
    // Important: Return the promise
    return queueManager
        .dequeue()
        .then(
            (result) =>
                JSON.stringify(result) ===
                JSON.stringify({
                    customer_id: 12,
                }),
        )
        .then(revertDbManagerDequeue);
});

// Run the tests
// Important: Keep this as the last line
run();



// const { it, run } = require('../test_driver');
// const dbManager = require('../../managers/db_manager');
// const queueManager = require('../../managers/queue_manager');
//
// //TODO: Delete _tests, it and _testRunner
//
// // Store originals
// const oldDbManagerDequeue = dbManager.dequeue;
// function revertDbManagerDequeue(result) {
//     dbManager.dequeue = oldDbManagerDequeue;
//     return result;
// }
//
// // use `it` to add tests.
// it('should resolve dequeue correctly', function () {});
//
// it('Should reject dequeue correctly', function () {});
//
// // Run the tests
// // Important: Keep this as the last line
//
// //TODO: Replace _testRunner with run
// run();
