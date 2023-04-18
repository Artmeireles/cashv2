const moment = require('moment')
const { dbPrefix } = require("../.env")
const axios = require('axios')


module.exports = app => {
    const { existsOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const { mailyCliSender } = app.api.mailerCli
    const tabela = 'siafic_transmissoes'
    const STATUS_ACTIVE = 10

    const sends = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError((uParams && (uParams.financeiro >= 3)), `${noAccessMsg} "Transmissão de dados do SIAFIC"`)
        } catch (error) {
            console.log(error);
            return res.status(401).send(error)
        }
        const body = { ...req.body }
        const internCall = body.internCall || undefined

        try {
            existsOrError(body.client, 'Cliente não informado')
            existsOrError(body.domain, 'Domínio não informado')
            // existsOrError(body.nomeUnidadeGestora, 'Nome da unidade gestora não informada')
            existsOrError(body.mes, 'Mes não informado')
            existsOrError(body.ano, 'Ano não informado')
            existsOrError(body.tipo, 'Tipo não informado: 1-Apropriação, 2-Desapropriação ou 3-Empenho')
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            return res.status(400).send(error)
        }

        const tipoTransmissao = body.tipo

        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaLocalParamsDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.local_params`
        const tabelaOrgaoUaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.orgao_ua`
        let tabelaSiaficDomain = undefined
        const baseSiafic = await app.db({ lp: tabelaLocalParamsDomain }).select('parametro')
            .where({ dominio: 'siafic', grupo: 'base' }).first()
        const tokenSiafic = await app.db({ lp: tabelaLocalParamsDomain }).select('parametro')
            .where({ dominio: 'siafic', grupo: 'token' }).first()

        switch (tipoTransmissao) {
            case '1': tabelaSiaficDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.siafic_apropriacao`
                break
            case '2': tabelaSiaficDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.siafic_desapropriacao`
                break
            case '3': tabelaSiaficDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.siafic_empenho`
            default: app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: Tipo de transmissão não informada ou inválida: ${tipoTransmissao}`, sConsole: true } })
        }
        const bodyTransmissao = {}
        let transmitido = []

        try {
            // Criação de um novo registro
            const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()

            bodyTransmissao.evento = nextEventID.count + 1
            // Variáveis da criação de um novo registro
            bodyTransmissao.status = STATUS_ACTIVE
            bodyTransmissao.created_at = new Date()
            bodyTransmissao.ano = body.ano
            bodyTransmissao.mes = body.mes

            let controllerSiafic = ''
            let sql = app.db({ 'siafic': tabelaSiaficDomain })
            switch (tipoTransmissao) {
                case '1': sql.select({
                    "id": "siafic.id",
                    "UnidadeGestora": "ua.nome",
                    "IdUnidadeGestora": 'siafic.id_unidade_gestora',
                    "Mes": 'siafic.mes',
                    "Ano": 'siafic.ano',
                    "ValorApropriacaoDecimo": 'siafic.apropriacao_decimo',
                    "ValorApropriacaoFerias": 'siafic.apropriacao_ferias'
                })
                    controllerSiafic = "FolhaApropriacao"
                    break
                case '2': sql.select({
                    "id": "siafic.id",
                    "UnidadeGestora": "ua.nome",
                    "IdUnidadeGestora": 'siafic.id_unidade_gestora',
                    "Mes": 'siafic.mes',
                    "Ano": 'siafic.ano',
                    "ValorDesapropriacaoDecimo": 'siafic.desapropriacao_decimo',
                    "ValorDesapropriacaoFerias": 'siafic.desapropriacao_ferias'
                })
                    controllerSiafic = "FolhaDesapropriacao"
                    break
                case '3': sql.select({
                    "id": "siafic.id",
                    "CodigoCentro": "2012",
                    "NomeCentro": "SECRETARIA MUNIC DE EDUCAÇÃO - FUNDEB 70%",
                    "MesFolha": 'siafic.mes',
                    "AnoFolha": 'siafic.ano',
                    "QuantidadeServidor": 1444,
                    "ValorFolha": 3645914.53,
                    "ValorPatronalINSS": 165207.97,
                    "ValorPatronalRPPS": 494973.29
                })
                    controllerSiafic = "FolhaEmpenho"
                    break
                default: app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: Tipo de transmissão não informada ou inválida: ${tipoTransmissao}`, sConsole: true } })
            }
            sql.leftJoin({ 'st': tabelaDomain }, function () {
                this.on('siafic.id', '=', 'st.id_siafic').on(app.db.raw(`st.tipo = '${tipoTransmissao}'`))
            })
                .join({ 'ua': tabelaOrgaoUaDomain }, 'ua.id_siafic', '=', 'siafic.id_unidade_gestora')
                .where({ ano: body.ano, mes: body.mes })
                .where(app.db.raw('st.status_transmissao IS NULL OR st.status_transmissao != 200'))
                .groupBy('siafic.id_unidade_gestora', 'siafic.mes', 'siafic.ano')
                .orderBy('siafic.id_unidade_gestora')
            let transmissoes = await app.db.raw(sql.toString())
            transmissoes = transmissoes[0]
            await transmissoes.forEach(element => {
                const id = element.id
                delete element.id
                const UnidadeGestora = element.nome
                delete element.nome
                const urlSiafic = `${baseSiafic.parametro}/${controllerSiafic}?token=${tokenSiafic.parametro}`
                axios.post(urlSiafic, element)
                    .then(async (body) => {
                        const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()
                        const bodyTransmissaoUnique = {}
                        bodyTransmissaoUnique.evento = nextEventID.count + 1
                        // Variáveis da criação de um novo registro
                        bodyTransmissaoUnique.status = STATUS_ACTIVE
                        bodyTransmissaoUnique.created_at = new Date()
                        bodyTransmissaoUnique.status_transmissao = body.status
                        bodyTransmissaoUnique.tipo = tipoTransmissao
                        bodyTransmissaoUnique.id_siafic = id
                        try {
                            app.db(tabelaDomain).insert(bodyTransmissaoUnique).where(id)
                                .then(ret => {
                                    bodyTransmissaoUnique.id = ret[0]
                                    // registrar o evento na tabela de eventos
                                    const { createEventIns } = app.api.sisEvents
                                    createEventIns({
                                        "notTo": ['created_at', 'evento', 'updated_at'],
                                        "next": bodyTransmissaoUnique,
                                        "request": ret,
                                        "evento": {
                                            "evento": `Novo registro`,
                                            "tabela_bd": tabela,
                                        }
                                    })
                                })
                                .catch(error => {
                                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                                    return res.status(500).send(error)
                                })
                        } catch (error) {
                            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                            res.status(400).send(error)
                        }
                        element.UnidadeGestora = UnidadeGestora
                    })
                    .catch(error => {
                        app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                        res.status(400).send(error)
                    })
                // element.id = id
                delete element.IdUnidadeGestora
                delete element.Mes
                delete element.Ano
                transmitido.push(element)
            });
            if (transmissoes.length == 0)
                transmitido = { 'json_retorno': "Não há nada a transmitir" }
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            res.status(400).send(error)
        }
        const result = { 'status': '200 - Envio Ok!', 'json_retorno': transmitido }
        if (internCall) return result
        else res.status(200).send(result)
    }

    return { sends }
}