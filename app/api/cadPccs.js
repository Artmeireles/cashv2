const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const tabela = 'cad_pccs'
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99
    const limit = 20 // usado para paginação
    const get = async(req, res) => {
        const uParams = await app.db('users').where({ id: req.user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.cad_servidores >= 1, `${noAccessMsg} "Exibição de PCCs"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const body = {...req.body }
        const page = req.query.page || 1
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`

        let sql = app.db(tabelaDomain)
            .select(app.db.raw('count(*) as count'))
            .andWhere(app.db.raw(`${tabelaDomain}.status = ${STATUS_ACTIVE}`))
        const result = await app.db.raw(sql.toString())
        const count = parseInt(result[0][0].count) || 0

        let ret = app.db(tabelaDomain)
            .andWhere(app.db.raw(`${tabelaDomain}.status = ${STATUS_ACTIVE}`))
            .limit(limit).offset(page * limit - limit)
            .orderBy('nome_pccs')
            .then(body => {
                return res.json({ data: body, count, limit })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getById = async(req, res) => {
        const uParams = await app.db('users').where({ id: req.user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.cad_servidores >= 1, `${noAccessMsg} "Exibição de PCC"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const ret = app.db(tabelaDomain)
            .where({ id: req.params.id })
            .first()
            .then(body => {
                return res.json({ data: body })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getListaPccs = async(req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.cad_servidores >= 1, `${noAccessMsg} "Exibição de lista de PCCs"`)
        } catch (error) {
            return res.status(401).send(error)
        }

        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        let sql = app.db(tabelaDomain)
            .select('id', 'id_pccs', 'nome_pccs', 'nivel_pccs').orderBy('id_pccs', 'nome_pccs')
            .then(body => {
                return res.json({ data: body })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }


    return {get, getById, getListaPccs }
}