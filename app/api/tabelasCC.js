const moment = require('moment')
const randomstring = require("randomstring")
const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, notExistsOrError, equalsOrError, isValidEmail, isMatchOrError, noAccessMsg } = app.api.validation
    const { mailyCliSender } = app.api.mailerCli
    const tabela = 'tabelas_cc'
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99

    const save = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
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
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`

        try {
            existsOrError(body.id_emp_ua, 'Unidade Autônoma não informada')
            existsOrError(body.cod_tabela, 'Código da Tabela não informado')
            existsOrError(body.dsc_tabela, 'Descrição da Tabela não informada')
        }
        catch (error) {
            return res.status(400).send(error)
        }
        delete body.hash
        
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
                else res.status(200).send('O Parâmetro não foi encontrado')
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

    const get = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.financeiro >= 1, `${noAccessMsg} "Exibição de financeiros"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaUADomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.emp_ua`

        const ret = app.db({ tbl1: tabelaDomain })
            .join({ ua:tabelaUADomain }, 'ua.id', '=', 'tbl1.id_emp_ua')
            .where({ 'tbl1.status': STATUS_ACTIVE, 'ua.id_emp': uParams.id_emp })
            .orderBy('cod_tabela')
            .then(body => {return res.json({ data: body })
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                    return res.status(500).send(error)
            })
    }

    const getById = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.admin >= 1, `${noAccessMsg} "Exibição de cadastro de ${tabela}"`)
        } catch (error) {
            return res.status(401).send(error)
        }

        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const ret = app.db({ tbl1: tabelaDomain })
            .select(app.db.raw(`tbl1.*, SUBSTRING(SHA(CONCAT(id,'${tabela}')),8,6) as hash`))
            .where({ id: req.params.id, status: STATUS_ACTIVE }).first()
            .then(body => {
                return res.json(body)
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                    return res.status(500).send(error)
            })
    }

    const remove = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        try {
            // Alçada para exibição
            isMatchOrError((uParams && uParams.admin >= 1), `${noAccessMsg} "Exclusão de cadastro de ${tabela}"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
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
    return { save, get, getById, remove }
}