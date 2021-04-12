# ST0507 ADES AY21/22 Sem 1 CA1 Bare Backend

## Setup

1. Install [Node Js](https://nodejs.org/en/download/) if you have not done so.
    1. Alternative Installation via [Chocolatey](https://chocolatey.org/packages/nodejs-lts)
    2. Check if you have installed node previously by running `node --version`
        1. You should see the version number (e.g. `v14.15.0`)
2. Install [Docker](https://docs.docker.com/get-docker/) if you have not done so.
    1. Check if you have installed Docker previously by running `docker -v`
        1. You should see the version number (e.g. `Docker version 20.10.2, build 2291f61`)
3. Install [VS Code](https://code.visualstudio.com/download) if you have not done so previously.
4. Install the following VS Code Plugins
    1. [Better Comments](https://marketplace.visualstudio.com/items?itemName=aaron-bond.better-comments)
    2. [Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)
    3. [Git Graph](https://marketplace.visualstudio.com/items?itemName=mhutchie.git-graph)
    4. [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
5. Clone the repository ([How to clone a repository](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository))
6. Create a new file in the root directory `.env` (Note the dot at the front) and paste the following values into the file:

    ```
    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=user
    DB_PASSWORD=password
    DB_DATABASE=virtual_queue
    DB_TEST_PORT=6543
    ```

![component-diagram](assets/component-diagram.png)

## Instructions

1.  Clone this repository
2.  First thing you would want to do is to run

    ```
    npm init
    ```

3.  Following the above diagram, we are going to start with components that do not have any arrows coming out of them. Thus we will start with the actual `database`
4.  If you open up `docker-compose.yml`, you may see the following lines:

    ```
    volumes:
        ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ```

    This line tells docker to put the file `./database/init.sql` into the container at the directory `/docker-entrypoint-initdb.d/` with the file name `init.sql`.

    This happens to be the sql file that the docker image will execute during initialization of the database. Thus we will add our `CREATE TABLE` script inside that file.

5.  Create a new folder named `database` and inside the folder, create a new file `init.sql`
6.  Looking at the diagram, we know that there is a table `queue_tab` with some attributes. Put the following lines into `init.sql`

    ![component-diagram](assets/component-diagram.png)

    ```sql
    CREATE TABLE queue_tab (
        id SERIAL primary key,
        served BOOLEAN not null default false
    );
    ```

7.  If you followed the setup instructions you should have created a `.env` file in the root directory with the following values:

    ```
    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=user
    DB_PASSWORD=password
    DB_DATABASE=virtual_queue
    DB_TEST_PORT=6543
    ```

8.  Run the following command to start up the database:

    ```
    docker-compose up
    ```

    You should observe that there are 4 `CREATE` (2 in `db` and 2 in `db-test`). And it ends with `database is ready to accept connections`, e.g.

    ```
    db         | CREATE DATABASE
    db-test    | CREATE DATABASE
    db-test    |
    db-test    |
    db-test    | /usr/local/bin/docker-entrypoint.sh: running /docker-entrypoint-initdb.d/init.sql
    db         |
    db         |
    db         | /usr/local/bin/docker-entrypoint.sh: running /docker-entrypoint-initdb.d/init.sql
    db-test    | CREATE TABLE
    db-test    |
    db-test    |
    db-test    | 2021-03-24 01:10:34.688 UTC [47] LOG:  received fast shutdown request
    db         | CREATE TABLE
    db         |
    ...
    db-test    | 2021-03-24 01:10:34.830 UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432
    db-test    | 2021-03-24 01:10:34.831 UTC [1] LOG:  listening on IPv6 address "::", port 5432
    db         | 2021-03-24 01:10:34.844 UTC [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
    db-test    | 2021-03-24 01:10:34.846 UTC [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
    db         | 2021-03-24 01:10:34.857 UTC [85] LOG:  database system was shut down at 2021-03-24 01:10:34 UTC
    db-test    | 2021-03-24 01:10:34.861 UTC [84] LOG:  database system was shut down at 2021-03-24 01:10:34 UTC
    db         | 2021-03-24 01:10:34.871 UTC [1] LOG:  database system is ready to accept connections
    db-test    | 2021-03-24 01:10:34.876 UTC [1] LOG:  database system is ready to accept connections
    ```

9.  To test that we have setup the database correctly, let us attempt to establish a connection with the database without javascript first. Type the following code into a new terminal:

    ```
    docker exec db psql -U user -d virtual_queue -c "select * from queue_tab;"
    ```

    Since it's a brand new database we should observe that there is 0 rows.

    ```
     id | served
    ----+--------
    (0 rows)
    ```

10. We have setup the actual `database`, we will now write javascript to establish connection with the `database` in a file named `database.js`
11. We will be using [`node-postgres`](https://node-postgres.com/) as the interface between our application and the database. Install it by running the following command:
    ```
    npm install pg
    ```
12. Going to the [`connecting` page](https://node-postgres.com/features/connecting) of the node-postgres API. It suggests that we can use either `Pool` or `Client` to establish connection with the database.

    > -   Client: a single connection with the database
    > -   Pool: a set of Clients being reused over and over again

    In our application, we will be using a `Pool`.

13. Reading the documentation on `connecting` further, it mentions that `pg` have 2 option for specifying the database's information to establish connection
    1. from environment variable OR
    2. programmatically. (We will do this).
14. Since these values are constants (unchanging throughout the app's lifecycle), let us create them in a `commons` file. Create a file `commons.js` in the root directory and enter the following values:

    ```js
    module.exports.DB_CONFIG = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        max: process.env.DB_MAX_POOL_SIZE || 20,
    };
    ```

15. Note that we are still referencing data from the environment, thus we need to load the values in the `.env` file into the environment. We will use the `dotenv` npm package to assist us with loading environment variable.

    Install the `dotenv` npm package

    ```
    npm install dotenv
    ```

    At the top of the `commons.js` file add the following line:

    ```js
    require('dotenv').config();
    ```

16. We will now be able to create the connections. Create a new file `database.js` in the `database` folder and include the following lines:

    ```js
    const { Pool } = require('pg');
    const { DB_CONFIG } = require('../commons');

    let pool;
    module.exports.getPool = function () {
        if (!pool) pool = new Pool(DB_CONFIG);
        return pool;
    };
    ```

    > Can you see that `new Pool()` is called only once regardless of how many times `getPool()` is invoked?

17. We can test our file by running this file in our terminal, open a terminal and run the following commands:

    ```
    node
    ```

    To start a new Node terminal, and then enter the following lines:

    > You may have to type it out instead of copy-pasting it.

    ```js
    const { getPool } = require('./database/database.js');
    const pool = getPool();
    pool.query('select * from queue_tab;')
        .then(function (result) {
            console.log(result.rows);
        })
        .catch(console.error);
    ```

    You should observe an empty array as there are no rows in the table yet.

18. Now that we are able to establish connection with the actual database using JavaScript, we can now prepare the `db_manager` to provide us with some methods to interact with the database. Create a new directory `managers` and inside, create a file `db_manager.js` with the following lines:

    ```js
    const { getPool } = require('../database/database');

    const pool = getPool();
    ```

19. Recall that one of the basic feature of this backend is to allow enqueueing and dequeueing. We will start with enqueueing, enter the following lines into `db_manager.js`

    ```js
    module.exports.enqueue = function () {
        return pool
            .query(
                `INSERT INTO queue_tab (id, served) 
                VALUES (DEFAULT, DEFAULT ) 
                RETURNING *`,
            )
            .then((result) => result.rows[0].id);
    };
    ```

    > Can you explain what is happening in this method?
    >
    > -   What is the return value of the method?
    > -   What does the resolved value represent?

20. Next for dequeue;

    ```js
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
    ```

21. We can once again test that the file has been set up correctly by running it on a Node terminal.

    ```
    node
    ```

    > Because we have made changes to our file, we need to restart the Node terminal, if your previous Node terminal is still active use Ctrl+C to close the session and then start a new one again.

    To start a Node terminal, and then the following setup:

    ```js
    const { getPool } = require('./database/database.js');
    const dbManager = require('./managers/db_manager');

    const pool = getPool();
    ```

22. We want to try enqueueing a few entities and check the number of rows in the database afterwards, (i.e. calling enqueueing 3 times should later show that there are 3 rows.)

    > You may enter `.editor` to enter editor mode which you can copy and paste the following lines

    ```js
    dbManager
        .enqueue()
        .then(function (queueId) {
            console.log(`First enqueue: ${queueId}`);
            return dbManager.enqueue();
        })
        .then(function (queueId) {
            console.log(`Second enqueue: ${queueId}`);
            return dbManager.enqueue();
        })
        .then(function (queueId) {
            console.log(`Third enqueue: ${queueId}`);
            return pool.query('select * from queue_tab');
        })
        .then(function (result) {
            console.log(`Should see 3 rows, Number of rows: ${result.rows.length}`);
        });
    ```

    You should see the following output:

    ```
    First enqueue: 1
    Second enqueue: 2
    Third enqueue: 3
    Should see 3 rows, Number of rows: 3
    ```

23. We can also simply print out all the rows to check that they are all not served

    ```js
    pool.query('select * from queue_tab').then(function (result) {
        console.log(result.rows);
    });
    ```

    You should see the following output:

    ```json
    [
        { "id": 1, "served": false }
        { "id": 2, "served": false }
        { "id": 3, "served": false }
    ]
    ```

24. We can next test the `dequeue` function. (i.e. calling dequeue 2 times should serve entity 1 and 2).

    ```js
    dbManager
        .dequeue()
        .then(function (queueId) {
            console.log(`First served ${queueId}`);
            return dbManager.dequeue();
        })
        .then(function (queueId) {
            console.log(`Second served ${queueId}`);
            return pool.query(`select * from queue_tab`);
        })
        .then(function (response) {
            console.log(response.rows);
        });
    ```

    You should observe the following:

    ```
    First served 1
    Second served 2
    [
        { "id": 1, "served": false }
        { "id": 2, "served": false }
        { "id": 3, "served": false }
    ]
    ```

25. We can be confident of the `dequeue` method only after we have tested all of it's expected behavior. Specifically, what happens when we try to dequeue an empty queue? Do we get an error? Do we get a number? Try running a script in the Node terminal to test the behavior.
26. Now that our `db_manager` is ready, we can start to prepare our `queue_manager`. Create a new file `queue_manager.js` with the following lines:

    ```js
    const dbManager = require('./db_manager');

    module.exports.enqueue = function () {
        return dbManager.enqueue().then((customerId) => ({ customer_id: customerId }));
    };
    ```

27. Following the example of `enqueue`, you should be able to implement `dequeue` as well.
28. The `queue_manager` is simple enough, write some scripts to ensure that the `enqueue` and `dequeue` of the `queue_manager` is working as expected.
29. We will now prepare the `app.js` and `router.js`. Firstly, create a new file `app.js` and include the following lines:

    ```js
    const express = require('express');
    const http = require('http');

    const app = express();
    const server = http.Server(app);

    module.exports = { app, server };
    ```

30. Now create a new file `router.js` and add the following lines:

    ```js
    const { app } = require('./app');

    module.exports = app; // this should always be the last line
    ```

    These are the modules we require to build the application.

31. Let us first create a middleware to allow us to perform some testing. Enter the following lines before the `module.exports = app` line:

    > There's en error introduced here deliberately, can you identify it? Can you rectify it?

    ```js
    app.get('/', function (req, res, next) {
        return {
            message: 'Welcome to our queue system, the following are the supported APIs',
            apis: [
                {
                    name: 'Enqueue',
                    endpoint: '/queue',
                    method: 'POST',
                },
                {
                    name: 'Dequeue',
                    endpoint: '/queue',
                    method: 'DELETE',
                },
            ],
        };
    });
    ```

32. Create a new file `www`, this is the file we will execute to start our server, inside the file include the following lines:

    ```js
    require('./commons'); // to load .env
    const app = require('./router');

    const port = process.env.PORT || 3000;
    app.listen(port, function () {
        console.log(`App listening to port ${port}`);
    });
    ```

33. In order to test the middleware we created, we will start the server and send some HTTP request. Start the server by running the following command:

    ```
    node ./www
    ```

    You should see the following error:

    ```
    Error: Cannot find module 'express'
    Require stack:
    - C:\...\2122s2-backend-bare-template\app.js
    - C:\...\2122s2-backend-bare-template\www
        at ... {
        code: 'MODULE_NOT_FOUND',
        requireStack: [
            ...
        ]
    }
    ```

    How do we rectify this? Run the command again after rectifying the error, you should observe the following:

    ```
    > node ./www
    App listening to port 3000
    ```

34. If you followed the setup instructions, you should have installed the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) plugin.
35. Create a new folder `tests` and inside create another folder `http`. Inside the `http` folder, create a new file `enqueue-dequeue.test.http` with the following lines:

    ```http
    @host = http://localhost:3000

    ### Test

    GET {{host}} HTTP/1.1
    ```

36. You should see a `send request` on top of `GET ...`, click on it to send a HTTP request to our server.

    If you did not rectify the deliberate error on top, you should **not get any response at all**, at the bottom of VSCode, you should see a loading animation.

    -   This implies that the REST Client is waiting for a response from the server.
    -   This further implies that the server **DID NOT** send a response. Can you rectify it?

    After rectifying, You should then see a success response with the JSON we specified earlier.

37. Now we know that are app is functional, it is time to prepare the routes to hook our business logic to the app.
38. Create a new directory `routes` and inside the folder, create a new file `queue_route.js` with the following lines:

    ```js
    const express = require('express');
    const queueManager = require('../managers/queue_manager');

    const router = express.Router();

    // enqueue
    router.post('/', (req, res, next) =>
        queueManager
            .enqueue()
            .then((response) => res.status(201).json(response))
            .catch(next),
    );

    module.exports = router;
    ```

    > Which API is this for? enqueue? or dequeue?

39. Following the above example, create another middleware for the other API. (Hint: What's the Request Method? Which manager's method do we call? How about the response status?)
40. Back in `routes.js` add the following lines:

    ```js
    // after: const { app } = require('./app');
    const queueRoute = require('./routes/queue_route');

    // after: the first middleware
    app.use('/queue', queueRoute);
    ```

41. Time to test our application, open up `enqueue-dequeue.test.http` once again and add the following request:

    ```
    ### Enqueue

    POST {{host}}/queue HTTP/1.1
    ```

42. Since we've made changes to our backend, restart the backend.
43. Send the Enqueue request.

    You should observe the following response:

    ```
    HTTP/1.1 201 Created
    X-Powered-By: Express
    Content-Type: application/json; charset=utf-8
    Content-Length: 17
    ETag: W/"11-ew7NUaqKr3R9pv4A63HBVEpsxF4"
    Date: Wed, 24 Mar 2021 01:50:34 GMT
    Connection: close

    {
        "customer_id": 8
    }
    ```

    **Things to note:**

    -   Is your response code 200 or 201?

44. Using Node terminal, verify that the new row has indeed been added.

    ```js
    const { getPool } = require('./database/database');
    getPool()
        .query('select * from queue_tab')
        .then((response) => response.rows)
        .then(console.log);
    ```

45. Add another request in `enqueue-dequeue.test.http` for dequeue. Run it and check it in the Node Terminal.
46. We have successfully implemented & tested the happy flow of `enqueue` and `dequeue`.
47. What happens if we send a request that is not defined within our app? For example:

    ```
    ### Not Found

    GET {{host}}/afjsdlfjsdl HTTP/1.1
    ```

    Add the above lines into `enqueue-dequeue.test.http` and execute it, you should see the following:

    ```
    HTTP/1.1 404 Not Found
    X-Powered-By: Express
    Content-Security-Policy: default-src 'none'
    X-Content-Type-Options: nosniff
    Content-Type: text/html; charset=utf-8
    Content-Length: 150
    Date: Wed, 24 Mar 2021 01:54:38 GMT
    Connection: close

    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="utf-8">
    <title>Error</title>
    </head>
    <body>
    <pre>Cannot GET /afjsdlfjsdl</pre>
    </body>
    </html>
    ```

48. Since we want our application to only return JSON instead of HTML, we will now write some error handling mechanism.
49. Let's first create another file `errors.js` to store our error definitions. In the file, add the following lines:

    ```js
    /* eslint-disable max-classes-per-file */

    module.exports.ERROR_CODE = {
        URL_NOT_FOUND: 'URL_NOT_FOUND',
    };

    module.exports.UrlNotFoundError = class UrlNotFoundError extends Error {};
    ```

50. Return to `router.js` and import the 2 error definition near the top of the file we just created:

    ```js
    // after: const queueRoute = require('./routes/queue_route');
    const { ERROR_CODE, ...errors } = require('./errors');
    ```

51. Still in `router.js` add the following lines at the bottom of the file. (_Try it: What happen if you add it before the first middleware?_)

    ```js
    // before: module.exports = app;

    // 404
    app.use((req, res, next) => next(new errors.UrlNotFoundError(`${req.method} ${req.originalUrl} Not Found`)));

    // error handler
    // eslint-disable-next-line no-unused-vars
    app.use((error, req, res, next) => {
        // Console.error for quick debugging using console
        console.error(error); // eslint-disable-line no-console

        // Extract information
        let status = 500;
        let code = ERROR_CODE.UNEXPECTED_ERROR;
        let message = 'Unexpected Error!';
        const reason = error.message;

        // Special case of errors
        if (error instanceof errors.UrlNotFoundError) {
            status = 404;
            code = ERROR_CODE.URL_NOT_FOUND;
            message = `Resource not found`;
        }

        const payload = { code, error: message, reason };

        // Log and respond accordingly.
        return res.status(status).json(payload);
    });
    ```

52. Restart your server, now run the request to trigger a 404 again. Observe the difference.
53. And that's it, you now have a minimally working backend to support enqueue and dequeue.
54. You can now head over to https://github.com/ades-fsp/2122s1-backend to see the extended backend you will be given to work with on your CA1

## Instructions - Unit Testing

> This assumes that you have completed the above instructions

1. We will be using the `Monkey Patching` technique in the following test instructions.
2. First, recall that one desired property of unit test is its ability to be isolated from external dependencies such as database. the `queueManager` however has an implicit dependency on the database.
3. We will overcome this by making `queueManager` import a fake `dbManager` and control the behavior of the fake `dbManager` in order to test the behavior of `queueManager`.
4. It is important to note that this method is possible because NodeJs caches imported modules\* and we can manipulate the cache to adjust the behavior of imported modules.
5. Open a new node terminal by running the following command:

    ```
    node
    ```

6. We will first import the `dbManager` module.

    ```js
    const dbManager = require('./managers/db_manager');
    ```

7. We will modify it's `dequeue` function such that it will not send any sql statement to the database.

    ```js
    dbManager.dequeue = function () {
        return Promise.resolve(12);
    };
    ```

    > Note: when patching your functions, do pay attention to its expected return type. The `dequeue` function is expected to return a Promise, which resolves to an integer representing the customer_id. Thus I have made it such that the patched function behaves the same way.

8. We know that if `dbManager.dequeue` resolves with the number `12`, by observing the implementation of `queueManager.dequeue`, then `queueManager.dequeue` should resolve with `{ customer_id: 12 }`. We will check if this is true by executing the `queueManager.dequeue` function.

    ```js
    const queueManager = require('./managers/queue_manager.js');
    queueManager.dequeue().then(console.log);
    ```

    You should see the following:

    ```
    > queueManager.dequeue().then(console.log);
    Promise { <pending> }
    > { customer_id: 12 }
    ```

9. You may like to try again with another `customer_id` to get a confirmation that is it indeed based on your patched function.
10. Instead of remembering what the expected output is, we may like to add some reporting mechanism that would report whether the test was successful or not. Run the following line:

    > type .editor to enter editor mode where you can copy and paste multiline code.

    ```js
    queueManager.dequeue().then((result) => {
        if (
            JSON.stringify(result) ==
            JSON.stringify({
                customer_id: 12,
            })
        ) {
            // Expected
            console.log('✔️ queueManager.dequeue resolves correctly');
        } else {
            console.log('❌ queueManager.dequeue resolves incorrectly');
        }
    });
    ```

11. Sometimes, we would like to ensure that our test is working correctly by making it fail deliberately. Change the expected output's `customer_id` to `13` instead of `12`. This should fail since we know that `queueManager.dequeue` will surely return `12` instead of `13`.

    ```js
    queueManager.dequeue().then((result) => {
        if (
            JSON.stringify(result) ==
            JSON.stringify({
                customer_id: 13, // Changed from 12 to 13
            })
        ) {
            console.log('✔️ queueManager.dequeue resolves correctly');
        } else {
            // Expected
            console.log('❌ queueManager.dequeue resolves incorrectly');
        }
    });
    ```

12. At this point, you may wonder, "Whoa, do I need to do this every time I make some changes?". The answer is `Yes 🙃`, thus we should definitely do something that would allow re-running of tests easily. We can do that simply by saving the lines in a file. Create a new folder `unit` under the `tests` folder, inside the `unit` folder, create a new file `queue_manager.test.js`, and inside the file, paste the following lines:

    ```js
    const dbManager = require('../../managers/db_manager');
    const queueManager = require('../../managers/queue_manager');
    dbManager.dequeue = function () {
        return Promise.resolve(12);
    };
    queueManager.dequeue().then((result) => {
        if (
            JSON.stringify(result) ==
            JSON.stringify({
                customer_id: 12,
            })
        ) {
            console.log('✔️ queueManager.dequeue resolves correctly');
        } else {
            console.log('❌ queueManager.dequeue resolves incorrectly');
        }
    });
    ```

13. You can now rerun the test easily by running the script whenever you want to test.

    ```
    node ./tests/unit/queue_manager.test.js
    ```

14. Let us add another test. This time round, we want to test the behavior of `queueManager.dequeue` when `dbManager.dequeue` rejects instead of resolve.
15. Before we do that, recall that a characteristic of Unit test is that one unit test should not affect another unit test, so it is always good to revert the system to initial state before proceeding to the next unit test. Make the following changes accordingly:

    ```js
    const oldDbManagerDequeue = dbManager.dequeue; // Store original implementation
    dbManager.dequeue = function () {}; // code omitted
    queueManager
        .dequeue()
        .then() // code omitted
        .finally(function () {
            // Do it only at the end of the test.
            dbManager.dequeue = oldDbManagerDequeue; // Revert to original implementation
        });
    ```

16. In our example, after patching `dbManager.dequeue`, we do not have any asynchronous operations, but suppose we do have asynchronous code and wants to ensure that a test really completes before going to the next test. We can ensure that by building some test runner like the following:

    > In this module, you may choose to ignore how the test runner work.
    > But it would be important to understand how to add a new test.

    ```js
    const _tests = [];
    function it(description, testFn) {
        _tests.push([description, testFn]);
    }

    function _testRunner(tests = _tests, i = 0, successCount = 0) {
        if (i === tests.length) return console.log(`Finished running all ${i} test, result: ${successCount}/${i}`);
        const [description, testFn] = tests[i];
        // We expect each testFn to resolve successfully with a boolean isSuccess.
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

    // use `it` to add tests

    _testRunner();
    ```

17. We would then have to make the following adjustment to our existing code:

    ```js
    const dbManager = require('../../managers/db_manager');
    const queueManager = require('../../managers/queue_manager');

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

    // Store originals
    const oldDbManagerDequeue = dbManager.dequeue;
    function revertDbManagerDequeue(result) {
        dbManager.dequeue = oldDbManagerDequeue;
        return result;
    }

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

    // Run the tests
    // Important: Keep this as the last line
    _testRunner();
    ```

18. Now we are ready to add another new test, once again, we will patch the `dbManager.dequeue` function to do what we want it to do and revert it back once we are done.

    ```js
    // before testRunner();
    it('Should reject dequeue correctly', function () {
        dbManager.dequeue = function () {
            return Promise.reject('ERROR!');
        };
        // Important: Return the promise
        return queueManager
            .dequeue()
            .then(() => false)
            .catch((error) => error === 'ERROR!')
            .then(revertDbManagerDequeue);
    });
    ```

19. There you have it, the use of `Monkey Patching` to remove dependencies in order to unit test our components.
20. We will be reusing the test runner in the integration test, so lets abstract it into a module.
21. In the test folder, create a new file `test_driver.js` and add the following lines:

    ```js
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
    ```

22. Modify `queue_manager.test.js` accordingly:

    ```js
    const { it, run } = require('../test_driver');
    const dbManager = require('../../managers/db_manager');
    const queueManager = require('../../managers/queue_manager');

    // TODO: Delete _tests, it and _testRunner

    // Store originals
    const oldDbManagerDequeue = dbManager.dequeue;
    function revertDbManagerDequeue(result) {
        dbManager.dequeue = oldDbManagerDequeue;
        return result;
    }

    // use `it` to add tests.
    it('should resolve dequeue correctly', function () {});

    it('Should reject dequeue correctly', function () {});

    // Run the tests
    // Important: Keep this as the last line

    // TODO: Replace _testRunner with run
    run();
    ```

## Instructions - Integration Testing

1. Recall that we are going perform integration test by sending requests to an app that is connected to a fake database.
2. Your docker has already been setup in a way that it would spin up 2 separate database `db` and `db-test`. By the settings in our `.env` file, it connects to `db`. Thus we will use `Monkey Patching` to make the app connect to `db-test`.
3. First let us create a new folder `integration` in the `tests` folder. And inside the `integration` folder, add a file `router.test.js`
4. We will be making use of the same test runner to ensure sequential execution of asynchronous function. So import the `it` and `run` functions from `test_runner`

    ```js
    const { it, run } = require('../test_driver');

    // We will call run() only after the server has started at a later step.
    ```

5. Next, we will patch the `database.js` file such that it connects to `db-test` instead of `db`. Add the following line into the file:

    ```js
    const { Client } = require('pg');
    const database = require('../../database/database');
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
    ```

6. NodeJs by default does not have `fetch`. Let us install the `node-fetch` module

    ```
    npm install --save-dev node-fetch
    ```

    > Once again, node-fetch is used only during development and testing, and not needed otherwise, so we use the --save-dev flag.

7. We can now write a simple 404 test.

    ```js
    const fetch = require('node-fetch');
    const testPort = 3456;
    const url = `http://localhost:${testPort}`;
    it('Should respond with status = 404', function () {
        fetch(`${url}/fsldkjflsdjflksd`).then((response) => response.status == 404);
    });
    ```

8. Run this test to see that it is successful.

    ```
    node test .\tests\integration\router.test.js
    ```

9. Before we can run this, we need to run the application and run the test runner. Do that by adding the following:

    ```js
    // at the bottom of the file.
    const app = require('../../router.js');
    // Create server connection
    const server = app.listen(testPort, function (error) {
        if (error) {
            client.end();
            return console.log(error);
        }
        run()
            .catch(console.log) // Simply console.log any errors
            .finally(() => client.end()) // Close database connection
            .then(() => server.close()); // Close server connection
    });
    ```

10. Before we run any test, we may want to delete everything in the database first to ensure a clean state. To do so, we can make the following modification:

    ```js
    // at the bottom of the file.
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
    ```

11. Now to test something that actually hits the database. We can try some enqueue.

    ```js
    it('Should enqueue first customer with customer_id = 1', function () {
        return fetch(`${url}/queue`, { method: 'POST' })
            .then((response) => response.json())
            .then((json) => json.customer_id === 1); // Identity equality to ensure numerical type
    });
    ```

12. Run this test to see that it is successful.

    ```
    node test .\tests\integration\router.test.js
    ```

13. One more test for a double confirmation.

    ```js
    it('Should enqueue second customer with customer_id = 2', function () {
        return fetch(`${url}/queue`, { method: 'POST' })
            .then((response) => response.json())
            .then((json) => json.customer_id === 2); // Identity equality to ensure numerical type
    });
    ```

14. We may wish to test dequeue also.

    ```js
    it('Should dequeue first customer with customer_id = 1', function () {
        return fetch(`${url}/queue`, { method: 'DELETE' })
            .then((response) => response.json())
            .then((json) => json.customer_id === 1); // Identity equality to ensure numerical type
    });
    ```

15. Test it and then design a scenario to test what happens when you dequeue when the queue is empty.
16. Design another scenario to test that the `customer_id` does not decrease when the queue is dequeued.
17. And there you have it, an automated integration test that uses a test database.
18. You may wish to explore libraries such as `jest` (Provided in template repository) which provides more features beyond our simple test runner to facilitate processes such as error reporting.
