const moment = require('moment')
const randomstring = require("randomstring")
const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, notExistsOrError, equalsOrError, isValidEmail, cpfOrError, isMatchOrError, noAccessMsg, isParamOrError } = app.api.validation
    const { mailyCliSender } = app.api.mailerCli
    const { convertESocialTextToJson, getIdParam, getIdCidade } = app.api.facilities
    const tabela = 'beneficiarios'
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99

    const save = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        let body = { ...req.body }
        if (req.params.id) body.id = req.params.id
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        try {
            // Alçada para edição
            if (body.id)
                isMatchOrError(uParams && uParams.cad_servidores >= 3, `${noAccessMsg} "Edição de ${tabela}"`)
            // Alçada para inclusão
            else isMatchOrError(uParams && uParams.cad_servidores >= 1, `${noAccessMsg} "Inclusão de ${tabela}"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const contentType = req.headers['content-type']
        if (contentType == "text/plain") {
            const bodyRaw = convertESocialTextToJson(req.body)
            //return res.send(bodyRaw)
            const bodyString = req.body.toString();
            const lines = bodyString.split(/\r?\n/);
            // Variáveis de controle
            let cpfBenef = null;
            try {
                for (const line of lines) {
                    if (line.startsWith('cpfBenef_')) {
                        cpfBenef = line.split('=')[1];
                        break;
                    }
                }
            } catch (error) {
                if (!cpfBenef) throw `CPF não informado`;
                return res.status(400).send(error)
            }
            body = {}
            const tpl = await app.db(tabelaDomain).where({ 'id_serv': cpfBenef }).first()
            if (tpl && tpl.id) {
                body.id = tpl.id
            }
            body.id_serv = bodyRaw.id_serv
            body.dt_inicio = bodyRaw.cpfBenef_10
            body.inc_fis_men = bodyRaw.nmBenefic_11
            body.dt_inc_fis = bodyRaw.dtNascto_12
        }
        //body.id_emp = req.params.id_emp


        try {
            existsOrError(body.id_emp, 'Órgão não informado')
            existsOrError(body.cpf_benef, 'CPF do Trabalhador não informado')
            cpfOrError(body.cpf_benef, 'CPF inválido')
            existsOrError(body.nome, 'Nome não informado')
            existsOrError(body.dt_nascto, 'Data de Nascimento do beneficiário não informada')
            existsOrError(body.dt_inicio, 'Data início do cadastro não informada')
            existsOrError(body.id_param_sexo, 'Sexo não informado')
            existsOrError(await isParamOrError('sexo', body.id_param_sexo), 'Sexo selecionado não existe')
            existsOrError(body.id_param_raca_cor, 'Raça ou Cor não informado')
            existsOrError(await isParamOrError('racaCor', body.id_param_raca_cor), 'Raça selecionada não existe')
            existsOrError(body.id_param_est_civ, 'Estado Civil não informado')
            existsOrError(await isParamOrError('estCiv', body.id_param_est_civ), 'Estado Civil selecionado não existe')
            existsOrError(body.id_param_tplograd, 'Tipo de Logradouro não informado')
            existsOrError(await isParamOrError('tpLograd', body.id_param_tplograd), 'Tipo de Logradouro selecionado não existe')
            existsOrError(body.inc_fis_men, 'Condição Física não informado')
            //existsOrError(body.dt_inc_fis, 'Data reconhecimento da incapacidade não informada')
            existsOrError(body.cep, 'CEP não informado')
            existsOrError(body.id_cidade, 'Cidade não informada')
            existsOrError(body.bairro, 'Bairro não informado')
            existsOrError(body.nr, 'Número não informado')
            existsOrError(body.logradouro, 'Logradouro não informado')
            if (body.cpf_benef) {
                const dataFromDB = await app.db(tabelaDomain)
                    .where({ cpf_benef: body.cpf_benef })
                    .andWhere(app.db.raw(body.id ? (`id != '${body.id}'`) : '1=1'))
                    .first()
                notExistsOrError(dataFromDB, 'Combinação de CPF já cadastrado')
            }
        } catch (error) {
            return res.status(400).send(error)
        }

        delete body.matricula
        delete body.hash

        const { changeUpperCase, removeAccentsObj } = app.api.facilities
        body = (JSON.parse(JSON.stringify(body), removeAccentsObj));
        body = (JSON.parse(JSON.stringify(body), changeUpperCase));

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
                else res.status(200).send('O Beneficiário não foi encontrado')
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
            isMatchOrError(uParams && uParams.financeiro >= 1, `${noAccessMsg} "Exibição de empresa"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`

        const page = req.query.page || 1

        let sql = app.db({ tbl1: tabelaDomain }).count('tbl1.id', { as: 'count' })
        .where({ status: STATUS_ACTIVE })
        .where(function () {
            this.where(app.db.raw(`tbl1.id_serv regexp('${key.toString().replace(' ', '.+')}')`))
        })
        sql = await app.db.raw(sql.toString())
        const count = sql[0][0].count
        const ret = app.db({ tbl1: tabelaDomain })
            .where({ status: STATUS_ACTIVE })
            .where(function () {
                this.where(app.db.raw(`tbl1.id_serv regexp('${key.toString().replace(' ', '.+')}')`))
            })
        ret.orderBy('id_serv').limit(limit).offset(page * limit - limit)
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