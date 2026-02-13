# Playwright UI menu

## Description

This repository allows to configure and show a Playwright testing menu in the browser. Tests can then be launched directly from this menu, instead of using the command line. The testing menu uses a Docker container, therefore it does *not* require Node.js or NPM to be installed, just Docker.

## Usage

To begin, copy the contents of /example-app into your directory.

### App settings

The file /settings/app-settings.json can be modified to suit your needs. "applicationName" property will be the title of the page and the menu header. The required property "defaultBrowsersToUse" is an array of browsers that will be selected by default to run the tests (full list of available browsers is inside /metadata/available-browsers.json). 

The property "globalSettings" is an array of inputs that will be shown in menu and applied to all tests. These can be accessed inside the test files:
```
import readSettingsSync from '../ui-lib/read-settings-sync.js';
const settings = readSettingsSync();
const { baseUrl } = settings.global;
```

If a global setting has "showInSettingsPage" set to true, you will be able to update its default value via the /settings page.

The "fileUploads" array is a list of files that can be uploaded via the /settings page to be used later:

```
  "fileUploads": [
    {
      "name": "dummyFileInput",
      "label": "Some more tests info",
      "accept": "txt",
      "savePath": "/metadata/dummy-data.txt"
    }
  ]
```
### Setting environment variables

You can create a .env file and set new values inside it: TEST_MENU_PORT and TEST_RESULTS_PORT to change the ports that serve the menu and the test results. This file can also be used to pass secrets and additional settings to the container:

.env:

```
MY_SECRET="hello-world"
TESTS_MENU_PORT=3001
TESTS_RESULTS_PORT=3002

```

compose.yaml:

```

services:
    my-tests:
      environment:
        - MY_SECRET
        - TESTS_MENU_PORT
        - TESTS_RESULTS_PORT

```

*Note*: changes to .env require container restart.

### Adding authentication

To enable authentication, add USERNAME variable to .env and uncomment password.txt session in compose.yaml.
Other environment variables that affect authentication are: SALT_ROUNDS (used to encrypt password, default is 10), SESSION_SECRET (default is to randomly generate secret on app start), SESSION_COOKIE_MAX_AGE.

Create empty "password.txt" file in the root directory.

After that, pass the environment variables to container and bind the password file:

```
services:
    environment:
      - USERNAME
      - SESSION_SECRET
      - SESSION_COOKIE_MAX_AGE
      - TESTS_MENU_PORT
      - TESTS_RESULTS_PORT
    volumes:
      - type: bind
        source: ./password.txt
        target: /app/password.txt
```

The first time the container is launched, you will be prompted to set a password. It will be encrypted with bcrypt and stored inside "password.txt". To reset password, empty the "password.txt" file.

### Developing tests

#### Creating new test suite

1) To begin, create a new folder inside /metadata/suites and give this folder the machine name of the suite. For example, /metadata/suites/my-new-suite.

2) Inside the folder create a file named suite-metadata.json with the description of the suite:

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

Pick a name for the test file, it must end in ".spec.js". For example, "my-new-test.spec.js". Add this filename to the list of test file names in one of the existing suites. For example, if we want to add this test to "My new suite", we will edit "/metadata/suites/my-new-suite/suite-metadata.json":

```
{
    "title": "My new suite",
    "testFiles": ["my-new-test.spec.js"]
    "sequential": true,
    "sequenceInterval": 60000
}
```

2) Writing the test

The test file must be placed inside "/tests" and have the name we picked in step 1).

All tests must be grouped, these will be the test categories that we see in the menu. When there are several test files in one suite, all the test groups across all files will be concatenated and shown as one list under that suite name. To group tests inside a test file, one must call the createDescribe() function and pass the file name to it. The returned value will be a function that can be used the same way that a test.describe() function would. The difference is that behind the scenes, this new function reads the test settings and filters out the categories we must skip when we launch the tests. 

The separate tests inside of each group must be registered using the test() function. *Important*: this function must be imported from "../ui-lib/fixtures.js", *not* directly from Playwright. The reason is that the fixture adds test progress logging.

Example:

```
import { test } from "../ui-lib/fixtures.js";
import createDescribe from '../ui-lib/describe.js';

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

3) Optional: add beforeEach() and afterEach() functions:

If you want to add a beforeEach function to run before every one of your tests or an afterEach function to run after each test, you can add this logic inside the functions in /hooks/before-each.js and /hooks/after-each.js.

#### Adding npm modules

You may need to add npm packages to use in your tests. To do so, create a package.json file in your root directory, specifying the packages you want to add (using "npm init"):

```
{
  "name": "my-app",
  "version": "1.0.0",
  "description": "",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "package-i-want-to-add": "^1.1.0"
  }
}
```
After that, uncomment the corresponding bind in compose.yaml:

```
- type: bind
  source: ./package.json
  target: /app/aux-dependencies/package.json
```

When you restart the container, the Node modules will be installed inside the container and you will be able to use them in your tests.


### Running tests

To launch the menu for the first time, one must create a Docker container for the tests:

```
docker-compose up --build
```

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