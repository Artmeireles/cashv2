const moment = require('moment')
const { dbPrefix } = require("../.env")


module.exports = app => {
    const { existsOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const { mailyCliSender } = app.api.mailerCli
    const tabela = 'siafic_apropriacao'
    const STATUS_ACTIVE = 10

    const saveByBatch = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError((uParams && (uParams.financeiro >= 3)), `${noAccessMsg} "Geração de dados do SIAFIC: Apropriação"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const body = { ...req.body }
        try {
            existsOrError(body.client, 'Cliente não informado')
            existsOrError(body.domain, 'Domínio não informado')
            // existsOrError(body.nomeUnidadeGestora, 'Nome da unidade gestora não informada')
            existsOrError(body.mes, 'Mes não informado')
            existsOrError(body.ano, 'Ano não informado')
            existsOrError(body.dados, 'Dados da apropriação não informados')
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            return res.status(400).send(error)
        }

        const batch = { ...req.body.dados }
        const client = req.body.client
        const domain = req.body.domain
        delete req.body.client
        delete req.body.domain
        let batchSize = 0
        let batchDone = 0
        let batchResult = []
        const tabelaDomain = `${dbPrefix}_${client}_${domain}.${tabela}`
        for (let obj in batch) {
            ++batchSize
            let bodyDados = batch[obj];

            let bodyValidation = {}

            if (!bodyDados.id_unidade_gestora) bodyValidation = { ...bodyValidation, 'Unidade': 'Unidade gestora não informada' }
            if (!bodyDados.apropriacao_ferias) bodyValidation = { ...bodyValidation, 'Férias': 'Valor da apropriação de férias não informado' }
            if (!bodyDados.apropriacao_decimo) bodyValidation = { ...bodyValidation, 'Décimo': 'Valor da apropriação do décimo não informado' }
            if (bodyValidation.length > 0) batchResult.push({
                // unidade_gestora: body.nomeUnidadeGestora,
                mes: body.mes,
                ano: body.ano,
                result: JSON.stringify(bodyValidation)
            })

            if (bodyValidation.length > 0) {
                const mail = {
                    "from": "suporte@mgcash.app.br",
                    "to": "suporte@mgcash.app.br",
                    "subject": `Erro ${tabela} saveByBatch`,
                    "message": `${JSON.stringify({
                        cliente: client, dominio: domain, 
                        // unidade_gestora: body.nomeUnidadeGestora,
                        mes: body.mes,
                        ano: body.ano, result: JSON.stringify(bodyValidation)
                    })}`
                }
                req.mail = mail
                req.batch = true
                mailyCliSender(req, res)
            } else {
                // Criação de um novo registro
                const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()

                bodyDados.evento = nextEventID.count + 1
                // Variáveis da criação de um novo registro
                bodyDados.status = STATUS_ACTIVE
                bodyDados.created_at = new Date()
                bodyDados.ano = body.ano
                bodyDados.mes = body.mes

                await app.db(tabelaDomain)
                    .insert(bodyDados)
                    .then(ret => {
                        body.id = ret[0]
                        // registrar o evento na tabela de eventos
                        const { createEventIns } = app.api.sisEvents
                        createEventIns({
                            "notTo": ['created_at', 'evento', 'updated_at'],
                            "next": body,
                            "request": req,
                            "evento": {
                                "evento": `Novo registro`,
                                "tabela_bd": tabela,
                            }
                        })
                        delete bodyDados.evento
                        delete bodyDados.status
                        delete bodyDados.created_at
                        delete bodyDados.ano
                        delete bodyDados.mes
                        batchResult.push(bodyDados)
                        batchDone++
                    })
                    .catch(error => {
                        batchResult.push({
                            // unidade_gestora: body.nomeUnidadeGestora,
                            mes: body.mes,
                            ano: body.ano, result: 'Erro: ' + error
                        })
                        app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    })
            }
        }

        const { sends } = app.api.siaficTransmissoes

        req.body.client = client
        req.body.domain = domain
        req.body.tipo = '1'
        req.body.internCall = true
        const transmissao = await sends(req, res);

        const result = {
            'done': batchDone,
            'status': transmissao.status,
            'json_retorno': {
                // unidade_gestora: body.nomeUnidadeGestora,
                mes: body.mes,
                ano: body.ano,
                // json_retorno: batchResult
                json_retorno: transmissao.json_retorno
            }
        }
        return res.status(200).send(result)
        // return res.status(200).send(sends(req, res))
    }

    return { saveByBatch }
}