const test = require("../managers/queue_manager");

test.enqueue().then(function (val) {
    console.log(val);
    return test.dequeue();
}).then(result=>{
    console.log(result);
});

// test.dequeue().then(result => {
//     console.log(result);
// })
