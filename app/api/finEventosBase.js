const moment = require('moment')
const randomstring = require("randomstring")
const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, notExistsOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const { mailyCliSender } = app.api.mailerCli
    const tabela = 'fin_eventosbase'
    const tabelaEventos = 'fin_eventos'
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99

    const save = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        const body = { ...req.body }
        try {
            // Alçada para edição
            if (body.id)
                isMatchOrError(uParams && uParams.financeiro >= 3, `${noAccessMsg} "Edição de evento financeiro"`)
            // Alçada para inclusão
            else isMatchOrError(uParams && uParams.financeiro >= 2, `${noAccessMsg} "Inclusão de evento financeiro"`)
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${user.cliente}_${user.dominio}.${tabela}`
        if (req.params.id) body.id = req.params.id

        try {
            existsOrError(body.id_fin_eventos, 'Evento base não informado')
            existsOrError(body.id_fin_eventosbase, 'Evento pertencente à base não informado')
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
            return res.status(400).send(error)
        }

        if (body.id) {
            // Variáveis da edição de um registro
            // registrar o evento na tabela de eventos
            const { createEventUpd } = app.api.sisEvents
            const evento = await createEventUpd({
                "notTo": ['created_at', 'evento', 'updated_at'],
                "last": await app.db(tabelaDomain).where({ id: body.id }).first(),
                "next": body,
                "request": req,
                "evento": {
                    "evento": `Alteração de base de evento financeiro`,
                    "tabela_bd": tabela,
                }
            })

            body.evento = evento
            body.updated_at = new Date()
            const rowsUpdated = await app.db(tabelaDomain)
                .update(body)
                .where({ id: body.id })
                .then((ret) => {
                    return res.status(200).send(body)
                })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
            existsOrError(rowsUpdated, 'Evento financeiro não foi encontrado')
        } else {
            // Criação de um novo registro
            const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()

            body.evento = nextEventID.count + 1
            // Variáveis da criação de um novo registro
            body.status = STATUS_ACTIVE
            body.dominio = user.dominio
            body.created_at = new Date()

            app.db(tabelaDomain)
                .insert(body)
                .then(ret => {
                    body.id = ret[0]
                    // registrar o evento na tabela de eventos
                    const { createEventIns } = app.api.sisEvents
                    createEventIns({
                        "notTo": ['created_at', 'evento', 'updated_at'],
                        "next": body,
                        "request": req,
                        "evento": {
                            "evento": `Novo evento financeiro`,
                            "tabela_bd": tabela,
                        }
                    })
                    return res.json({ id: body.id })
                })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
        }
    }

    const saveByBatch = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para edição
            isMatchOrError(uParams && uParams.financeiro >= 3, `${noAccessMsg} "Edição de eventos em bloco"`)
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
            return res.status(401).send(error)
        }

        const batch = { ...req.body.eventosBaseFinanceiros }
        const client = req.body.client
        const domain = req.body.domain
        let batchSize = 0
        let batchDone = 0
        let batchResult = []
        let pkToUpdate = ''
        const tabelaDomain = `${dbPrefix}_${client}_${domain}.${tabela}`
        const tabelaEventosDomain = `${dbPrefix}_${client}_${domain}.${tabelaEventos}`

        for (let obj in batch) {
            ++batchSize
            const body = batch[obj];

            const bodyValidation = []
            if (!body.id_fin_eventos) bodyValidation.push('Evento base não informado')
            if (!body.id_fin_eventosbase) bodyValidation.push('Evento pertencente à base não informado')
            if (bodyValidation.length > 0) batchResult.push({ evento: body.id_fin_eventos, result: JSON.stringify(bodyValidation) })

            const bodyIdFinEvento = await app.db({ fe: tabelaEventosDomain }).where({ id_evento: body.id_fin_eventos }).first()
            const bodyIdFinEventoBase = await app.db({ fe: tabelaEventosDomain }).where({ id_evento: body.id_fin_eventosbase }).first()
            const excluded = await app.db(tabelaDomain).where({ id_fin_eventos: bodyIdFinEvento.id, id_fin_eventosbase: bodyIdFinEventoBase.id }).delete()
            console.log('excluded:', 'bodyIdFinEvento', bodyIdFinEvento.id_evento, 'bodyIdFinEventoBase', bodyIdFinEventoBase.id_evento);
            body.id_fin_eventos = (bodyIdFinEvento && bodyIdFinEvento.id ? bodyIdFinEvento.id : null) || undefined
            body.id_fin_eventosbase = (bodyIdFinEventoBase && bodyIdFinEventoBase.id ? bodyIdFinEventoBase.id : null) || undefined

            if (bodyValidation.length > 0) {
                const mail = {
                    "from": "suporte@mgcash.app.br",
                    "to": "suporte@mgcash.app.br",
                    "subject": "Erro finEventosBase saveByBatch",
                    "message": `${JSON.stringify({ cliente: client, dominio: domain, evento: body.id_evento, result: JSON.stringify(bodyValidation) })}`
                }
                req.mail = mail
                req.batch = true
                mailyCliSender(req, res)
            }

            delete body.origin

            // if (body.id) {
            //     // Variáveis da edição de um registro
            //     // registrar o evento na tabela de eventos
            //     const { createEventUpd } = app.api.sisEvents
            //     const evento = await createEventUpd({
            //         "notTo": ['created_at', 'evento', 'updated_at'],
            //         "last": await app.db(tabelaDomain).where({ id: body.id }).first(),
            //         "next": body,
            //         "request": req,
            //         "evento": {
            //             "evento": `Alteração de evento base financeiro`,
            //             "tabela_bd": tabela,
            //         }
            //     })

            //     body.evento = evento
            //     body.updated_at = new Date()
            //     await app.db(tabelaDomain)
            //         .update(body)
            //         .where({ id: body.id })
            //         .then((ret) => {
            //             batchResult.push({ evento: body.id_evento })
            //             pkToUpdate += `'${body.id_evento}',`;
            //         })
            //         .catch(error => {
            //             app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            //             batchResult.push({ evento: body.id_evento, result: 'Erro: ' + error })
            //         })
            // } else {
            // Criação de um novo registro
            const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()

            body.evento = nextEventID.count + 1
            // Variáveis da criação de um novo registro
            body.status = STATUS_ACTIVE
            body.dominio = domain
            body.created_at = new Date()

            app.db(tabelaDomain)
                .insert(body)
                .then(ret => {
                    body.id = ret[0]
                    // registrar o evento na tabela de eventos
                    const { createEventIns } = app.api.sisEvents
                    createEventIns({
                        "notTo": ['created_at', 'evento', 'updated_at'],
                        "next": body,
                        "request": req,
                        "evento": {
                            "evento": `Novo evento base financeiro`,
                            "tabela_bd": tabela,
                        }
                    })
                    batchResult.push({ evento: body.id_evento })
                    pkToUpdate += `'${body.id_evento}',`;
                    batchDone++
                })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    batchResult.push({ evento: body.id_evento, result: 'Erro: ' + error })
                })
            // }
        }
        pkToUpdate = pkToUpdate.substring(0, pkToUpdate.length - 1)
        const result = {
            'done': batchDone,
            'batchResult': batchResult,
            'sqlUpdate': ''
        }
        return res.status(200).send(result)
    }

    const limit = 20 // usado para paginação
    const get = async (req, res) => {
        let user = req.user
        const id_fin_eventos = req.params.id_fin_eventos
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.financeiro >= 1, `${noAccessMsg} "Exibição de financeiros"`)
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`

        const page = req.query.page || 1

        let sql = app.db(`${tabelaDomain}`).count('id', { as: 'count' })
            .where({ status: STATUS_ACTIVE, id_fin_eventos: id_fin_eventos })
        sql = await app.db.raw(sql.toString())
        const count = sql[0][0].count

        const ret = app.db(`${tabelaDomain}`)
            .where({ status: STATUS_ACTIVE, id_fin_eventos: id_fin_eventos })
            .limit(limit).offset(page * limit - limit)
        ret.then(body => {
            return res.json({ data: body, count, limit })
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getById = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && (uParams.financeiro >= 1 || uParams.financeiro >= 1), `${noAccessMsg} "Exibição de evento financeiro"`)
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`

        app.db(`${tabelaDomain}`)
            .where({ status: STATUS_ACTIVE, id: req.params.id })
            .first().then(body => {
                return res.json(body)
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
            // Alçada para exclusão
            isMatchOrError(uParams && uParams.financeiro >= 4, `${noAccessMsg} "Exclusão de evento financeiro"`)
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaFinEventosDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.fin_eventos`
        try {

            let sql = app.db(tabelaFinEventosDomain).count('id', { as: 'count' })
                .where({ id: req.params.id })
            sql = await app.db.raw(sql.toString())
            const count = sql[0][0].count
            if (count > 0) throw `Este evento não pode ser excluído! Há ${count} registros financeiros que o utilizam`

            const { createEventRemove } = app.api.sisEvents
            const evento = await createEventRemove({
                "last": await app.db(tabelaDomain)
                    .where({ id: req.params.id }).first(),
                "request": req,
                "evento": {
                    "classevento": "Remove",
                    "evento": `Exclusão de registro`,
                    "tabela_bd": tabela,
                }
            })
            const rowsUpdated = await app.db(tabelaDomain)
                .update({
                    status: STATUS_DELETE,
                    evento: evento
                })
                .where({ id: req.params.id })
            existsOrError(rowsUpdated, 'Registro não foi encontrado')

            res.status(204).send()
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
            res.status(500).send(error)
        }
    }

    return { get, getById, save, saveByBatch, remove }
}