const _tests = [];

function it(description, testFn) {
    _tests.push([description, testFn]);
}

function _testRunner(tests = _tests, i = 0, successCount = 0) {
    if (i === tests.length) return console.log(`Finished running all ${i} test, result: ${successCount}/${i}`);
    const [description, testFn] = tests[i];
    return testFn()
        .then(function (isSuccess) {
            if (isSuccess) {
                successCount += 1;
                console.log(`✔️ ${description}`);
            } else {
                console.log(`❌ ${description}`);
            }
            return _testRunner(tests, i + 1, successCount);
        })
        .catch((error) => {
            console.log('Test failed to complete with error -', error);
        });
}

module.exports = {
    it,
    run: _testRunner,
};
