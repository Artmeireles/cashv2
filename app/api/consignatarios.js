const moment = require('moment')
const randomstring = require("randomstring")
const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, notExistsOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const tabela = 'consignatarios'
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99

    const save = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para edição
            if (body.id)
                isMatchOrError(uParams && uParams.con_contratos >= 3, `${noAccessMsg} "Edição de consignatário"`)
            // Alçada para inclusão
            else isMatchOrError(uParams && uParams.con_contratos >= 2, `${noAccessMsg} "Inclusão de consignatário"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const body = { ...req.body }
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
                "notTo": ['created_at', 'evento',],
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
        const uParams = await app.db('users').where({ id: user.id }).first();
        const cpf = req.query.cpf ? req.query.cpf : ''
        try {
            // Alçada para exibição
            isMatchOrError((uParams && (
                (uParams.id_cadas && uParams.tipoUsuario == 0) // Servidor
                || uParams.con_contratos >= 1 || uParams.gestor === 1)), `${noAccessMsg} "Exibição de consignatários"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaServidores = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.cad_servidores`
        const tabelaConEventos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_eventos`
        const tabelaConContratos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_contratos`
        const tabelaFinEventos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.fin_eventos`

        const page = req.query.page || 1
        const key = req.query.key ? req.query.key : ''

        const consignados = req.query.consignados ? req.query.consignados : ''
        const idCadas = req.query.idCadas ? req.query.idCadas : ''

        let sql = app.db(tabelaDomain).select(app.db.raw('count(*) as count'))
        if (consignados) {
            sql.where(app.db.raw(`${tabelaFinEventos}.consignado = 1`))
        }
        sql.join(tabelaConEventos, `${tabelaConEventos}.id_consignatario`, `=`, `${tabelaDomain}.id`)
            .join(tabelaFinEventos, `${tabelaFinEventos}.id`, `=`, `${tabelaConEventos}.id_fin_eventos`)
            .leftJoin(tabelaConContratos, `${tabelaConContratos}.id_consignatario`, `=`, `${tabelaDomain}.id`)
        if (idCadas)
            sql.join(tabelaServidores, `${tabelaServidores}.id`, `=`, `${tabelaConContratos}.id_cad_servidores`)
        sql.andWhere(app.db.raw(idCadas ? `${tabelaServidores}.id = ${idCadas}` : '1=1'))
            .andWhere(app.db.raw(`${tabelaDomain}.status = ${STATUS_ACTIVE}`))
            .groupBy(app.db.raw(`${tabelaConEventos}.id_consignatario`))
        const result = await app.db.raw(sql.toString())
        const count = parseInt(result[0][0].count) || 0

        let ret = app.db(tabelaDomain)
        if (consignados) {
            ret.select({
                id: `${tabelaDomain}.id`,
                ano: `${tabelaDomain}.ano`,
                mes: `${tabelaDomain}.mes`,
                parcela: `${tabelaDomain}.complementar`,
                evento_nome: `${tabelaFinEventos}.evento_nome`,
                id_evento: `${tabelaFinEventos}.id_evento`,
                prazo: `${tabelaDomain}.prazo`,
                prazot: `${tabelaDomain}.prazot`,
                valor: `${tabelaDomain}.valor`
            })
                .where(app.db.raw(`${tabelaFinEventos}.consignado = 1`))
                .orderBy(app.db.raw(`${tabelaDomain}.ano DESC, ${tabelaDomain}.mes DESC, ${tabelaDomain}.complementar DESC, ${tabelaFinEventos}.id_evento`))
        } else
            ret.orderBy(`${tabelaDomain}.id`, "desc")

        ret.join(tabelaConEventos, `${tabelaConEventos}.id_consignatario`, `=`, `${tabelaDomain}.id`)
            .join(tabelaFinEventos, `${tabelaFinEventos}.id`, `=`, `${tabelaConEventos}.id_fin_eventos`)
            .leftJoin(tabelaConContratos, `${tabelaConContratos}.id_consignatario`, `=`, `${tabelaDomain}.id`)
        if (idCadas)
            ret.join(tabelaServidores, `${tabelaServidores}.id`, `=`, `${tabelaConContratos}.id_cad_servidores`)
        ret.andWhere(app.db.raw(idCadas ? `${tabelaServidores}.id = ${idCadas}` : '1=1'))
            .andWhere(app.db.raw(`${tabelaDomain}.status = ${STATUS_ACTIVE}`))
            .groupBy(app.db.raw(`${tabelaConEventos}.id_consignatario`))
            .limit(limit).offset(page * limit - limit)
        ret.then(body => {
            return res.json({ data: body, count, limit })
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getByFunction = async (req, res) => {
        const func = req.params.func
        switch (func) {
            case 'gcgn':
                getConsignatarios(req, res)
                break;
            default:
                res.status(404).send('Função inexitente')
                break;
        }
    }

    const getConsignatarios = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaBancos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.cad_bancos`
        const tabelaConvenios = `${dbPrefix}_app.con_convenios`
        const ret = app.db({ td: `${tabelaDomain}` })
            .join({ 'cv': tabelaConvenios }, 'td.id_convenio', '=', 'cv.id')
            .select(`cv.id`, `cb.nome`, `cb.nomeAbrev`, `cv.agencia`)
            .join({ cb: `${tabelaBancos}` }, `cb.id`, `=`, `td.id_cad_bancos`)
            .then(body => {
                return res.json({ data: body })
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
            isMatchOrError((uParams && (
                (uParams.id_cadas && uParams.tipoUsuario == 0) // Servidor
                || uParams.con_contratos >= 1 || uParams.gestor === 1)), `${noAccessMsg} "Exibição de consignatários"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaConvenios = `${dbPrefix}_app.con_convenios`
        const tabelaBancos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.cad_bancos`
        const tabelaContratos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_contratos`
        const tabelaUserParams = `${dbPrefix}_app.users`
        const ret = app.db({ co: `${tabelaDomain}` })
            .select(`cb.id as id_cad_bancos`, `cb.nome as banco`, `cb.febraban`, `co.id as id_consignatario`, `cv.agencia`, `cv.qmp`, `cv.qmar`)
            .join({ 'cv': tabelaConvenios }, 'co.id_convenio', '=', 'cv.id')
            .join({ cb: `${tabelaBancos}` }, `cb.id`, `=`, `co.id_cad_bancos`)
        if (uParams.consignatario)
            ret.join({ u: `${tabelaUserParams}` }, `u.consignatario`, `=`, `co.id`)
                .where(app.db.raw(`co.id = ${uParams.consignatario}`)).first()
        else
            ret.join({ cc: `${tabelaContratos}` }, `cc.id_consignatario`, `=`, `co.id`)
                .where(app.db.raw(`cc.id = ${req.params.id}`)).first()
        ret.then(body => {
            return res.json({ data: body })
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const remove = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exclusão 
            isMatchOrError(uParams && uParams.con_contratos >= 4, `${noAccessMsg} "Inclusão de consignatário"`)
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