const moment = require('moment')
const randomstring = require("randomstring")
const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, notExistsOrError, equalsOrError, emailOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const { mailyCliSender } = app.api.mailerCli
    const tabela = 'cad_smovimentacao'
    const tabelaCadServidores = 'cad_servidores'
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99

    const save = async(req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para edição
            if (body.id)
                isMatchOrError(uParams && uParams.cad_servidores >= 3, `${noAccessMsg} "Edição de movimentação"`)
                // Alçada para inclusão
            else isMatchOrError(uParams && uParams.cad_servidores >= 2, `${noAccessMsg} "Inclusão de movimentação"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const body = {...req.body }
        const tabelaDomain = `${dbPrefix}_${user.cliente}_${user.dominio}.${tabela}`
        if (req.params.id) body.id = req.params.id

        try {
            existsOrError(body.id_cad_servidores, 'Servidor não informado')
            existsOrError(body.codigo_afastamento, 'Código do afastamento não informado')
            existsOrError(body.d_afastamento, 'Data do afastamento não informada')
            if (body.codigo_retorno)
                existsOrError(body.d_retorno, 'Data do retorno não informada')
        } catch (error) {
            return res.status(400).send(error)
        }

        delete body.label_afastamento
        delete body.label_retorno

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
                    "evento": `Alteração de movimentação funcional`,
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
            existsOrError(rowsUpdated, 'Movimentação funcional não foi encontrada')
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
                            "evento": `Nova movimentação funcional`,
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
            isMatchOrError(uParams && uParams.cad_servidores >= 3, `${noAccessMsg} "Edição de cadastro em bloco"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const batch = {...req.body.movimentacao }
        const client = req.body.client
        const domain = req.body.domain
        let batchSize = 0
        let batchDone = 0
        let batchResult = []
        let pkToUpdate = ''
        const tabelaDomain = `${dbPrefix}_${client}_${domain}.${tabela}`
        const tabelaCadastrosDomain = `${dbPrefix}_${client}_${domain}.cad_servidores`

        for (let obj in batch) {
            ++batchSize
            const body = batch[obj];

            delete body.id

            const bodyId = await app.db({ cm: tabelaDomain })
                .select({ id: 'cm.id' })
                .leftJoin({ cs: tabelaCadastrosDomain }, 'cs.id', '=', 'cm.id_cad_servidores')
                .where({
                    codigo_afastamento: body.codigo_afastamento,
                    d_afastamento: body.d_afastamento,
                    'cs.matricula': body.matricula
                })
                .first()
            body.id = bodyId && bodyId.id ? bodyId.id : null

            const bodyIdCadServidor = await app.db({ cs: tabelaCadastrosDomain })
                .where({ matricula: body.matricula })
                .first()
            body.id_cad_servidores = bodyIdCadServidor.id || undefined

            const bodyValidation = []

            if (!body.id_cad_servidores) bodyValidation.push('Servidor não informado')
            if (!body.codigo_afastamento) bodyValidation.push('Código do afastamento não informado')
            if (!body.d_afastamento) bodyValidation.push('Data do afastamento não informada')
            if (body.codigo_retorno)
                if (!body.d_retorno) bodyValidation.push('Data do retorno não informada')
            if (bodyValidation.length > 0) batchResult.push({ matricula: body.matricula, result: JSON.stringify(bodyValidation) })

            if (bodyValidation.length > 0) {
                const mail = {
                    "from": "suporte@mgcash.app.br",
                    "to": "suporte@mgcash.app.br",
                    "subject": "Erro cadMovimentacao saveByBatch",
                    "message": `${JSON.stringify({ cliente: client, dominio: domain, matricula: body.matricula, result: JSON.stringify(bodyValidation) })}`
                }
                req.mail = mail
                req.batch = true
                mailyCliSender(req, res)
            }

            delete body.origin
            const matricula = body.matricula
            delete body.matricula
            delete body.label_afastamento
            delete body.label_retorno

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
                        "evento": `Alteração de movimentação funcional`,
                        "tabela_bd": tabela,
                    }
                })

                body.evento = evento
                body.updated_at = new Date()
                await app.db(tabelaDomain)
                    .update(body)
                    .where({ id: body.id })
                    .then((ret) => {
                        batchResult.push({ matricula: matricula })
                        pkToUpdate += `'${matricula}',`;
                    })
                    .catch(error => {
                        batchResult.push({ matricula: matricula, result: 'Erro: ' + error })
                        app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
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
                                "evento": `Nova movimentação funcional`,
                                "tabela_bd": tabela,
                            }
                        })
                        batchResult.push({ matricula: matricula })
                        pkToUpdate += `'${matricula}',`;
                        batchDone++
                    })
                    .catch(error => {
                        batchResult.push({ matricula: matricula, result: 'Erro: ' + error })
                        app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
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
    const getCurrent = async(req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.cad_servidores >= 3, `${noAccessMsg} "Exibição de movimentação na folha atual"`)
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

        const ret = app.db({ cm: tabelaDomain })
            .where({ 'cm.status': STATUS_ACTIVE, 'cm.id_cad_servidores': idCadS })
            .limit(limit).offset(page * limit - limit)
            .then(body => {
                body.forEach(element => {
                    for (let obj in codAfastamento) {
                        const afastamento = codAfastamento[obj];
                        if (element.codigo_afastamento == obj)
                            element.label_afastamento = afastamento
                    }
                    for (let obj in codRetorno) {
                        const retorno = codRetorno[obj];
                        if (element.codigo_retorno == obj)
                            element.label_retorno = retorno
                    }
                })
                return res.json({ data: body, count: body.length })
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
            isMatchOrError(uParams && uParams.cad_servidores >= 1, `${noAccessMsg} "Exibição de movimentação"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`

        app.db(`${tabelaDomain}`)
            .where({ id: req.params.id }).first().then(body => {
                for (let obj in codAfastamento) {
                    const afastamento = codAfastamento[obj];
                    if (body.codigo_afastamento == obj)
                        body.label_afastamento = afastamento
                }
                for (let obj in codRetorno) {
                    const retorno = codRetorno[obj];
                    if (body.codigo_retorno == obj)
                        body.label_retorno = retorno
                }
                return res.json(body)
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
            isMatchOrError(uParams && uParams.cad_servidores >= 2, `${noAccessMsg} "Exclusão de movimentação"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        try {
            // registrar o evento na tabela de eventos
            const last = await app.db(tabelaDomain).where({ id: req.params.id }).first()
            const { createEventUpd } = app.api.sisEvents
            const evento = await createEventUpd({
                "notTo": ['created_at'],
                "last": last,
                "next": registro,
                "request": req,
                "evento": {
                    "classevento": "Remove",
                    "evento": `Exclusão de movimentação funcional`,
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

    const codAfastamento = {
        'Q1': 'Q1 - AFASTAMENTO TEMPORÁRIO POR MOTIVO DE LICENÇA-MATERNIDADE (120 DIAS)',
        'X': 'X - LICENÇA SEM VENCIMENTOS',
        'P1': 'P1 - AFASTAMENTO TEMPORÁRIO POR MOTIVO DE DOENÇA, POR PERÍODO SUPERIOR A 15 DIAS',
        'H': 'H - RESCISÃO, COM JUSTA CAUSA, POR INICIATIVA DO EMPREGADOR',
        'I1': 'I1 - RESCISÃO SEM JUSTA CAUSA, POR INICIATIVA DO EMPREGADOR, INCLUSIVE RESCISÃO ANTECIPADA DO CONTRATO A TERMO',
        'I2': 'I2 - RESCISÃO POR CULPA RECÍPROCA OU FORÇA MAIOR',
        'I3': 'I3 - RESCISÃO POR TÉRMINO DO CONTRATO A TERMO',
        'I4': 'I4 - RESCISÃO SEM JUSTA CAUSA DO CONTRATO DE TRABALHO DO EMPREGADO DOMÉSTICO, POR INICIATIVA DO EMPREGADOR',
        'J': 'J - RESCISÃO DO CONTRATO DE TRABALHO POR INICIATIVA DO EMPREGADO',
        'K': 'K - RESCISÃO A PEDIDO DO EMPREGADO OU POR INICIATIVA DO EMPREGADOR, COM JUSTA CAUSA, NO CASO DE EMPREGADO NÃO OPTANTE, COM MENOS DE UM ANO DE SERVIÇO',
        'L': 'L - OUTROS MOTIVOS DE RESCISÃO DO CONTRATO DE TRABALHO',
        'S2': 'S2 - FALECIMENTO',
        'S3': 'S3 - FALECIMENTO MOTIVADO POR ACIDENTE DE TRABALHO',
        'U1': 'U1 - APOSENTADORIA',
        'U3': 'U3 - APOSENTADORIA POR INVALIDEZ',
    }

    const codRetorno = {
        'Z1': 'Z1 - RETORNO DE AFASTAMENTO TEMPORÁRIO POR MOTIVO DE LICENÇA-MATERNIDADE',
        'Z5': 'Z5 - OUTROS RETORNOS DE AFASTAMENTO TEMPORÁRIO E/OU LICENÇA',
    }

    return { save, saveByBatch, getCurrent, getById, remove }
}