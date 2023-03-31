const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const database = 'api'
    const tabela = 'params'
    const STATUS_ACTIVE = 10
    const STATUS_TRASH = 20
    const STATUS_DELETE = 99

    const save = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        const body = { ...req.body }
        if (req.params.id) body.id = req.params.id
        try {
            // Alçada para edição
            if (body.id)
                isMatchOrError(uParams && uParams.admin >= 1, `${noAccessMsg} "Edição de ${tabela}"`)
            // Alçada para inclusão
            else isMatchOrError(uParams && uParams.admin >= 1, `${noAccessMsg} "Inclusão de ${tabela}"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${database}.${tabela}`

        try {
            existsOrError(body.dominio, 'Domínio não informado')
            existsOrError(body.meta, 'Meta não informado')
            existsOrError(body.value, 'Valor não informado')
            //existsOrError(body.label, 'Label não informado')
        }
        catch (error) {
            return res.status(400).send(error)
        }

        if (body.id) {
            // Variáveis da edição de um registro
            // registrar o evento na tabela de eventos
            const { createEventUpd } = app.api.sisEvents
            const evento = await createEventUpd({
                "notTo": ['created_at', 'evento',],
                "last": await app.db(tabelaDomain).where({ id: body.id }).first(),
                "next": body,
                "request": req,
                "evento": {
                    "evento": `Alteração de cadastro de ${tabela}`,
                    "tabela_bd": tabela,
                }
            })

            body.evento = evento
            body.updated_at = new Date()
            let rowsUpdated = app.db(tabelaDomain)
                .update(body)
                .where({ id: body.id })
            rowsUpdated.then((ret) => {
                if (ret > 0) res.status(200).send(body)
                else res.status(200).send('Parâmetro não foi encontrado')
            })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
        } else {
            // Criação de um novo registro
            const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()

            body.evento = nextEventID.count + 1
            // Variáveis da criação de um novo registro
            body.status = STATUS_ACTIVE
            body.created_at = new Date()

            app.db(tabelaDomain)
                .insert(body)
                .then(ret => {
                    body.id = ret[0]
                    // registrar o evento na tabela de eventos
                    const { createEventIns } = app.api.sisEvents
                    createEventIns({
                        "notTo": ['created_at', 'evento'],
                        "next": body,
                        "request": req,
                        "evento": {
                            "evento": `Novo registro`,
                            "tabela_bd": tabela,
                        }
                    })
                    return res.json(body)
                })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
        }
    }

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

    const remove = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError((uParams && uParams.admin >= 1), `${noAccessMsg} "Exclusão de cadastro de ${tabela}"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${database}.${tabela}`
        const registro = { status: STATUS_DELETE }
        try {
            // registrar o evento na tabela de eventos
            const last = await app.db(tabelaDomain).where({ id: req.params.id }).first()
            const { createEventUpd } = app.api.sisEvents
            const evento = await createEventUpd({
                "notTo": ['created_at', 'evento'],
                "last": last,
                "next": registro,
                "request": req,
                "evento": {
                    "classevento": "Remove",
                    "evento": `Exclusão de cadastro de ${tabela}`,
                    "tabela_bd": tabela,
                }
            })
            const rowsUpdated = await app.db(tabelaDomain)
                .update({
                    status: registro.status,
                    updated_at: new Date(),
                    evento: evento
                })
                .where({ id: req.params.id })
            existsOrError(rowsUpdated, 'Registro não foi encontrado')

            res.status(204).send()
        } catch (error) {
            res.status(400).send(error)
        }
    }

    return { save, remove, get, getById, getPonteId, getSiapId, getESocialId, getESocialJarId }
}