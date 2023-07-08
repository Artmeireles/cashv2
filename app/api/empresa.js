const moment = require('moment')
const randomstring = require("randomstring")
const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, notExistsOrError, isEmailOrError, isParamOrError,
        isMatchOrError, noAccessMsg, cpfOrError,
        isCityOrError, cnpjOrError } = app.api.validation
    const { convertESocialTextToJson } = app.api.facilities
    const tabela = 'empresa'
    const tabelaParams = 'params'
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99

    const save = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        let body = { ...req.body }

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
        
        const contentType = req.headers['content-type']
        if (contentType == "text/plain") {
            const bodyRaw = convertESocialTextToJson(req.body)
            body = {}
            body.nr_insc = bodyRaw.nrInsc_14
            body.cnpj_efr = bodyRaw.cnpjEFR_45 || bodyRaw.cnpjEFR_70
            body.id_param_cl_trib = ((id = await app.db(tabelaParams).select('id').where({ 'meta': 'natRubrica', 'value': bodyRaw.classTrib_16 }).first()) != null) ? id.id : null
            body.ind_opt_reg_eletron = bodyRaw.indOptRegEletron_21
            body.razao_social = bodyRaw.razao_social
            body.id_cidade = bodyRaw.id_cidade
            body.cep = bodyRaw.cep
            body.bairro = bodyRaw.bairro
            body.logradouro = bodyRaw.logradouro
            body.nr = bodyRaw.nr
            body.complemento = bodyRaw.complemento
            body.email = bodyRaw.email
            body.telefone = bodyRaw.telefone
            body.codigo_fpas = bodyRaw.fpas_21
            body.codigo_gps = bodyRaw.codigo_gps
            body.codigo_cnae = bodyRaw.cnaePrep_18
            body.codigo_recolhimento = bodyRaw.codigo_recolhimento
            body.mes_descsindical = bodyRaw.mes_descsindical
        }

        const tabelaDomain = `${dbPrefix}_app.${tabela}`
        try {
            existsOrError(body.nr_insc, 'CPF ou CNPJ não informado')
            if (body.nr_insc && body.nr_insc.length == 11) cpfOrError(body.nr_insc)
            else if (body.nr_insc && body.nr_insc.length == 14) cnpjOrError(body.nr_insc)
            else throw 'Documento (CNPJ ou CPF) inválido. Favor verificar'
            existsOrError(body.cnpj_efr, 'CNPJ do Ente Federativo não informado')
            cnpjOrError(body.cnpj_efr, 'CNPJ do Ente Federativo inválido')
            existsOrError(body.id_param_cl_trib, 'Classificação Tributária não informada')
            existsOrError(await isParamOrError('classTrib', body.id_param_cl_trib), 'Classificação Tributária selecionada não existe')
            existsOrError(body.ind_opt_reg_eletron, 'Opção pelo Registro Eletrônico de Empregados não informado')
            existsOrError(body.razao_social, 'Razão Social não informada')
            existsOrError(body.id_cidade, 'Cidade não informada')
            existsOrError(await isCityOrError(body.id_cidade), 'Cidade selecionada não existe')
            existsOrError(body.cep, 'CEP não informado')
            existsOrError(body.bairro, 'Bairro não informado')
            existsOrError(body.logradouro, 'Logradouro não informado')
            existsOrError(body.nr, 'Número não informado')
            // existsOrError(body.complemento, 'Complemento não informado')
            existsOrError(body.email, 'E-mail não informado')
            isEmailOrError(body.email, 'E-mail inválido')
            existsOrError(body.telefone, 'telefone não informado')
            body.telefone = body.telefone.replace(/([^\d])+/gim, "")
            if (body.telefone.length != 10) throw 'Número de telefone inválido. Não informe um celular'
            existsOrError(body.codigo_fpas, 'Código FPAS não informado')
            // existsOrError(body.codigo_gps, 'Código GPS não informado')
            existsOrError(body.codigo_cnae, 'Código CNAE não informado')
            // existsOrError(body.codigo_recolhimento, 'Código de Recolhimento não informado')
            // existsOrError(body.mes_descsindical, 'Mês Desconto Sindical não informado')
            if (body.nr_insc) {
                const dataFromDB = await app.db(tabelaDomain)
                    .where({ nr_insc: body.nr_insc })
                    .andWhere(app.db.raw(body.id ? (`id != '${body.id}'`) : '1=1'))
                    .first()
                notExistsOrError(dataFromDB, 'Combinação de CNPJ/ CPF já cadastrado')
            }
        }
        catch (error) {
            return res.status(400).send(error)
        }

        body.cep = body.cep.replace(/([^\d])+/gim, "")
        body.nr_insc = body.nr_insc.replace(/([^\d])+/gim, "")
        body.cnpj_efr = body.cnpj_efr.replace(/([^\d])+/gim, "")
        body.nr = body.nr.replace(/([^\d])+/gim, "")
        body.codigo_fpas = body.codigo_fpas.replace(/([^\d])+/gim, "")
        body.codigo_cnae = body.codigo_cnae.replace(/([^\d])+/gim, "")
        if (body.codigo_gps) body.codigo_gps = body.codigo_gps.replace(/([^\d])+/gim, "")
        if (body.codigo_recolhimento) body.codigo_recolhimento = body.codigo_recolhimento.replace(/([^\d])+/gim, "")
        if (body.mes_descsindical) body.mes_descsindical = body.mes_descsindical.replace(/([^\d])+/gim, "")

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
                else res.status(200).send('Orgão não foi encontrado')
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

    const saveRaw = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        const bodyRaw = convertESocialTextToJson(req.body)
        const body = {}
        body.nr_insc = bodyRaw.nrInsc_14
        body.cnpj_efr = bodyRaw.cnpjEFR_45
        const class_trib = await app.db(tabelaParams).select('id')
            .where({ 'meta': 'classTrib', 'value': bodyRaw.classTrib_16 }).first()
        try {
            if (!(!!class_trib)) throw "Classificação tributária não localizada"
        } catch (error) {
            return res.status(400).send(error)
        }
        body.id_param_cl_trib = class_trib.id
        body.ind_opt_reg_eletron = bodyRaw.indOptRegEletron_21
        body.razao_social = bodyRaw.razao_social
        body.id_cidade = bodyRaw.id_cidade
        body.cep = bodyRaw.cep
        body.bairro = bodyRaw.bairro
        body.logradouro = bodyRaw.logradouro
        body.nr = bodyRaw.nr
        body.complemento = bodyRaw.complemento
        body.email = bodyRaw.email
        body.telefone = bodyRaw.telefone
        body.codigo_fpas = bodyRaw.fpas_21
        body.codigo_gps = bodyRaw.codigo_gps
        body.codigo_cnae = bodyRaw.cnaePrep_18
        body.codigo_recolhimento = bodyRaw.codigo_recolhimento
        body.mes_descsindical = bodyRaw.mes_descsindical


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
        const tabelaDomain = `${dbPrefix}_app.${tabela}`


        try {
            existsOrError(body.nr_insc, 'CPF ou CNPJ não informado')
            if (body.nr_insc && body.nr_insc.length == 11) cpfOrError(body.nr_insc)
            else if (body.nr_insc && body.nr_insc.length == 14) cnpjOrError(body.nr_insc)
            else throw 'Documento (CNPJ ou CPF) inválido. Favor verificar'
            existsOrError(body.cnpj_efr, 'CNPJ do Ente Federativo não informado')
            cnpjOrError(body.cnpj_efr, 'CNPJ do Ente Federativo inválido')
            existsOrError(body.id_param_cl_trib, 'Classificação Tributária não informada')
            existsOrError(await isParamOrError('classTrib', body.id_param_cl_trib), 'Classificação Tributária selecionada não existe')
            existsOrError(body.ind_opt_reg_eletron, 'Opção pelo Registro Eletrônico de Empregados não informado')
            existsOrError(body.razao_social, 'Razão Social não informada')
            existsOrError(body.id_cidade, 'Cidade não informada')
            existsOrError(await isCityOrError(body.id_cidade), 'Cidade selecionada não existe')
            existsOrError(body.cep, 'CEP não informado')
            existsOrError(body.bairro, 'Bairro não informado')
            existsOrError(body.logradouro, 'Logradouro não informado')
            existsOrError(body.nr, 'Número não informado')
            // existsOrError(body.complemento, 'Complemento não informado')
            // existsOrError(body.email, 'E-mail não informado')
            // existsOrError(body.telefone, 'telefone não informado')
            // existsOrError(body.codigo_fpas, 'Código FPAS não informado')
            // existsOrError(body.codigo_gps, 'Código GPS não informado')
            // existsOrError(body.codigo_cnae, 'Código CNAE não informado')
            // existsOrError(body.codigo_recolhimento, 'Código de Recolhimento não informado')
            // existsOrError(body.mes_descsindical, 'Mês Desconto Sindical não informado')
            if (body.nr_insc) {
                const dataFromDB = await app.db(tabelaDomain)
                    .where({ nr_insc: body.nr_insc })
                    .andWhere(app.db.raw(body.id ? (`id != '${body.id}'`) : '1=1'))
                    .first()
                notExistsOrError(dataFromDB, 'Combinação de CNPJ/ CPF já cadastrado')
            }
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
                else res.status(200).send('Orgão não foi encontrado')
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

    const limit = 1 // usado para paginação
    const get = async (req, res) => {
        let user = req.user
        const key = req.query.key ? req.query.key : ''
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.financeiro >= 1, `${noAccessMsg} "Exibição de empresa"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_app.${tabela}`

        const page = req.query.page || 1

        let sql = app.db({ tbl1: tabelaDomain }).count('tbl1.id', { as: 'count' })
            .where({ status: STATUS_ACTIVE })
            .where(function () {
                this.where(app.db.raw(`tbl1.nr_insc regexp('${key.toString().replace(' ', '.+')}')`))
            })
        sql = await app.db.raw(sql.toString())
        const count = sql[0][0].count
        const ret = app.db({ tbl1: tabelaDomain })
            .where({ status: STATUS_ACTIVE })
            .where(function () {
                this.where(app.db.raw(`tbl1.nr_insc regexp('${key.toString().replace(' ', '.+')}')`))
            })
        ret.orderBy('nr_insc').limit(limit).offset(page * limit - limit)
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
            isMatchOrError(uParams && uParams.admin >= 1, `${noAccessMsg} "Exibição de cadastro de ${tabela}"`)
        } catch (error) {
            return res.status(401).send(error)
        }

        const tabelaDomain = `${dbPrefix}_app.${tabela}`
        const ret = app.db({ tbl1: tabelaDomain })
            .select(app.db.raw(`tbl1.*, SUBSTRING(SHA(CONCAT(id,'${tabela}')),8,6) as hash`))
            .where({ id: req.params.id, status: STATUS_ACTIVE }).first()
            .then(body => {
                return res.json(body)
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
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
        const tabelaDomain = `${dbPrefix}_app.${tabela}`
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