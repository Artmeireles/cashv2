const moment = require('moment')
const randomstring = require("randomstring")
const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, notExistsOrError, equalsOrError, isValidEmail, isMatchOrError, noAccessMsg } = app.api.validation
    const { mailyCliSender } = app.api.mailerCli
    const tabela = 'tabelas'
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
                existsOrError(body.id_emp,'Empresa não informada')
                existsOrError(body.tipo_tabela,'Tipo da Tabela não informado')
                existsOrError(body.cod_tabela,'Código da Tabela não informado')
                existsOrError(body.dsc_tabela,'Descrição da Tabela não informado')
                existsOrError(body.inicial1,'Valor inicial da faixa não informado')
                existsOrError(body.final1,'Valor final da faixa não informado')
                existsOrError(body.aliquota1 ,'Aliquota da faixa não informado')
                if(body.tipo_tabela == '0'){
                existsOrError(body.deduzir1,'Valor a deduzir da faixa não informado')
                }
                existsOrError(body.inicial2,'Valor inicial da faixa não informado')
                existsOrError(body.final2,'Valor final da faixa não informado')
                existsOrError(body.aliquota2 ,'Aliquota da faixa não informado')
                if(body.tipo_tabela == '0'){
                existsOrError(body.deduzir2,'Valor a deduzir da faixa não informado')
                }
                existsOrError(body.inicial3,'Valor inicial da faixa não informado')
                existsOrError(body.final3,'Valor final da faixa não informado')
                existsOrError(body.aliquota3 ,'Aliquota da faixa não informado')
                if(body.tipo_tabela == '0'){
                existsOrError(body.deduzir3,'Valor a deduzir da faixa não informado')
                }
                existsOrError(body.inicial4,'Valor inicial da faixa não informado')
                existsOrError(body.final4,'Valor final da faixa não informado')
                existsOrError(body.aliquota4 ,'Aliquota da faixa não informado')
                if(body.tipo_tabela == '0'){
                existsOrError(body.deduzir4,'Valor a deduzir da faixa não informado')
                }
                if(body.tipo_tabela == '0'){
                existsOrError(body.inicial5,'Valor inicial da faixa não informado')
                }
                if(body.tipo_tabela == '0'){
                existsOrError(body.final5,'Valor final da faixa não informado')
                }
                if(body.tipo_tabela == '0'){
                existsOrError(body.aliquota5 ,'Aliquota da faixa não informado')
                }
                if(body.tipo_tabela == '0'){
                existsOrError(body.deduzir5,'Valor a deduzir da faixa não informado')
                }
                if(body.tipo_tabela == '0' || '2'){
                existsOrError(body.patronal,'Aliquota patronal não informado')
                }
                if(body.tipo_tabela == '2'){
                existsOrError(body.patronal_e1,'Aliquota patronal não informado')
                }
                //existsOrError(body.id_cc_e1,'Centro de custo E1 não informado')
                if(body.tipo_tabela == '2'){
                existsOrError(body.patronal_e2,'Aliquota patronal não informado')
                }
                //existsOrError(body.id_cc_e2,'Centro de custo E2 não informado')
                if(body.tipo_tabela == '1' || '0'){
                existsOrError(body.teto,'Teto do INSS não informado')
                existsOrError(body.rat,'Aliquota RAT não informado')
                existsOrError(body.fap,'Aliquota FAP não informado')
                }
                existsOrError(body.deducao_dependente,'Valor da dedução por dependente não informado')
                existsOrError(body.ini_valid ,'Início da Validade das Informações não informado')
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

    const limit = 20 // usado para paginação
    const get = async (req, res) => {
        let user = req.user
        const key = req.query.key ? req.query.key : ''
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.financeiro >= 1, `${noAccessMsg} "Exibição de financeiros"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`

        const page = req.query.page || 1

        let sql = app.db({ tbl1: tabelaDomain }).count('tbl1.id', { as: 'count' })
            .where({ status: STATUS_ACTIVE })
            .where(function () {
                this.where(app.db.raw(`tbl1.tipo_tabela regexp('${key.toString().replace(' ', '.+')}')`))
                this.orWhere(app.db.raw(`tbl1.dsc_tabela regexp('${key.toString().replace(' ', '.+')}')`))
            })
        sql = await app.db.raw(sql.toString())
        const count = sql[0][0].count

        const ret = app.db({ tbl1: tabelaDomain })
            .where({ status: STATUS_ACTIVE })
            .where(function () {
                this.where(app.db.raw(`tbl1.tipo_tabela regexp('${key.toString().replace(' ', '.+')}')`))
                this.orWhere(app.db.raw(`tbl1.dsc_tabela regexp('${key.toString().replace(' ', '.+')}')`))
            })
        ret.orderBy('tipo_tabela').limit(limit).offset(page * limit - limit)
        ret.then(body => {
            return res.json({ data: body, count, limit })
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