const express = require('express')
const cors = require('cors')
const app = express()
const consign = require('consign')
const db = require('./config/db')
const fs = require('fs')
const path = require('path')
const logsDir = 'logs'
const moment = require('moment')
const assets = path.join(__dirname, "../../public_html/assets/")
const port = process.env.PORT || 3000

app.use(express.static(assets))
app.use(cors())
app.db = db
app.assets = assets

Object.defineProperty(global, '__stack', {
    get: function () {
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function (_, stack) {
            return stack;
        };
        var err = new Error;
        Error.captureStackTrace(err, arguments.callee);
        var stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

Object.defineProperty(global, '__line', {
    get: function () {
        return __stack[1].getLineNumber();
    }
});

Object.defineProperty(global, '__function', {
    get: function () {
        return __stack[1].getFunctionName();
    }
});

consign()
    .include('./config/passport.js')
    .then('./config/middlewares.js')
    .then('./api/validation.js')
    .then('./api/mailer.js')
    .then('./api/mailerCli.js')
    .then('./api/sisEvents.js')
    .then('./api')
    .then('./config/routes.js')
    .into(app)


app.listen(port, async() => {
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(path.join(__dirname, logsDir), (err) => {
            if (err) {
                app.api.logger.logInfo({ log: { line: `Directory logs create error! Error: ${err}`, sConsole: false } })
                return console.error(err);
            }
        });
        app.api.logger.logInfo({ log: { line: `Directory logs created successfully!`, sConsole: true } })
    }
    const clientes = await app.db('params')
        .select('value')
        .where({ meta: 'clientName', dominio: 'root' })
        .andWhereNot({ value: 'root' }).then()
    clientes.forEach(async elementClient => {
        const dominios = await app.db('params')
            .select('value')
            .where({ meta: 'domainName', dominio: elementClient.value }).then()
        dominios.forEach(elementDomain => {
            const photosDir = `./assets/images/${elementClient.value}/${elementDomain.value}`
                // const photosDir = `../frontend/src/assets/images/${elementClient.value}/${elementDomain.value}`
            if (!fs.existsSync(photosDir)) {
                fs.mkdirSync(path.join(__dirname, photosDir), { recursive: true }, (err) => {
                    if (err) {
                        app.api.logger.logInfo({ log: { line: `Directory photos create error! Error: ${err}`, sConsole: false } })
                        return console.error(err);
                    }
                });
                app.api.logger.logInfo({ log: { line: `Directory photos created successfully!`, sConsole: true } })
            }
        })
    })
    moment().toString()     
    app.api.logger.logInfo({ log: { line: `Backend executando na porta ${port}`, sConsole: true } })
 
})