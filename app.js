import express from 'express';
import { engine } from 'express-handlebars';
import fileUpload from 'express-fileupload';
import { fileURLToPath } from 'url';
import { dirname } from 'path';


import { readAppSettings, appSettings } from "./models/app-settings.js";
import { readBrowsersList } from "./models/browsers-list.js";
import { readSuitesMetadata } from "./models/suites-metadata.js";
import { readTestsData } from "./models/tests-data.js";
import testRouter from './routes/testing.js';
import { resetTestSettings } from './models/test-settings.js';


console.log('Launching menu...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

app.engine('hbs', engine({extname: '.hbs', partialsDir: __dirname + '/views/partials'}));
app.set('view engine', 'hbs');
app.set('views', './views');
app.use(express.static('public'));
app.use(express.urlencoded());
app.use(fileUpload());

app.use('/tests', testRouter);

app.get('/', (_, res) => res.redirect('/tests'));

resetTestSettings()
.then(() => Promise.all([readBrowsersList(), readSuitesMetadata(), readAppSettings(), readTestsData()]))
.then(() => {

    app.use((_, res, next) => {
        res.locals.title = appSettings.applicationName;
        next();
    })

    app.listen(3000, () => console.log(`Testing menu is available at http://localhost:${process.env.TESTS_MENU_PORT || 3000}`));
});

