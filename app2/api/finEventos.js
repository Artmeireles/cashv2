const moment = require('moment')
const randomstring = require("randomstring")
const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, notExistsOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const { mailyCliSender } = app.api.mailerCli
    const tabela = 'fin_eventos'
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99

    const save = async(req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para edição
            if (body.id)
                isMatchOrError(uParams && uParams.financeiro >= 3, `${noAccessMsg} "Edição de evento financeiro"`)
                // Alçada para inclusão
            else isMatchOrError(uParams && uParams.financeiro >= 2, `${noAccessMsg} "Inclusão de evento financeiro"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const body = {...req.body }
        const tabelaDomain = `${dbPrefix}_${user.cliente}_${user.dominio}.${tabela}`
        if (req.params.id) body.id = req.params.id

        try {
            existsOrError(body.id_evento, 'Rúbrica do evento não informado')
            existsOrError(body.evento_nome, 'Nome não informado')
            existsOrError(body.tipo, 'Tipo crédito ou débito não informado')
            existsOrError(body.consignado, 'Se consignado não informado')
            existsOrError(body.consignavel, 'Se consignável não informado')
            existsOrError(body.deduzconsig, 'Se deduz das consignações não informado')
            existsOrError(body.automatico, 'Se automatico não informado')
            existsOrError(body.i_prioridade, 'Prioridade não informada')
            existsOrError(body.fixo, 'Se fixo não informado')
            existsOrError(body.sefip, 'Se SEFIP não informado')
            existsOrError(body.rais, 'Se RAIS não informado')
        } catch (error) {
            return res.status(400).send(error)
        }

        body.ev_root = evRoot.includes(body.id_evento) ? 1 : 0

        if (body.id) {
            // Variáveis da edição de um registro
            // registrar o evento na tabela de eventos
            const { createEventUpd } = app.api.sisEvents
            const evento = await createEventUpd({
                "notTo": ['created_at', 'evento', ],
                "last": await app.db(tabelaDomain).where({ id: body.id }).first(),
                "next": body,
                "request": req,
                "evento": {
                    "evento": `Alteração de evento financeiro`,
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

    const saveByBatch = async(req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para edição
            isMatchOrError(uParams && uParams.financeiro>= 3, `${noAccessMsg} "Edição de eventos em bloco"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const batch = {...req.body.eventosFinanceiros }
        const client = req.body.client
        const domain = req.body.domain
        let batchSize = 0
        let batchDone = 0
        let batchResult = []
        let pkToUpdate = ''
        const tabelaDomain = `${dbPrefix}_${client}_${domain}.${tabela}`

        for (let obj in batch) {
            ++batchSize
            const body = batch[obj];

            const bodyIdFinEvento = await app.db({ fe: tabelaDomain })
                .where({ id_evento: body.id_evento })
                .first()
            body.id = (bodyIdFinEvento && bodyIdFinEvento.id ? bodyIdFinEvento.id : null) || undefined

            const bodyValidation = []
            if (!body.id_evento) bodyValidation.push('Rúbrica do evento não informado')
            if (!body.evento_nome) bodyValidation.push('Nome não informado')
            if (!body.tipo) bodyValidation.push('Tipo crédito ou débito não informado')
            if (!body.consignado) bodyValidation.push('Se consignado não informado')
            if (!body.consignavel) bodyValidation.push('Se consignável não informado')
            if (!body.deduzconsig) bodyValidation.push('Se deduz das consignações não informado')
            if (!body.automatico) bodyValidation.push('Se automatico não informado')
            if (!body.i_prioridade) bodyValidation.push('Prioridade não informada')
            if (!body.fixo) bodyValidation.push('Se fixo não informado')
            if (!body.sefip) bodyValidation.push('Se SEFIP não informado')
            if (!body.rais) bodyValidation.push('Se RAIS não informado')
            if (bodyValidation.length > 0) batchResult.push({ evento: body.id_evento, result: JSON.stringify(bodyValidation) })

            if (bodyValidation.length > 0) {
                const mail = {
                    "from": "suporte@mgcash.app.br",
                    "to": "suporte@mgcash.app.br",
                    "subject": "Erro finEventos saveByBatch",
                    "message": `${JSON.stringify({ cliente: client, dominio: domain, evento: body.id_evento, result: JSON.stringify(bodyValidation) })}`
                }
                req.mail = mail
                req.batch = true
                mailyCliSender(req, res)
            }

            delete body.origin

            if (body.id) {
                // Variáveis da edição de um registro
                // registrar o evento na tabela de eventos
                const { createEventUpd } = app.api.sisEvents
                const evento = await createEventUpd({
                    "notTo": ['created_at', 'evento', ],
                    "last": await app.db(tabelaDomain).where({ id: body.id }).first(),
                    "next": body,
                    "request": req,
                    "evento": {
                        "evento": `Alteração de evento financeiro`,
                        "tabela_bd": tabela,
                    }
                })

                body.evento = evento
                body.updated_at = new Date()
                await app.db(tabelaDomain)
                    .update(body)
                    .where({ id: body.id })
                    .then((ret) => {
                        batchResult.push({ evento: body.id_evento })
                        pkToUpdate += `'${body.id_evento}',`;
                    })
                    .catch(error => {
                        app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                        batchResult.push({ evento: body.id_evento, result: 'Erro: ' + error })
                    })
            } else {
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
                                "evento": `Novo evento financeiro`,
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
            }
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
    const get = async(req, res) => {
        let user = req.user
        const key = req.query.key ? req.query.key : undefined
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.financeiro >= 1, `${noAccessMsg} "Exibição de financeiros"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`

        const page = req.query.page || 1

        let sql = app.db(`${tabelaDomain}`).count('id', { as: 'count' })
            .where({ status: STATUS_ACTIVE })
        if (key)
            sql.where('evento_nome', 'like', `%${key.toLowerCase()}%`)
            .orWhere('id_evento', 'like', `%${key.toLowerCase()}%`)
        sql = await app.db.raw(sql.toString())
        const count = sql[0][0].count

        const ret = app.db(`${tabelaDomain}`)
        if (key)
            ret.where('evento_nome', 'like', `%${key.toLowerCase()}%`)
            .orWhere('id_evento', 'like', `%${key.toLowerCase()}%`)
        ret.limit(limit).offset(page * limit - limit)
        ret.then(body => {
                return res.json({ data: body, count, limit })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getById = async(req, res) => {
        let user = req.user
        const key = req.query.key ? req.query.key : undefined
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && (uParams.financeiro>= 1 || uParams.financeiro >= 1), `${noAccessMsg} "Exibição de evento financeiro"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`

        app.db(`${tabelaDomain}`)
            .where({ id: req.params.id }).first().then(body => {
                return res.json(body)
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getEventosConsignados = async(req, res) => {
        const id_con_eventos = req.query.id_con_eventos // apenas livres
        const id_consignatario = req.params.id_consignatario
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaConEventos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_eventos`
        const tabelaConContratos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_contratos`
        const ret = app.db({ tfe: `${tabelaDomain}` })
            .select(`tcc.id_con_eventos`, `tce.id`, `tfe.id_evento`, `tfe.evento_nome`)
            .join({ tce: `${tabelaConEventos}` }, `tce.id_fin_eventos`, `=`, `tfe.id`)
            .leftJoin({ tcc: `${tabelaConContratos}` }, `tcc.id_con_eventos`, `=`, `tce.id`)
            .where(app.db.raw(`tce.id_consignatario = ${id_consignatario}`))
            .where(app.db.raw(id_con_eventos ? `(tcc.id_con_eventos IS NULL OR tcc.status != 10 OR tcc.id_con_eventos = ${id_con_eventos})` : `(tcc.id_con_eventos IS NULL OR tcc.status = 10)`))
            .groupBy('tce.id')
            .orderBy(app.db.raw(`CAST(tfe.id_evento AS UNSIGNED)`))
            .then(body => {
                return res.json({ data: body })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const remove = async(req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exclusão
            isMatchOrError(uParams && uParams.financeiro >= 4, `${noAccessMsg} "Exclusão de evento financeiro"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaFinanceiroDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.fin_rubricas`
        try {

            let sql = app.db(tabelaFinanceiroDomain).count('id', { as: 'count' })
                .where({ id_fin_eventos: req.params.id })
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
            res.status(500).send(error)
        }
    }

    const evRoot = [
        "001", // Vencimento
        "002", // Proventos
        "191", // 
        "192", // 
        "193", // 
        "194", // 
        "550", // 
        "551", // 
        "601", // 
        "602", // 
        "887", // 
        "888", // 
        "897", // 
        "898", // 
        "994", // 
        "995", // 
        "996", // 
        "997", // 
        "998", // 
        "999" // IR
    ]


    return {get, getById, getEventosConsignados, save, saveByBatch, remove }
}