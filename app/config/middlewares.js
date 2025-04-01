const bodyParser = require('body-parser')

module.exports = app => {
    app.use(bodyParser.json({ limit: '10mb', extended: true }))
    app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }))
    app.use(bodyParser.text({ limit: '10mb', extended: true }));
}