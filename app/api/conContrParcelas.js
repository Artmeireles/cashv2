const moment = require('moment')
const client = require("basic-ftp")
const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, valueOrError, equalsOrError, valueMinorOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const { uploadsRoot, ftpRoot, baseFrontendUrl } = require('../config/params');
    const tabela = 'con_parcelas'
    const STATUS_PARCELA_ACTIVE = 1
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99
    const fs = require('fs');
    const ftpClient = new client.Client()
    ftpClient.ftp.verbose = true

    const save = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        const body = { ...req.body }
        try {
            // Alçada para edição de registro
            if (body.id)
                isMatchOrError(uParams && uParams.con_contratos >= 3, `${noAccessMsg} "Edição de contrato de consignação"`)
            // Alçada para criação de registro
            else isMatchOrError(uParams && uParams.con_contratos >= 2, `${noAccessMsg} "Inclusão de contrato de consignação"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        if (req.params.id_con_contratos) body.id_con_contratos = req.params.id_con_contratos
        if (req.params.id) body.id = req.params.id

        try {
            existsOrError(body.valor_parcela, 'Valor da parcela não informada')
            existsOrError(body.situacao, 'Situação da parcela não informada')
            if (body.id) {
                existsOrError(body.recorrencia, 'Recorrência não informada')
                existsOrError(body.observacao, 'Motivo da edição não informado')
                existsOrError(body.parcela, 'Parcela não informada')
                existsOrError(body.vencimento, 'Vencimento da parcela não informado')
            }
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function}:${__line} ${error}`, sConsole: true } })
            return res.status(400).send(error)
        }
        const recorrencia = body.recorrencia
        delete body.contrato
        delete body.status_label
        delete body.updated_at
        delete body.past
        delete body.uName
        delete body.recorrencia
        delete body.id_consignatario
        if (body.id) {
            delete body.primeiroVencimento
            // Variáveis da edição de um registro
            // registrar o evento na tabela de eventos
            const { createEventUpd } = app.api.sisEvents
            const evento = await createEventUpd({
                "notTo": ['created_at', 'evento', 'updated_at'],
                "last": await app.db(tabelaDomain).where({ id: body.id }).first(),
                "next": body,
                "request": req,
                "evento": {
                    "evento": `Alteração de contrato de consignação`,
                    "tabela_bd": tabela,
                }
            })
            if (recorrencia == "0") {
                body.evento = evento
                body.updated_at = new Date()
                const rowsUpdated = await app.db(tabelaDomain)
                    .update(body)
                    .where({ id: body.id })
                    .then((ret) => {
                        return res.status(200).send(body)
                    })
                    .catch(error => {
                        app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function}:${__line} ${error}`, sConsole: true } })
                        return res.status(500).send(error)
                    })
                existsOrError(rowsUpdated, 'Contrato não foi encontrado')
            } else if (recorrencia == "1") {
                const ocorrencias = await app.db(tabelaDomain)
                    .where({ id_con_contratos: body.id_con_contratos })
                    .andWhere(app.db.raw(`parcela >= ${body.parcela}`))
                ocorrencias.forEach(async element => {
                    element.situacao = body.situacao
                    element.valor_parcela = body.valor_parcela
                    element.observacao = body.observacao
                    element.evento = evento
                    element.updated_at = new Date()
                    await app.db(tabelaDomain)
                        .update(element)
                        .where({ id: element.id })
                        .catch(error => {
                            app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function}:${__line} ${error}`, sConsole: true } })
                            return res.status(500).send(error)
                        })
                });
                return res.status(200).send('Parcelas alteradas com sucesso')
            }
        } else {
            // Criação de um novo registro
            const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()
            bodyEvento = nextEventID.count + 1
            // registrar o evento na tabela de eventos
            const { createEventIns } = app.api.sisEvents
            createEventIns({
                "notTo": ['created_at', 'evento', 'updated_at'],
                "next": {},
                "request": req,
                "evento": {
                    "evento": `Criação de ${body.parcelas} parcelas de consignação para o con_contratos id: ${body.id_con_contratos}`,
                    "tabela_bd": tabela,
                }
            })

            const tabelaContratosDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_contratos`
            const contrato = await app.db(tabelaContratosDomain).where({ id: body.id_con_contratos }).first()
            const bodyParcelas = []
            for (let index = 1; index <= contrato.parcelas; index++) {
                const bodyParcela = {
                    status: STATUS_ACTIVE,
                    evento: bodyEvento,
                    created_at: new Date(),
                    id_con_contratos: body.id_con_contratos,
                    parcela: index,
                    valor_parcela: body.valor_parcela,
                    vencimento: moment(body.primeiroVencimento).add(index - 1, 'month').format("YYYY-MM-DD"),
                    situacao: body.situacao,
                }
                bodyParcelas.push(bodyParcela)
            }
            app.db(tabelaDomain)
                .insert(bodyParcelas)
                .then(ret => {
                    return res.status(200).send({ data: `${bodyParcelas.length} parcelas incluídas com sucesso` })
                })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function}:${__line} ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
        }
    }


    const limit = 10 // usado para paginação
    const get = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        const cpf = req.query.cpf ? req.query.cpf : ''
        try {
            // Alçada para exibição
            isMatchOrError((uParams && (uParams.con_contratos >= 1 || uParams.gestor === 1 || uParams.admin >= 1)), `${noAccessMsg} "Exibição de dados contratos consignados de servidor"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const id_con_contratos = req.params.id_con_contratos
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaContratosDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_contratos`

        const page = req.query.page || 1
        const key = req.query.key ? req.query.key.trim : ''
        const situacao = req.query.situacao ? req.query.situacao : undefined
        const vencimento = req.query.vencimento ? req.query.vencimento : undefined
        const statusV = req.query.statusV ? req.query.statusV : undefined

        let sql = app.db({ tb1: `${tabelaDomain}` })
            .select(app.db.raw('count(*) as count'))
            .join({ cc: `${tabelaContratosDomain}` }, `cc.id`, `=`, `tb1.id_con_contratos`)
            .where({ 'tb1.id_con_contratos': id_con_contratos })
            .where(function () {
                this.where(app.db.raw(`tb1.parcela like '%${key}%'`))
            })
        if (situacao != undefined)
            sql.andWhere({ 'tb1.situacao': situacao })
        if (vencimento != undefined)
            sql.andWhere(app.db.raw(`concat(extract(year from tb1.vencimento), '-', lpad(extract(month from tb1.vencimento), 2, '0')) = substring('${vencimento}', 1, 7)`))
        if (statusV != undefined)
            sql.andWhere(app.db.raw(`tb1.vencimento ${statusV == '1' ? '>=' : '<'} CONCAT('${uParams.f_ano}','-','${uParams.f_mes}','-01')`))
        const result = await app.db.raw(sql.toString())
        const count = parseInt(result[0][0].count) || 0

        let ret = app.db({ tb1: `${tabelaDomain}` })
            .select('tb1.*', `cc.contrato`, app.db.raw(`${dbPrefix}_app.getStatusLabel(tb1.status) as status_label`))
            .join({ cc: `${tabelaContratosDomain}` }, `cc.id`, `=`, `tb1.id_con_contratos`)
            .where({ 'tb1.id_con_contratos': id_con_contratos })
            .where(function () {
                this.where(app.db.raw(`tb1.parcela like '%${key}%'`))
            })
        if (situacao != undefined)
            ret.andWhere({ 'tb1.situacao': situacao })
        if (vencimento != undefined)
            ret.andWhere(app.db.raw(`concat(extract(year from tb1.vencimento), '-', lpad(extract(month from tb1.vencimento), 2, '0')) = substring('${vencimento}', 1, 7)`))
        if (statusV != undefined)
            ret.andWhere(app.db.raw(`tb1.vencimento ${statusV == '1' ? '>=' : '<'} CONCAT('${uParams.f_ano}','-','${uParams.f_mes}','-01')`))
        ret.orderBy('tb1.parcela')
        ret.limit(limit).offset(page * limit - limit)
            .then(body => {
                return res.json({ data: body, count, limit })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function}:${__line} ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getById = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        const cpf = req.query.cpf ? req.query.cpf : ''
        try {
            // Alçada para exibição
            isMatchOrError((uParams && (uParams.con_contratos >= 1 || uParams.gestor === 1 || uParams.admin >= 1)), `${noAccessMsg} "Exibição de dados contratos consignados de servidor"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const id_con_contratos = req.params.id_con_contratos
        const id = req.params.id
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaContratosDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_contratos`
        const tabelaEventosDomain = `${dbPrefix}_app.sis_events`
        const tabelaUsersDomain = `${dbPrefix}_app.users`

        let ret = app.db({ tb1: `${tabelaDomain}` })
            .select('tb1.*', `cc.contrato`, { 'uName': 'u.name' }, app.db.raw(`${dbPrefix}_app.getStatusLabel(tb1.status) as status_label`))
            .join({ cc: `${tabelaContratosDomain}` }, `cc.id`, `=`, `tb1.id_con_contratos`)
            .leftJoin({ se: tabelaEventosDomain }, 'se.id', '=', 'tb1.evento')
            .leftJoin({ u: tabelaUsersDomain }, 'u.id', '=', 'se.id_user')
            .where({ 'tb1.id_con_contratos': id_con_contratos, 'tb1.id': id }).first()
            .then(body => {
                return res.json({ data: body })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function}:${__line} ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const remove = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exclusão
            isMatchOrError(uParams && uParams.con_contratos >= 2, `${noAccessMsg} "Exclusão de parcela"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        try {
            // registrar o evento na tabela de eventos
            const last = await app.db(tabelaDomain).where({ id: req.params.id }).first()
            const { createEventUpd } = app.api.sisEvents
            const evento = await createEventUpd({
                "notTo": ['created_at', 'evento', 'updated_at'],
                "last": last,
                "next": { ...last, status: STATUS_DELETE },
                "request": req,
                "evento": {
                    "classevento": "Remove",
                    "evento": `Exclusão de contrato`,
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
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } });
            res.status(400).send(error)
        }
    }

    const getByFunction = async (req, res) => {
        const func = req.params.func
        switch (func) {
            case 'gpce':
                gPCE(req, res)
                break;
            case 'gimf':
                getImportToMGFolha(req, res)
                break;
            default:
                res.status(404).send('Função inexitente')
                break;
        }
    }

    // Gerar parcelas de contratos existentes do cliente
    const gPCE = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        const body = { ...req.body }
        try {
            // Alçada para edição de registro
            if (body.id)
                isMatchOrError(uParams && (uParams.id_cadas && uParams.tipoUsuario == 0) // Servidor
                    || uParams.con_contratos >= 3, `${noAccessMsg} "Edição em massa de contrato de consignação"`)
            // Alçada para criação de registro
            else isMatchOrError(uParams && (uParams.id_cadas && uParams.tipoUsuario == 0) // Servidor
                || uParams.con_contratos >= 2, `${noAccessMsg} "Inclusão em massa de contrato de consignação"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const id_con_contrato = req.query.contrato ? req.query.contrato : undefined

        // Criação de um novo registro
        const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()
        bodyEvento = nextEventID.count + 1
        // registrar o evento na tabela de eventos
        const { createEventIns } = app.api.sisEvents
        createEventIns({
            "notTo": ['created_at', 'evento', 'updated_at'],
            "next": {},
            "request": req,
            "evento": {
                "evento": `Criação de ${body.parcelas} parcelas de consignação para o con_contratos id: ${body.id_con_contratos}`,
                "tabela_bd": tabela,
            }
        })
        const tabelaContratosDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_contratos`
        let contratos = app.db({ 'cc': tabelaContratosDomain }).select('cc.id', 'cc.parcelas', 'cc.valor_parcela', 'cc.primeiro_vencimento')
            .leftJoin({ 'cp': tabelaDomain }, 'cp.id_con_contratos', '=', 'cc.id')
            // .where({ 'cc.status': STATUS_ACTIVE })
            .where(id_con_contrato != undefined ? { 'cc.id': id_con_contrato } : app.db.raw('1=1'))
            .where(app.db.raw('cp.id IS NULL'))
        contratos = await contratos
        // return res.status(200).send(contratos);
        let linhasExecutadas = 0
        contratos.forEach(element => {
            const bodyParcelas = []
            for (let index = 1; index <= element.parcelas; index++) {
                const vcto = moment(element.primeiro_vencimento).add(index - 1, 'month').endOf('month').format("YYYY-MM-DD")
                const bodyParcela = {
                    status: STATUS_ACTIVE,
                    evento: bodyEvento,
                    created_at: new Date(),
                    id_con_contratos: element.id,
                    parcela: index,
                    valor_parcela: element.valor_parcela,
                    vencimento: vcto,
                    situacao: 1,
                }
                bodyParcelas.push(bodyParcela)
                linhasExecutadas++
            }
            app.db(tabelaDomain).insert(bodyParcelas)
                .then()
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function}:${__line} ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
        });
        const resp = { data: linhasExecutadas > 0 ? `${linhasExecutadas} parcelas incluídas com sucesso` : `Não foram localizados contratos sem parcelas` }
        return req.query.res == false ? resp : res.status(200).send(resp)
    }

    const getImportToMGFolha = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        if (!(uParams.admin >= 1 || uParams.con_contratos >= 2)) return res.status(401).send('Unauthorized')
        // Recupera domínios do cliente
        const dominios = await app.db('params')
            .select({ 'dominio': 'value' })
            .where({ 'dominio': uParams.cliente, 'meta': 'domainName' })
            .orderBy('dominio', 'asc')
        const batchResult = []
        let dbSchema1 = ''
        let dbSchema2 = ''
        let dominio1 = ''
        let dominio2 = ''
        if (dominios) {
            dominio1 = dominio2 = dominios[0].dominio
            dbSchema1 = dbSchema2 = `${dbPrefix}_${uParams.cliente}_${dominio1}`
            if (dominios.length > 1) {
                dominio2 = dominios[1].dominio
                dbSchema2 = `${dbPrefix}_${uParams.cliente}_${dominio2}`
            }
        }
        let conveniosDb = await app.db.raw(`
            SELECT id_convenio FROM ${dbSchema1}.consignatarios cn
                UNION
            SELECT id_convenio FROM ${dbSchema2}.consignatarios cn
        `)
        let convenios = ''
        conveniosDb[0].forEach(element => {
            convenios += `${element.id_convenio},`
        });
        convenios = convenios.substring(0, convenios.length - 1)
        const sqlRaw = `
            SELECT ano, mes, matricula, febraban, parcela, parcelas, valor_parcela, dominio FROM (
                SELECT EXTRACT(YEAR FROM cp.vencimento)ano, EXTRACT(MONTH FROM cp.vencimento)mes, cs.matricula, 
                cv.febraban, cp.parcela, cc.parcelas, cp.valor_parcela, cc.contrato, '${dominio1}' AS 'dominio'
                FROM ${dbSchema1}.con_contratos cc
                JOIN ${dbSchema1}.con_parcelas cp ON cp.id_con_contratos = cc.id
                JOIN ${dbSchema1}.cad_servidores cs ON cc.id_cad_servidores = cs.id
                JOIN ${dbSchema1}.consignatarios cn ON cn.id = cc.id_consignatario
                JOIN wwmgca_api.con_convenios cv ON cv.id = cn.id_convenio
                WHERE EXTRACT(YEAR FROM cp.vencimento) = '${uParams.f_ano}' AND EXTRACT(MONTH FROM cp.vencimento) = '${uParams.f_mes}' 
                AND cn.id_convenio IN (${convenios}) AND cp.situacao = ${STATUS_PARCELA_ACTIVE}
                GROUP BY cc.contrato
                UNION
                SELECT EXTRACT(YEAR FROM cp.vencimento)ano, EXTRACT(MONTH FROM cp.vencimento)mes, cs.matricula, 
                cv.febraban, cp.parcela, cc.parcelas, cp.valor_parcela, cc.contrato, '${dominio2}' AS 'dominio'
                FROM ${dbSchema2}.con_contratos cc
                JOIN ${dbSchema2}.con_parcelas cp ON cp.id_con_contratos = cc.id
                JOIN ${dbSchema2}.cad_servidores cs ON cc.id_cad_servidores = cs.id
                JOIN ${dbSchema2}.consignatarios cn ON cn.id = cc.id_consignatario
                JOIN wwmgca_api.con_convenios cv ON cv.id = cn.id_convenio
                WHERE EXTRACT(YEAR FROM cp.vencimento) = '${uParams.f_ano}' AND EXTRACT(MONTH FROM cp.vencimento) = '${uParams.f_mes}' 
                AND cn.id_convenio IN (${convenios}) AND cp.situacao = ${STATUS_PARCELA_ACTIVE}
                GROUP BY cc.contrato
            ) dum
            GROUP BY contrato, matricula
            ORDER BY dominio, matricula, febraban, valor_parcela
        `
        const liquidacoes = await app.db.raw(sqlRaw)
        let dominio = dominio1
        batchResult.push({ dominio: dominio })
        for (const liquidacao of liquidacoes[0]) {
            if (liquidacao.dominio != dominio) {
                dominio = liquidacao.dominio
                batchResult.push({ dominio: liquidacao.dominio })
            }
            const matricula = liquidacao.matricula.toString().padStart(10, '0')
            let thisLine = `${liquidacao.ano};${liquidacao.mes.toString().padStart(2, '0')};${matricula};`
            thisLine += `${liquidacao.febraban};${liquidacao.parcela},${liquidacao.parcelas};${liquidacao.valor_parcela}`
            batchResult.push(thisLine)
        }
        return res.status(200).send(batchResult)
    }

    return { save, get, getById, remove, getByFunction, gPCE }
}