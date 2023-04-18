const moment = require('moment')
const randomstring = require("randomstring")
const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, notExistsOrError, equalsOrError, emailOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const { mailyCliSender } = app.api.mailerCli
    const tabela = 'fin_rubricas'
    const tabelaEventos = 'fin_eventos'
    const tabelaEventosBase = 'fin_eventosbase'
    const tabelaFuncional = 'fin_sfuncional'
    const tabelaCadServidores = 'cad_servidores'
    const tabelaConContratos = 'con_contratos'
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99

    const save = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para edição
            if (body.id)
                isMatchOrError(uParams && uParams.cad_servidores >= 3, `${noAccessMsg} "Edição de registro financeiro"`)
            // Alçada para inclusão
            else isMatchOrError(uParams && uParams.cad_servidores >= 2, `${noAccessMsg} "Inclusão de registro financeiro"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const body = { ...req.body }
        const tabelaDomain = `${dbPrefix}_${user.cliente}_${user.dominio}.${tabela}`
        if (req.params.id) body.id = req.params.id

        try {
            existsOrError(body.id_cad_servidores, 'Servidor não informado')
            existsOrError(body.ano, 'Ano da folha não informado')
            existsOrError(body.mes, 'Mês da folha não informado')
            existsOrError(body.complementar, 'Complementar da folha não informado')
            existsOrError(body.id_fin_eventos, 'Rúbrica financeira não informada')
        } catch (error) {
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
                    "evento": `Alteração de cadastro funcional`,
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
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
            existsOrError(rowsUpdated, 'Funcional não foi encontrado')
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
                            "evento": `Novo registro financeiro`,
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
            isMatchOrError(uParams && uParams.cad_servidores >= 3, `${noAccessMsg} "Edição de registros financeiros em bloco"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const batch = { ...req.body.financeiro }
        const client = req.body.client
        const domain = req.body.domain
        const bodyMatriculas = { ...req.body.matriculas }
        let batchSize = 0
        let batchDone = 0
        let batchResult = []
        const tabelaDomain = `${dbPrefix}_${client}_${domain}.${tabela}`
        const tabelaCadastrosDomain = `${dbPrefix}_${client}_${domain}.${tabelaCadServidores}`
        const tabelaFinEventosDomain = `${dbPrefix}_${client}_${domain}.fin_eventos`

        await app.db(tabelaDomain)
            .where({
                ano: bodyMatriculas.ano,
                mes: bodyMatriculas.mes,
                complementar: bodyMatriculas.complementar
            })
            .whereIn('id_cad_servidores', function () {
                this.select('cs.id')
                    .from({ cs: tabelaCadastrosDomain })
                    .whereBetween('matricula', [bodyMatriculas.matriculaI, bodyMatriculas.matriculaF])
            })
            .del()
            .then(() => {
                // registrar o evento na tabela de eventos
                const { createEvent } = app.api.sisEvents
                createEvent({
                    "request": req,
                    "evento": {
                        "ip": req.ip,
                        "id_user": user.id,
                        "evento": `Registros financeiros das matrículas ${bodyMatriculas.matriculaI} até ${bodyMatriculas.matriculaF} excluídas da folha ${bodyMatriculas.ano}, ${bodyMatriculas.mes} e ${bodyMatriculas.complementar} para atualização financeira pelo MGPonte`,
                        "classevento": `Atualização financeira`,
                        "id_registro": null
                    }
                })
            })

        for (let obj in batch) {
            ++batchSize
            const body = batch[obj];

            const bodyIdCadServidor = await app.db({ cs: tabelaCadastrosDomain })
                .where({ matricula: body.matricula })
                .first()
            body.id_cad_servidores = bodyIdCadServidor.id || undefined

            const bodyIdFinEvento = await app.db({ fe: tabelaFinEventosDomain })
                .where({ id_evento: body.id_fin_eventos })
                .first()
            body.id_fin_eventos = (bodyIdFinEvento && bodyIdFinEvento.id ? bodyIdFinEvento.id : null) || undefined

            const bodyValidation = []
            if (!body.id_cad_servidores) bodyValidation.push('Servidor não informado')
            if (!body.ano) bodyValidation.push('Ano da folha não informado')
            if (!body.mes) bodyValidation.push('Mês da folha não informado')
            if (!body.complementar) bodyValidation.push('Complementar da folha não informado')
            if (!body.id_fin_eventos) bodyValidation.push('Rúbrica financeira não informada')
            if (bodyValidation.length > 0) batchResult.push({ matricula: body.matricula, result: JSON.stringify(bodyValidation) })

            if (bodyValidation.length > 0) {
                const mail = {
                    "from": "suporte@mgcash.app.br",
                    "to": "suporte@mgcash.app.br",
                    "subject": "Erro finRubricas saveByBatch",
                    "message": `${JSON.stringify({ cliente: client, dominio: domain, matricula: body.matricula, result: JSON.stringify(bodyValidation) })}`
                }
                req.mail = mail
                req.batch = true
                mailyCliSender(req, res)
            }

            delete body.origin
            const matricula = body.matricula
            delete body.matricula


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
                            "evento": `Novo registro financeiro`,
                            "tabela_bd": tabela,
                        }
                    })
                    batchResult.push({ id: body.id, nome: body.nome })
                    batchDone++
                })
                .catch(error => {
                    batchResult.push({ matricula: matricula, result: 'Erro: ' + error })
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                })
        }
        const result = {
            'done': batchDone,
            'batchResult': batchResult,
            'sqlUpdate': ''
        }
        return res.status(200).send(result)
    }

    const limit = 20 // usado para paginação
    const getCurrent = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.cad_servidores >= 1, `${noAccessMsg} "Exibição de dados funcionais de servidor"`)
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
        const tabelaDomainCadServidores = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabelaCadServidores}`
        const tabelaDomainEventos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabelaEventos}`
        const tabelaDomainEventosBase = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabelaEventosBase}`
        const tabelaDomainConContratos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabelaConContratos}`

        const ret = app.db({ fr: tabelaDomain })
            .select({
                id: `fr.id`,
                ano: `fr.ano`,
                mes: `fr.mes`,
                parcela: `fr.complementar`,
                id_con_contratos: `fr.id_con_contratos`,
                contrato: `cc.contrato`,
                bRpps: app.db.raw(getSqlEventosBase('994,997', uParams.cliente, uParams.dominio)),
                bInss: app.db.raw(getSqlEventosBase('995,998', uParams.cliente, uParams.dominio)),
                bIrrf: app.db.raw(getSqlEventosBase('999', uParams.cliente, uParams.dominio)),
                evento_nome: `fe.evento_nome`,
                id_evento: `fe.id_evento`,
                prazo: `fr.prazo`,
                prazot: `fr.prazot`,
                valor: `fr.valor`,
                automatico: `fe.automatico`,
                consignavel: `fe.consignavel`,
                fixo: `fe.fixo`,
                tipo: `fe.tipo`,
            })
            .where({ 'fr.status': STATUS_ACTIVE, 'fr.id_cad_servidores': idCadS })
            .where({ 'fr.ano': uParams.f_ano, 'fr.mes': uParams.f_mes, 'fr.complementar': uParams.f_complementar })
            .join({ fe: tabelaDomainEventos }, `fe.id`, `=`, `fr.id_fin_eventos`)
            .join({ cs: tabelaDomainCadServidores }, `cs.id`, `=`, `fr.id_cad_servidores`)
            .leftJoin({ cc: tabelaDomainConContratos }, `cc.id`, `=`, `fr.id_con_contratos`)
            .andWhere(app.db.raw(idCadS ? `fr.id_cad_servidores = ${idCadS}` : '1=1'))
            .andWhere(app.db.raw(`fr.status = ${STATUS_ACTIVE}`))
            .andWhere(app.db.raw(`fr.valor > 0.00`))
            .orderBy(app.db.raw(`fe.id_evento`))
            .limit(limit).offset(page * limit - limit)
        ret.then(body => {
            return res.json({ data: body, count: body.length })
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getSqlEventosBase = (eventos, cliente, dominio) => {
        const tabelaDomainEventos = `${dbPrefix}_${cliente}_${dominio}.${tabelaEventos}`
        const tabelaDomainEventosBase = `${dbPrefix}_${cliente}_${dominio}.${tabelaEventosBase}`
        let sqlTerm = `(SELECT COUNT(feb.id) FROM ${tabelaDomainEventosBase} feb `
        sqlTerm += `JOIN ${tabelaDomainEventos} as fe2 ON fe2.id = feb.id_fin_eventos `
        sqlTerm += `WHERE fe2.id_evento IN (${eventos}) AND id_fin_eventosbase = fe.id)`
        return sqlTerm
    }

    return { save, saveByBatch, getCurrent }
}