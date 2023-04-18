const moment = require('moment')
const { dbPrefix } = require("../.env")


module.exports = app => {
    const { existsOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const tabela = 'cad_srecadastro'
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99

    const save = async(req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        const body = {...req.body }
        try {
            isMatchOrError(uParams && uParams.cad_servidores >= 3, `${noAccessMsg} "Recadastramento de servidor"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${user.cliente}_${user.dominio}.${tabela}`
        if (req.params.idCadS) body.id_cad_servidores = req.params.idCadS

        // Criação de um novo registro
        const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()

        body.evento = nextEventID.count + 1
            // Variáveis da criação de um novo registro
        body.status = STATUS_ACTIVE
        body.dominio = user.dominio
        body.created_at = new Date()
        body.id_user_recadastro = user.id

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
                        "evento": `Recadastramento de servidor`,
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

    const getCurrent = async(req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && (uParams.id == user.id || uParams.cad_servidores >= 3), `${noAccessMsg} "Exibição de recadastro"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const idCadS = req.params.idCadS || undefined
        const page = req.query.page || 1
        try {
            existsOrError(idCadS, 'Servidor não informado')
        } catch (error) {
            return res.status(400).send(error)
        }

        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`

        const ret = app.db({ cr: tabelaDomain })
            .where({ 'cr.status': STATUS_ACTIVE, 'cr.id_cad_servidores': idCadS }).first()
            .orderBy('created_at', 'desc')
            .then(body => {
                return res.json({ data: body, count: 1 })
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
            // Alçada para exibição
            isMatchOrError((uParams.cad_servidores && uParams.cad_servidores >= 4), `${noAccessMsg} "Exclusão de recadastramento de servidor"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        try {
            // registrar o evento na tabela de eventos
            const last = await app.db(tabelaDomain).where({ id: req.params.id }).first()
            const { createEventUpd } = app.api.sisEvents
            const evento = await createEventUpd({
                "notTo": ['created_at', 'evento', 'updated_at'],
                "last": last,
                "next": registro,
                "request": req,
                "evento": {
                    "classevento": "Remove",
                    "evento": `Exclusão de recadastramento de servidor`,
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
            res.status(400).send(error)
        }
    }

    return { save, remove, getCurrent }
}