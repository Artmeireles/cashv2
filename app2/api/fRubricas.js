const moment = require('moment')
const randomstring = require("randomstring")
const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, notExistsOrError, equalsOrError, emailOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const tabela = 'fin_rubricas'
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99

    const save = async (req, res) => {
        const uParams = await app.db('users').where({ id: req.user.id }).first();
        const body = { ...req.body }
        try {
            // Alçada para edição
            if (body.id)
                isMatchOrError(uParams && uParams.cad_servidores >= 3, `${noAccessMsg} "Edição de registro financeiro"`)
            // Alçada para inclusão
            else isMatchOrError(uParams && uParams.cad_servidores >= 2, `${noAccessMsg} "Inclusão de registro financeiro"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        if (req.params.id) body.id = req.params.id

        try {
            existsOrError(body.cadasTipoId, 'Tipo de cadastro não informado')
            existsOrError(body.prospect, 'Prospecto sim ou não?')
            existsOrError(body.nome, 'Nome não informado')
            existsOrError(body.telefone1, 'Telefone não informado')
            if (body.cpfCnpj) {
                const dataFromDB = await app.db(tabelaDomain)
                    .where({ cpfCnpj: body.cpfCnpj, dominio: uParams.dominio })
                    .andWhere(app.db.raw(body.id ? (`id != '${body.id}'`) : '1=1'))
                    .first()
                notExistsOrError(dataFromDB, 'CPF/CNPJ já cadastrado')
            }
        } catch (error) {
            return res.status(400).send(error)
        }
        let aniversEn = undefined
        if (body.aniversario) {
            aniversEn = moment(body.aniversario, "DD-MM-YYYY")
            body.aniversario = aniversEn.format("YYYY-MM-DD")
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
                    "evento": `Alteração de cadastro`,
                    "tabela_bd": tabela,
                }
            })

            body.evento = evento
            body.updated_at = new Date()
            const rowsUpdated = await app.db(tabelaDomain)
                .update(body)
                .where({ id: body.id })
                .then(res.status(200).send({ id: body.id, nome: body.nome }))
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
            existsOrError(rowsUpdated, 'Cadastro não foi encontrado')
        } else {
            // Criação de um novo registro
            const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()

            body.evento = nextEventID.count + 1
            // Variáveis da criação de um novo registro
            body.token = randomstring.generate(40)
            body.status = STATUS_ACTIVE
            body.dominio = uParams.dominio
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
                            "evento": `Novo registro`,
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

    const limit = 20 // usado para paginação
    const get = async (req, res) => {
        let user = req.user
        const key = req.query.key ? req.query.key : undefined
        const cpf = req.query.cpf ? req.query.cpf : undefined
        const uParams = await app.db('users').where({ id: req.user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(req.user.cpf == cpf || (uParams && uParams.cad_servidores >= 2), `${noAccessMsg} "Exibição de registros financeiros"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaServidores = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.cad_servidores`
        const tabelaEventos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.fin_eventos`
        const tabelaContratos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_contratos`

        const page = req.query.page || 1

        const consignados = req.query.consignados ? req.query.consignados : ''
        const idCadas = req.query.idCadas ? req.query.idCadas : ''

        let sql = app.db(tabelaDomain).select(app.db.raw('count(*) as count'))
        if (consignados) {
            sql.where(app.db.raw(`${tabelaEventos}.consignado = 1`))
        }
        sql.join(tabelaEventos, `${tabelaEventos}.id`, `=`, `${tabelaDomain}.id_fin_eventos`)
            .join(tabelaServidores, `${tabelaServidores}.id`, `=`, `${tabelaDomain}.id_cad_servidores`)
            .andWhere(app.db.raw(idCadas ? `${tabelaDomain}.id_cad_servidores = ${idCadas}` : '1=1'))
            .andWhere(app.db.raw(`${tabelaDomain}.status = ${STATUS_ACTIVE}`))
        const result = await app.db.raw(sql.toString())
        const count = parseInt(result[0][0].count) || 0

        let ret = app.db(tabelaDomain)
        if (consignados) {
            ret.select({
                id: `${tabelaDomain}.id`,
                ano: `${tabelaDomain}.ano`,
                mes: `${tabelaDomain}.mes`,
                parcela: `${tabelaDomain}.complementar`,
                id_con_contratos: `${tabelaDomain}.id_con_contratos`,
                contrato: `${tabelaContratos}.contrato`,
                evento_nome: `${tabelaEventos}.evento_nome`,
                id_evento: `${tabelaEventos}.id_evento`,
                prazo: `${tabelaDomain}.prazo`,
                prazot: `${tabelaDomain}.prazot`,
                valor: `${tabelaDomain}.valor`
            })
                .where(app.db.raw(`${tabelaEventos}.consignado = 1`))
                .orderBy(app.db.raw(`${tabelaDomain}.ano DESC, ${tabelaDomain}.mes DESC, ${tabelaDomain}.complementar DESC, ${tabelaEventos}.id_evento`))
        } else {
            ret.select({
                id: `${tabelaDomain}.id`,
                ano: `${tabelaDomain}.ano`,
                mes: `${tabelaDomain}.mes`,
                parcela: `${tabelaDomain}.complementar`,
                id_con_contratos: `${tabelaDomain}.id_con_contratos`,
                contrato: `${tabelaContratos}.contrato`,
                evento_nome: `${tabelaEventos}.evento_nome`,
                id_evento: `${tabelaEventos}.id_evento`,
                prazo: `${tabelaDomain}.prazo`,
                prazot: `${tabelaDomain}.prazot`,
                valor: `${tabelaDomain}.valor`
            })
                .orderBy(`${tabelaDomain}.id`, "desc")
        }

        ret.join(tabelaEventos, `${tabelaEventos}.id`, `=`, `${tabelaDomain}.id_fin_eventos`)
            .join(tabelaServidores, `${tabelaServidores}.id`, `=`, `${tabelaDomain}.id_cad_servidores`)
            .leftJoin(tabelaContratos, `${tabelaContratos}.id`, `=`, `${tabelaDomain}.id_con_contratos`)
            .andWhere(app.db.raw(idCadas ? `${tabelaDomain}.id_cad_servidores = ${idCadas}` : '1=1'))
            .andWhere(app.db.raw(`${tabelaDomain}.status = ${STATUS_ACTIVE}`))
            .limit(limit).offset(page * limit - limit)
            .then(body => {
                return res.json({ data: body, count, limit })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getByFunction = async (req, res) => {
        const uParams = await app.db('users').where({ id: req.user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && (uParams.tipoUsuario == 0 || uParams.financeiro >= 1 || uParams.cad_servidores >= 1), `${noAccessMsg} "GetByFunction financeiro"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const domain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}`
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const body = { ...req.body }
        const func = req.params.func
        const params = []
        body.params.forEach(function (item) {
            params.push(`'${item}'`);
        });
        const raw = `${domain}.${func}(${params})`
        const ret = app.db(tabelaDomain)
            .select({ data: app.db.raw(raw) }).first()
        ret.then(body => res.json({ data: body }))
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getById = async (req, res) => {
        const uParams = await app.db('users').where({ id: req.user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && (uParams.financeiro >= 1 || uParams.cad_servidores >= 1), `${noAccessMsg} "Exibição de registro financeiro"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const ret = app.db(`${tabelaDomain}`)
        if ([11, 14].includes(req.params.id.length))
            ret.where({ cpfCnpj: req.params.id })
        else if (isNaN(req.params.id))
            ret.where({ token: req.params.id })
        else ret.where({ id: req.params.id })
        ret.andWhere(app.db.raw(`${tabelaDomain}.dominio = '${uParams.dominio}'`)).first()
        ret.then(body => {
            body.obs = body.obs ? body.obs.toString() : body.obs
            return res.json({ data: body })
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const remove = async (req, res) => {
        const uParams = await app.db('users').where({ id: req.user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && (uParams.financeiro >= 4 || uParams.cad_servidores >= 4), `${noAccessMsg} "Exclusão de registro financeiro"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        try {
            // registrar o evento na tabela de eventos
            const last = await app.db(tabelaDomain).where({ id: req.params.id }).first()
            const { createEventUpd } = app.api.sisEvents
            const evento = await createEventUpd({
                "notTo": ['created_at', 'password', 'password_reset_token', 'evento'],
                "last": last,
                "next": registro,
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
            res.status(400).send(error)
        }
    }

    return { save, get, getById, getByFunction, remove }
}