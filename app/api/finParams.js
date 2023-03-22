const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, notExistsOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const { mailyCliSender } = app.api.mailerCli
    const tabela = 'fin_parametros'
    const SITUATION_CLOSED = 0
    const SITUATION_ACTIVE = 1
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99

    const limit = 20 // usado para paginação
    const get = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`

        const page = req.query.page || 1
        const key = req.query.key ? req.query.key : ''
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.financeiro >= 1, `${noAccessMsg} "Exibição de parâmetros financeiros"`)
        } catch (error) {
            return res.status(401).send(error)
        }

        let sql = app.db({ td: `${tabelaDomain}` }).select(app.db.raw('count(*) as count'))
            .where(app.db.raw(`concat(td.ano,'/',td.mes) = '${key.toLowerCase()}'`))
            .orWhere(app.db.raw(`lower(td.descricao) like '%${key.toLowerCase()}%'`))
            .orWhere(app.db.raw(`lower(td.mensagem) like '%${key.toLowerCase()}%'`))
        const result = await app.db.raw(sql.toString())

        const count = result[0][0] ? parseInt(result[0][0].count) : 0

        const ret = app.db({ td: `${tabelaDomain}` })
            .where(app.db.raw(`concat(td.ano,'/',td.mes) = '${key.toLowerCase()}'`))
            .orWhere(app.db.raw(`lower(td.descricao) like '%${key.toLowerCase()}%'`))
            .orWhere(app.db.raw(`lower(td.mensagem) like '%${key.toLowerCase()}%'`))
            .orderBy('ano', 'desc')
            .orderBy('mes', 'desc')
            .limit(limit).offset(page * limit - limit)
        ret.then(body => {
            return res.json({ data: body, count, limit })
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getByField = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        const forceDominio = req.query.dominio
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${forceDominio ? forceDominio : uParams.dominio}.${tabela}`
        const page = req.query.page || 1
        try {
            existsOrError(req.params.field, 'Field não informado')
        } catch (error) {
            return res.status(400).send(error)
        }
        const field = req.params.field
        const forceAno = req.query.ano
        const forceMes = req.query.mes
        const forceIdCadServidor = req.query.id_cad_servidores

        const ret = app.db({ td: `${tabelaDomain}` })
            .select(app.db.raw(`td.${field} as field`))
        if (!forceAno && !forceMes) {
            if (['mes', 'complementar'].includes(field))
                ret.where({ 'td.ano': uParams.f_ano })
            if (['complementar'].includes(field))
                ret.where({ 'td.ano': uParams.f_ano, 'td.mes': uParams.f_mes })
        }
        if (forceAno) ret.where({ "td.ano": forceAno })
        if (forceMes) ret.where({ "td.ano": forceAno, "td.mes": forceMes })
        if (forceIdCadServidor) {
            const tabelaFinSFuncionalDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.fin_sfuncional`
            ret.join({ ff: `${tabelaFinSFuncionalDomain}` }, function () {
                this.on(`ff.ano`, `=`, `td.ano`)
                this.on(`ff.mes`, `=`, `td.mes`)
                this.on(`ff.complementar`, `=`, `td.complementar`)
            })
                .where({ "ff.id_cad_servidores": forceIdCadServidor })
        }
        if (uParams.tipoUsuario < 2) ret.where({ 'td.situacao': SITUATION_CLOSED })

        ret.groupBy(`td.${field}`)
            .orderBy('td.ano', 'desc')
            .orderBy('td.mes', 'desc')
            .orderBy('td.complementar')
            .limit(limit).offset(page * limit - limit)
        ret.then(body => {
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
            // Alçada para edição
            isMatchOrError(uParams && uParams.financeiro >= 3, `${noAccessMsg} "Edição de parâmetros em bloco"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const batch = { ...req.body.parametrosFinanceiros }
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

            const parametro = { ano: body.ano, mes: body.mes, complementar: body.complementar }

            const bodyIdFinParametro = await app.db({ fe: tabelaDomain })
                .where(parametro)
                .first()
            body.id = (bodyIdFinParametro && bodyIdFinParametro.id ? bodyIdFinParametro.id : null) || undefined

            const bodyValidation = []
            if (!body.ano) bodyValidation.push('Ano do parâmetro não informado')
            if (!body.mes) bodyValidation.push('Mes do parâmetro não informado')
            if (!body.complementar) bodyValidation.push('Complementar do parâmetro não informado')
            if (!body.ano_informacao) bodyValidation.push('Ano Informacao do parâmetro não informado')
            if (!body.mes_informacao) bodyValidation.push('Mes Informacao do parâmetro não informado')
            if (!body.complementar_informacao) bodyValidation.push('Parcela Informacao do parâmetro não informado')
            if (!body.descricao) bodyValidation.push('Descricao do parâmetro não informado')
            if (!body.situacao) bodyValidation.push('Situacao do parâmetro não informado')
            if (!body.d_situacao) bodyValidation.push('D Situacao do parâmetro não informado')
            if (!body.mensagem) bodyValidation.push('Mensagem do parâmetro não informado')
            if (!body.mensagem_aniversario) bodyValidation.push('Mensagem Aniversario do parâmetro não informado')
            if (!body.manad_tipofolha) bodyValidation.push('Manad Tipofolha do parâmetro não informado')

            if (bodyValidation.length > 0) batchResult.push({ ...parametro, result: JSON.stringify(bodyValidation) })

            if (bodyValidation.length > 0) {
                const mail = {
                    "from": "suporte@mgcash.app.br",
                    "to": "suporte@mgcash.app.br",
                    "subject": "Erro finParams saveByBatch",
                    "message": `${JSON.stringify({ cliente: client, dominio: domain, evento: body.id_evento, result: JSON.stringify(bodyValidation) })}`
                }
                req.mail = mail
                req.batch = true
                mailyCliSender(req, res)
            }

            delete body.origin

            if (body.id) {
                // O PonteCash não bloqueia mais um parâmetro abert. Apenas libera
                if (body.situacao != 0) delete body.situacao
                // Variáveis da edição de um registro
                // registrar o evento na tabela de eventos
                const { createEventUpd } = app.api.sisEvents
                const evento = await createEventUpd({
                    "notTo": ['created_at', 'evento', 'updated_at'],
                    "last": await app.db(tabelaDomain).where({ id: body.id }).first(),
                    "next": body,
                    "request": req,
                    "evento": {
                        "evento": `Alteração de parâmetro financeiro`,
                        "tabela_bd": tabela,
                    }
                })

                body.evento = evento
                body.updated_at = new Date()
                await app.db(tabelaDomain)
                    .update(body)
                    .where({ id: body.id })
                    .then((ret) => {
                        batchResult.push(parametro)
                        pkToUpdate += `'${body.ano}','${body.mes}','${body.complementar}',`;
                    })
                    .catch(error => {
                        app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                        batchResult.push({ ...parametro, result: 'Erro: ' + error })
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
                                "evento": `Novo parâmetro financeiro`,
                                "tabela_bd": tabela,
                            }
                        })
                        batchResult.push(parametro)
                        pkToUpdate += `'${body.ano}','${body.mes}','${body.complementar}',`;
                        batchDone++
                    })
                    .catch(error => {
                        app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                        batchResult.push({ ...parametro, result: 'Erro: ' + error })
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

    return { get, getByField, saveByBatch }
}