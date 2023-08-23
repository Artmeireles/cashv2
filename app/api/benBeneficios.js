const moment = require('moment')
const randomstring = require("randomstring")
const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, notExistsOrError, equalsOrError, cnpjOrError, isMatchOrError, noAccessMsg, isParamOrError } = app.api.validation
    const { mailyCliSender } = app.api.mailerCli;
    const { convertESocialTextToJson, getIdParam } = app.api.facilities;
    const tabela = 'ben_beneficios';
    const STATUS_ACTIVE = 10;
    const STATUS_DELETE = 99;

    const save = async (req, res) => {
        let user = req.user;
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        let body = { ...req.body };
        if (req.params.id) body.id = req.params.id;
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`;
        const tabelaBenVinculosDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.ben_vinculos`;
        //const tabelaBeneficiariosDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.beneficiarios`;

        delete body.id_ben_vinc
        body.id_ben_vinc = req.params.id_ben_vinc
        if (req.params.id) body.id = req.params.id
        try {
            // Alçada para edição
            if (body.id)
                isMatchOrError(uParams && uParams.cad_servidores >= 3, `${noAccessMsg} "Edição de ${tabela}"`)
            // Alçada para inclusão
            else isMatchOrError(uParams && uParams.cad_servidores >= 1, `${noAccessMsg} "Inclusão de ${tabela}"`)
        } catch (error) {
            return res.status(401).send(error);
        }
            body.id_ben_vinc = req.params.id_ben_vinc

    const contentType = req.headers["content-type"];
    if (contentType == "text/plain") {
      const bodyRaw = convertESocialTextToJson(req.body);
      //return res.send(bodyRaw)
      body = {};
      const id_ben_vinc = await app.db(tabelaBenVinculosDomain).select('id').where({ id_benef: bodyRaw.id_benef }).first();
      console.log(bodyRaw.id_benef);
      try {
        existsOrError(id_ben_vinc, `Benefício não encontrado`)
      } catch (error) {
        console.log('aqui', error);
        return res.status(400).send(error);
      }
      body.id_emp = bodyRaw.id_emp.id
      body.id_ben_vinc = bodyRaw.id_ben_vinc;
      body.id_rubrica = bodyRaw.id_rubrica;
      body.ide_dm_dev = bodyRaw.ide_dm_dev;
        }

        try {
            //existsOrError(body.id_ben_vinc, 'Vinculo não informado')
            //existsOrError(body.id_emp, 'Empresa não informado')
            existsOrError(body.id_rub, 'Rúbrica não informada')
            existsOrError(body.ide_dm_dev, 'Demonstrativo de Valor não informado')
        }
         catch (error) {
            return res.status(400).send(error)
        }
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
                else res.status(200).send('O benefício não foi encontrado')
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
        const id_ben_vinc = req.params.id_ben_vinc
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
            .where({ status: STATUS_ACTIVE, id_ben_vinc: req.params.id_ben_vinc })
            .where(function () {
                this.where(app.db.raw(`tbl1.id_ben_vinc regexp('${key.toString().replace(' ', '.+')}')`))
            })
        sql = await app.db.raw(sql.toString())
        const count = sql[0][0].count

        const ret = app.db({ tbl1: tabelaDomain })
            .where({ status: STATUS_ACTIVE, id_ben_vinc: req.params.id_ben_vinc })
            .where(function () {
                this.where(app.db.raw(`tbl1.id_ben_vinc regexp('${key.toString().replace(' ', '.+')}')`))
            })
        ret.orderBy('id_ben_vinc').limit(limit).offset(page * limit - limit)
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
            .where({ id_ben_vinc: req.params.id_ben_vinc, id: req.params.id, status: STATUS_ACTIVE }).first()
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
                .where({ id_ben_vinc: req.params.id_ben_vinc, id: req.params.id })
            existsOrError(rowsUpdated, 'Registro não foi encontrado')

            res.status(204).send()
        } catch (error) {
            res.status(400).send(error)
        }
    }
    return { save, get, getById, remove }
}