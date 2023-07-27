const moment = require('moment')
const randomstring = require("randomstring")
const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, isMatchOrError, noAccessMsg, isParamOrError } = app.api.validation
    const { getIdParam } = app.api.facilities;
    const tabela = 'serv_afastamentos'
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99

    const save = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        const body = { ...req.body }
        delete body.id_serv_vinc
        body.id_serv_vinc = req.params.id_serv_vinc
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

        // Se a requisicao for do tipo text/plain, enviar para o saveBatch
        const contentType = req.headers["content-type"];
        if (contentType == "text/plain") {
            return saveBatch(req, res);
        }

        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaParams = `${dbPrefix}_app.params`

        try {
            //existsOrError(body.id_serv_vinc, 'Vinculo não informado')
            existsOrError(body.id_par_mtv_af, 'Motivo do Afastamento não informado')
            existsOrError(await isParamOrError('mtvAfast', body.id_par_mtv_af), 'Motivo do Afastamento selecionado não existe')
            // existsOrError(body.info_mesmo_mtv, 'Mesmo Motivo não informado')
            const mtvAfast = await app.db(tabelaParams).select('value').where({ id: body.id_par_mtv_af }).first()
            if (['01', '03'].includes(mtvAfast.value)) {
                existsOrError(body.id_par_tp_acid, 'Tipo Acidente não informado')
                existsOrError(await isParamOrError('tpAcid', body.id_par_tp_acid), 'Tipo Acidente selecionado não existe')
            }
            existsOrError(body.dt_inicio, 'Data Início não informada')
            // if (body.id_par_mtv_af !== '716')   
            if (moment(body.dt_inicio, "DD/MM/YYYY").format() > moment((new Date()), "DD/MM/YYYY").format()) {
                throw `A data de início do afastamento (${body.dt_inicio}) não pode ser posterior à data atual (${new Date()})`
            }

            // existsOrError(body.dt_fim, 'Data Fim não informado')
            if (body.dt_fim && moment(body.dt_fim, "DD/MM/YYYY").format() < moment(body.dt_inicio, "DD/MM/YYYY").format()) {
                throw `A data de fim do afastamento (${body.dt_fim}) não pode ser anterior à data de início do afastamento (${body.dt_inicio})`
            }
            if (body.id_par_onus) {
                // existsOrError(body.id_par_onus, 'Ônus não informado')
                existsOrError(await isParamOrError('Onus', body.id_par_onus), 'Ônus selecionado não existe')
                existsOrError(body.cnpj_onus, 'CNPJ Ônus não informado')
            }
            if (body.id_par_tp_af) {
                existsOrError(body.id_par_tp_af, 'Tipo Afastamento não informado')
                existsOrError(await isParamOrError('tpAfast', body.id_par_tp_af), 'Tipo Afastamento selecionado não existe')
            }
            // Informação obrigatória e exclusiva se o código de categoria no Registro de Eventos Trabalhistas - RET for igual a [301].
            // existsOrError(body.ind_remun_cargo, 'Remuneração Cargo Efetivo não informado')
            if (['21'].includes(mtvAfast.value)) {
                existsOrError(body.obs, 'Observação não informada')
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
                else res.status(200).send('O Parâmetro não foi encontrado')
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

    const saveBatch = async (req, res) => {
        let user = req.user;
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();
        try {
            // Alçada para edição
            isMatchOrError(uParams && uParams.cad_servidores >= 3, `${noAccessMsg} "Edição de ${tabela}"`);
        } catch (error) {
            return res.status(401).send(error);
        }

        const { changeUpperCase, removeAccentsObj } = app.api.facilities;

        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`;
        const tabelaServidoresDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.servidores`;
        const tabelaServVinculoDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.serv_vinculos`;

        const bodyString = req.body.toString();
        const lines = bodyString.split(/\r?\n/);
        const bodyInputs = [];
        let countInsert = 0;
        let countUpdate = 0;
        let errorsMsg = [];
        // Variáveis de controle
        let cpfTrab = null;
        let matricula = null;
        let servVinc = {}
        // Variáveis do input
        let dtIniAfast = null;
        let codMotAfast = null;
        let infoMesmoMtv = null;
        let tpAcidTransito = null;
        let observacao = null;
        let cnpjCess = null;
        let infOnus = null;
        let dtTermAfast = null;

        for (const line of lines) {
            if (line.startsWith('cpfTrab_')) {
                cpfTrab = line.split('=')[1];
            } else if (line.startsWith('matricula_')) {
                matricula = line.split('=')[1];
                servVinc = await app.db({ 'v': tabelaServVinculoDomain })
                    .select('v.id')
                    .join({ 's': tabelaServidoresDomain }, 's.id', '=', 'v.id_serv')
                    .where(function () {
                        this.where('v.matricula', matricula)
                            .andWhere('s.cpf_trab', cpfTrab)
                            .andWhere('v.ini_valid', '<=', moment().format('YYYY-MM'))
                    }).first()
                if (servVinc && servVinc.id)
                    servVinc = servVinc.id;
                else {
                    errorsMsg.push(`Registro de vínculo (CPF: ${cpfTrab} - Matrícula: ${matricula}) não encontrado`);
                    break;
                }
            } else if (line.startsWith('dtIniAfast_')) {
                dtIniAfast = line.split('=')[1];
            } else if (line.startsWith('codMotAfast_')) {
                codMotAfast = await getIdParam("mtvAfast", line.split('=')[1]);
                if (!codMotAfast) {
                    errorsMsg.push(`Motivo afastamento (${line.split('=')[1]}) inválido`);
                    break;
                }
            } else if (line.startsWith('infoMesmoMtv_')) {
                infoMesmoMtv = line.split('=')[1] === 'S' ? true : false;
            } else if (line.startsWith('tpAcidTransito_')) {
                tpAcidTransito = await getIdParam("tpAcid", line.split('=')[1]);
                if (!tpAcidTransito) {
                    errorsMsg.push(`Tipo de acidente de trânsito (${line.split('=')[1]}) inválido`);
                    break;
                }
            } else if (line.startsWith('observacao_')) {
                observacao = line.split('=')[1] || null;
            } else if (line.startsWith('cnpjCess_')) {
                cnpjCess = line.split('=')[1] || null;
            } else if (line.startsWith('infOnus_')) {
                infOnus = line.split('=')[1] || null;
            } else if (line.startsWith('dtTermAfast_')) {
                dtTermAfast = line.split('=')[1] || null;
                if (servVinc && codMotAfast && dtIniAfast) {
                    const registro = await app.db(tabelaDomain)
                        .select('id')
                        .where({
                            id_serv_vinc: servVinc,
                            id_par_mtv_af: codMotAfast,
                            dt_inicio: dtIniAfast,
                        }).first()
                    currentGroup = {
                        id: registro ? registro.id : undefined,
                        status: STATUS_ACTIVE,
                        evento: 1,
                        created_at: new Date(),
                        updated_at: new Date(),
                        id_serv_vinc: servVinc,
                        id_par_mtv_af: codMotAfast,
                        dt_inicio: dtIniAfast,
                        dt_fim: dtTermAfast,
                        id_par_tp_acid: tpAcidTransito,
                        cnpj_onus: cnpjCess,
                        id_par_onus: infOnus,
                        obs: observacao,
                    }
                    bodyInputs.push(currentGroup);
                }
            }
        }


        for (let element of bodyInputs) {
            try {
                if (element.id) {
                    delete element.created_at
                    await app.db(tabelaDomain).update(element).where({ id: element.id })
                    countUpdate++;
                } else {
                    delete element.updated_at
                    await app.db(tabelaDomain).insert(element)
                    countInsert++;
                }
            } catch (error) {
                errorsMsg.push(error)
            }
        }

        return res.status(countInsert + countUpdate > 0 ? 200 : 201).send({
            result: {
                registrosIncluidos: countInsert,
                registrosAlterados: countUpdate,
                errors: errorsMsg
            },
            bodyInputs
        })


    };

    const limit = 20 // usado para paginação
    const get = async (req, res) => {
        let user = req.user
        const id_serv_vinc = req.params.id_serv_vinc
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
            .where({ status: STATUS_ACTIVE, id_serv_vinc: req.params.id_serv_vinc })
            .where(function () {
                this.where(app.db.raw(`tbl1.id_serv_vinc regexp('${key.toString().replace(' ', '.+')}')`))
            })
        sql = await app.db.raw(sql.toString())
        const count = sql[0][0].count

        const ret = app.db({ tbl1: tabelaDomain })
            .where({ status: STATUS_ACTIVE, id_serv_vinc: req.params.id_serv_vinc })
            .where(function () {
                this.where(app.db.raw(`tbl1.id_serv_vinc regexp('${key.toString().replace(' ', '.+')}')`))
            })
        ret.orderBy('id_serv_vinc').limit(limit).offset(page * limit - limit)
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
            .where({ id_serv_vinc: req.params.id_serv_vinc, id: req.params.id, status: STATUS_ACTIVE }).first()
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
                .where({ id_serv_vinc: req.params.id_serv_vinc, id: req.params.id })
            existsOrError(rowsUpdated, 'Registro não foi encontrado')

            res.status(204).send()
        } catch (error) {
            res.status(400).send(error)
        }
    }
    return { save, get, getById, remove }
}