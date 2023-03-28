const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const tabela = 'params'
    const STATUS_ACTIVE = 10
    const STATUS_TRASH = 20
    const get = (req, res) => {
        const body = { ...req.body }
        const first = body.first && body.first == true
        const forceDominio = body.forceDominio && body.forceDominio == true
        const order = body.order || 'created_at'
        try {
            existsOrError(body.meta, 'Meta de retorno não informado')
        } catch (error) {
            return res.status(400).send(error)
        }
        const meta = body.meta
        let sql = app.db({ tbl1: tabela })
            .where({ meta: meta, 'tbl1.status': STATUS_ACTIVE })
            console.log(forceDominio);
        if (forceDominio) {
            try {
                existsOrError(body.dominio, 'Domínio não informado')
            } catch (error) {
                return res.status(400).send(error)
            }
        }
        if (body.dominio) sql.where({ 'tbl1.dominio': body.dominio })
        if (body.value) sql.where({ 'tbl1.value': body.value })
        sql.where(app.db.raw(`tbl1.value != 'root'`))
            .orderBy(order)
        if (first) sql.first()
        result = app.db.raw(sql.toString())
            .then(ret => res.status(200).send({ data: ret[0] }))
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getById = async (req, res) => {
        const ret = app.db(tabela)
            .where({ id: req.params.id, status: STATUS_ACTIVE })
            .first()
            .then(body => {
                return res.json({ data: body })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }



    const getPonteId = async (req, res) => {
        const ret = app.db(tabela)
            .where({ dominio: 'root', meta: 'ponte' })
            .first()
            .then(body => {
                return res.json({ data: body.value })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getSiapId = async (req, res) => {
        const ret = app.db(tabela)
            .where({ dominio: 'root', meta: 'siap' })
            .first()
            .then(body => {
                return res.json({ data: body.value })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getESocialId = async (req, res) => {
        const ret = app.db(tabela)
            .where({ dominio: 'root', meta: 'esocial' })
            .first()
            .then(body => {
                return res.json({ data: body.value })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getESocialJarId = async (req, res) => {
        const ret = app.db(tabela)
            .where({ dominio: 'root', meta: 'esocialjar' })
            .first()
            .then(body => {
                return res.json({ data: body.value })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    return { get, getById, getPonteId, getSiapId, getESocialId, getESocialJarId }
}