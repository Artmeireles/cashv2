const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const { mailyCliSender } = app.api.mailerCli
    const tabela = 'cad_cargos'
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99
    const limit = 20 // usado para paginação

    const save = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        const body = { ...req.body }
        try {
            // Alçada para edição
            if (body.id)
                isMatchOrError(uParams && uParams.cad_servidores >= 3, `${noAccessMsg} "Edição de evento financeiro"`)
            // Alçada para inclusão
            else isMatchOrError(uParams && uParams.cad_servidores >= 2, `${noAccessMsg} "Inclusão de evento financeiro"`)
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${user.cliente}_${user.dominio}.${tabela}`
        if (req.params.id) body.id = req.params.id

        try {
            existsOrError(body.id_cargo, 'Id do cargo não informado')
            existsOrError(body.nome, 'Nome do cargo não informado')
            existsOrError(body.cbo, 'CBO do cargo não informado')
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
                    "evento": `Alteração de cargo`,
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
            existsOrError(rowsUpdated, 'Cargo não foi encontrado')
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
                            "evento": `Novo cargo`,
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

    const get = async (req, res) => {
        const uParams = await app.db('users').where({ id: req.user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.cad_servidores >= 1, `${noAccessMsg} "Exibição de cargos"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const body = { ...req.body }
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
            .orderBy('nome')
            .then(body => {
                return res.json({ data: body, count, limit })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getById = async (req, res) => {
        const uParams = await app.db('users').where({ id: req.user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.cad_servidores >= 1, `${noAccessMsg} "Exibição de cargo"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const ret = app.db(tabelaDomain)
            .where({ id: req.params.id })
            .first()
            .then(body => {
                return res.json(body)
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getListaCargos = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.cad_servidores >= 1, `${noAccessMsg} "Exibição de lista de cargos"`)
        } catch (error) {
            return res.status(401).send(error)
        }

        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        let sql = app.db(tabelaDomain)
            .select('id', 'id_cargo', 'nome', 'cbo').orderBy('id_cargo', 'nome')
            .then(body => {
                return res.json({ data: body })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const saveByBatch = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError((uParams && (uParams.cad_servidores >= 3)), `${noAccessMsg} "Edição de dados de servidor em lote"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const batch = { ...req.body.cargos }
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
            const origin = body.origin;

            const bodyValidation = []
            if (!body.id_cargo) bodyValidation.push('Id do cargo não informado')
            if (!body.nome) bodyValidation.push('Nome do cargo não informado')
            if (!body.cbo) bodyValidation.push('CBO do cargo não informado')
            if (bodyValidation.length > 0) batchResult.push({ id_cargo: body.id_cargo, result: JSON.stringify(bodyValidation) })

            if (bodyValidation.length > 0) {
                const mail = {
                    "from": "suporte@mgcash.app.br",
                    "to": "suporte@mgcash.app.br",
                    "subject": "Erro cadastros saveByBatch",
                    "message": `${JSON.stringify({ cliente: client, dominio: domain, id_cargo: body.id_cargo, result: JSON.stringify(bodyValidation) })}`
                }
                req.mail = mail
                req.batch = true
                mailyCliSender(req, res)
            }

            const bodyCargo = await app.db({ fe: tabelaDomain }).where({ id_cargo: body.id_cargo }).first()
            delete body.origin
            if (bodyCargo.id) {
                body.id = bodyCargo.id
                // Variáveis da edição de um registro
                // registrar o evento na tabela de eventos
                const { createEventUpd } = app.api.sisEvents
                const evento = await createEventUpd({
                    "notTo": ['created_at', 'evento', 'updated_at'],
                    "last": bodyCargo,
                    "next": body,
                    "request": req,
                    "evento": {
                        "evento": `Alteração de cargo`,
                        "tabela_bd": tabela,
                    }
                })

                body.evento = evento
                body.updated_at = new Date()
                await app.db(tabelaDomain)
                    .update(body)
                    .where({ id: body.id })
                    .then((ret) => {
                        batchResult.push({ id: body.id, nome: body.nome })
                        pkToUpdate += `'${body.id_cargo}',`;
                        batchDone++
                    })
                    .catch(error => {
                        app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                        batchResult.push({ id_cargo: body.id_cargo, result: 'Erro: ' + error })
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
                                "evento": `Novo cargo`,
                                "tabela_bd": tabela,
                            }
                        })
                        batchResult.push({ id: body.id, nome: body.nome })
                        pkToUpdate += `'${body.id_cargo}',`;
                        batchDone++
                    })
                    .catch(error => {
                        app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                        batchResult.push({ id_cargo: body.id_cargo, result: 'Erro: ' + error })
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

    const remove = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exclusão
            isMatchOrError(uParams && uParams.cad_servidores >= 4, `${noAccessMsg} "Exclusão de evento financeiro"`)
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaFinFuncionalDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.fin_sfuncional`
        try {
            let sql = app.db(tabelaFinFuncionalDomain).count('id', { as: 'count' })
                .where({ id_cad_cargos: req.params.id })
            sql = await app.db.raw(sql.toString())
            const count = sql[0][0].count
            if (count > 0) throw `Este cargo não pode ser excluído! Há ${count} registros funcionais que o utilizam`

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

    return { get, getById, getListaCargos, save, saveByBatch, remove }
}