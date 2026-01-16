# Playwright UI menu

## Description

This repository allows to configure and show a Playwright testing menu in the browser. Tests can then be launched directly from this menu, instead of using the command line. The testing menu uses a Docker container, therefore it does *not* require Node.js or NPM to be installed, just Docker.

## Usage

### Developing tests

#### Creating new test suite

1) To begin, one must create a new folder inside /test-suites and give this folder the machine name of the suite. For example, /test-suites/my-new-suite.

2) Inside the folder one must create a file named suite-metadata.json with the description of the suite:

```
{
    "title": "My new suite",
    "testFiles": [],
    "sequential": true,
    "sequenceInterval": 60000
}
```

The required "title" property is what will be shown in the testing menu. The required "testFiles" array defines the names of the test files belonging to this test suite (empty for now, we will add them later). If set to "true", the optional "sequenceInterval" property makes all tests run one after the other (normally Playwright runs several tests at the same time). The optional property "sequenceInterval", given in milliseconds, defines the interval of time to wait between the end of one test and the beginning of the next one (when tests are run sequentially).

Note: if a sequential suite is chosen, *all* tests will run sequentially, not just the ones belonging to the sequential suite. This slows down the testing process considerably, therefore it is better to run such suites separately from parallel (no "sequential" property) suites.

#### Creating new test file

1) Registering the test 

Pick a name for the test file, it must end in ".spec.js". For example, "my-new-test.spec.js". Add this filename to the list of test file names in one of the existing suites. For example, if we want to add this test to "My new suite", we will edit "/tests-data/suites/my-new-suite/suite-metadata.json":

```
{
    "title": "My new suite",
    "testFiles": ["my-new-test.spec.js"]
    "sequential": true,
    "sequenceInterval": 60000
}
```

```

2) Writing the test

The test file must be placed inside "/tests" and have the name we picked in step 1).

All tests must be grouped. To do so, one must call the createDescribe() function and pass the file name to it. The returned value will be a function that can be used the same way that a test.describe() function would. The difference is that behind the scenes, this new function reads the test settings and filters out the tests we must skip.

The separate tests inside of each group must be registered using the test() function. *Important*: this function must be imported from "./fixtures.js", *not* directly from Playwright. The reason is that the fixture adds test progress logging.

Example:

```
import { test } from "./fixtures.js";
import createDescribe from './lib/describe.js';

const describe = createDescribe("my-new-test.spec.js");

describe('category 1', () => {
    test('Test 1', () => {
        // ...
    })

    test('Test 2', () => {
        // ...
    })
})

```

### Running tests

To launch the menu for the first time, one must create a Docker container for the tests:

```
docker-compose up --build
```

This will take a while to complete.

To stop the container:

```
docker-compose down
```

To restart:

```
docker-compose up
```

After the container has been created, the testing menu will be available at 'http://localhost:3000' (or a different port, see "updating settings" section) in the browser. Select the necessary settings and click on "run tests". The page will show how the tests are progressing, which ones are pending (⏸️), running (▶️), passed (✅) or failed (❌).

Once the tests are done, you can click on "view test results". You will be redirected to http://localhost:9323 (or whatever port has been set in settings), where the tests report is served with additional details about how the tests went. To run new tests, go back to 'http://localhost:3000'.


### Updating settings

By default, the menu is served on port 3000 and the results on port 9323. To change these set new values inside ".env": TEST_MENU_PORT and TEST_RESULTS_PORT. This file can also be used to pass secrets and additional settings to the container:

.env:

```
MY_SECRET="hello-world"
TESTS_MENU_PORT=3001
TESTS_RESULTS_PORT=3002

```

compose.yaml:

```

services:
    environment:
      - MY_SECRET
      - TESTS_MENU_PORT
      - TESTS_RESULTS_PORT

```

*Note*: changes to .env require container restart.

Updates can be made to the app-settings.json file in order to customize the menu:

```
{
  "applicationName": "Playwright Menu", // Title of the page
  "defaultBrowsersToUse": [ // Browsers selected by default in the testing menu
    "chromium"
  ]
}

```
