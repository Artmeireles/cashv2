const moment = require('moment')
const randomstring = require("randomstring")
const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, notExistsOrError, equalsOrError, isValidEmail, isMatchOrError, noAccessMsg } = app.api.validation
    const { mailyCliSender } = app.api.mailerCli
    const tabela = 'remuneracao'
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99

    const save = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
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
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`

        try {
            //existsOrError(body.id_serv_vinc, 'Vinculo não informado')
            existsOrError(body.id_remun_param, 'Parâmetros da Remuneração não informada')
            existsOrError(body.id_rubrica, 'Rúbrica não informada')
            existsOrError(body.id_ad_fg, 'Tipo da Remuneração não informado')
            existsOrError(body.qtd_rubr, 'Quantidade não informada')
            existsOrError(body.fator_rubr, 'Fator da Rúbrica não informada')
            existsOrError(body.valor_rubr, 'Valor da Rúbrica não informada')
            existsOrError(body.ind_apur_ir, 'Indicativo de Apuração não informado')
            existsOrError(body.prazo_i, 'Prazo Inicial não informado')
            existsOrError(body.prazo_f, 'Prazo Final não informado')
            if (moment(body.prazo_f, "DD/MM/YYYY").format() < moment(body.prazo_i, "DD/MM/YYYY").format()) {
                throw `O prazo inicial (${body.prazo_f}) não pode ser anterior à data do prazo final (${body.prazo_i})`
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
        const uParams = await app.db("users").where({ id: user.id }).first();
        let body = { ...req.body };
        try {
          // Alçada para edição
          isMatchOrError(uParams && uParams.cad_servidores >= 3, `${noAccessMsg} "Edição de ${tabela}"`);
        } catch (error) {
          return res.status(401).send(error);
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`;
        const tabelaServidoresDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.servidores`;
        const { changeUpperCase, removeAccentsObj } = app.api.facilities;
        const bodyRaw = convertESocialTextToJson(req.body);
        // return res.send(bodyRaw)
        body = [];
        const respError = [];
        const respSuccess = [];
        const id_serv = await app.db(tabelaServidoresDomain).select('id').where({ cpf_trab: bodyRaw.cpfTrab_13 }).first();
        let ocorrencias = countOccurrences(JSON.stringify(bodyRaw), 'INCLUIRDEPENDENTE_91') + 
                            countOccurrences(JSON.stringify(bodyRaw), 'INCLUIRDEPENDENTE_91') +
                            countOccurrences(JSON.stringify(bodyRaw), 'INCLUIRDEPENDENTE_91');
        if (bodyRaw.INCLUIRDEPENDENTE_91 && Array.isArray(bodyRaw.INCLUIRDEPENDENTE_91)) ocorrencias = bodyRaw.INCLUIRDEPENDENTE_91.length;
        else if (bodyRaw.INCLUIRDEPENDENTE_91 && Array.isArray(bodyRaw.INCLUIRDEPENDENTE_91)) ocorrencias = bodyRaw.INCLUIRDEPENDENTE_91.length;
        else if (bodyRaw.INCLUIRDEPENDENTE_91 && Array.isArray(bodyRaw.INCLUIRDEPENDENTE_91)) ocorrencias = bodyRaw.INCLUIRDEPENDENTE_91.length;
        console.log(ocorrencias);
        if (id_serv && id_serv.id && ocorrencias > 0) {
          for (let index = 0; index < ocorrencias; index++) {
            if ((bodyRaw.cpfDep_95 || (ocorrencias > 1 && bodyRaw.cpfDep_95[index]))) {
              body.push({
                id_serv: id_serv.id,
                id_param_tp_dep: (bodyRaw.tpDep_92) ? await getIdParam("tpDep", ocorrencias == 1 ? bodyRaw.tpDep_92[index] : bodyRaw.tpDep_92[index]) : undefined,
                nome: ocorrencias > 1 ? bodyRaw.nmDep_93[index] : bodyRaw.nmDep_93,
                data_nasc: ocorrencias > 1 ? bodyRaw.dtNascto_251[index] : bodyRaw.dtNascto_251,
                cpf: ocorrencias > 1 ? bodyRaw.cpfDep_95[index] : bodyRaw.cpfDep_95,
                dep_irrf: ocorrencias > 1 ? bodyRaw.depIRRF_96[index] : bodyRaw.depIRRF_96,
                dep_sf: ocorrencias > 1 ? bodyRaw.depSF_97[index] : bodyRaw.depSF_97,
                id_param_sexo: (bodyRaw.sexoDep_252) ? await getIdParam("sexo", ocorrencias > 1 ? bodyRaw.sexoDep_252[index] : bodyRaw.sexoDep_252) : undefined,
                inc_trab: ocorrencias > 1 ? bodyRaw.incTrab_99[index] : bodyRaw.incTrab_99,
                // Os dados a seguir deverão ser capturados no banco de dados e enviados pelo PonteCasV2
                dt_limite_prev: ocorrencias > 1 ? bodyRaw.dt_limite_prev[index] : bodyRaw.dt_limite_prev,
                dt_limite_irpf: ocorrencias > 1 ? bodyRaw.dt_limite_irpf[index] : bodyRaw.dt_limite_irpf,
                certidao: ocorrencias > 1 ? bodyRaw.certidao[index] : bodyRaw.certidao,
                cert_livro: ocorrencias > 1 ? bodyRaw.cert_livro[index] : bodyRaw.cert_livro,
                cert_folha: ocorrencias > 1 ? bodyRaw.cert_folha[index] : bodyRaw.cert_folha,
                dt_cert: ocorrencias > 1 ? bodyRaw.dt_cert[index] : bodyRaw.dt_cert,
                cart_vacinacao: ocorrencias > 1 ? bodyRaw.cart_vacinacao[index] : bodyRaw.cart_vacinacao,
                declaracao_escolar: ocorrencias > 1 ? bodyRaw.declaracao_escolar[index] : bodyRaw.declaracao_escolar,
              });
              console.log(body[index]);
            }
          }
    
          for (let index = 0; index < body.length; index++) {
            let element = body[index];
            if (element.cpf) {
              try {
                existsOrError(element.nome, "Nome não informado");
                const tpl = await app.db(tabelaDomain).where({ id_serv: element.id_serv, cpf: element.cpf }).first();
                if (tpl && tpl.id) element.id = tpl.id;
                existsOrError(element.id_param_tp_dep, "Tipo do Dependente não informado");
                existsOrError(await isParamOrError("tpDep", element.id_param_tp_dep), "Tipo do Dependente selecionado não existe");
                existsOrError(element.nome, "Nome não informado");
                existsOrError(element.data_nasc, "Data de Nascimento não informada");
    
                if (moment(element.data_nasc, "DD/MM/YYYY") < moment("1890-01-01"))
                  throw `A data de nascimento (${element.data_nasc}) não pode ser anterior à (01/01/1890)`;
    
                existsOrError(element.id_param_sexo, "Sexo não informado");
                existsOrError(await isParamOrError("sexo", element.id_param_sexo), "Sexo selecionado não existe");
                existsOrError(element.dep_irrf, "Dedução pelo Imposto de Renda não informado");
                existsOrError(element.dep_sf, "Recebimento do Salário Família não informado");
                existsOrError(element.inc_trab, "Incapacidade Física ou Mental não informada");
                // existsOrError(element.dt_limite_prev, 'Data Limite Previdência não informada')
                // existsOrError(element.dt_limite_irpf, 'Data Limite IRPF não informada')
                // existsOrError(element.certidao, 'Certidão não informada')
                // existsOrError(element.cert_livro, 'Livro não informada')
                // existsOrError(element.cert_folha, 'Folha não informada')
                // existsOrError(element.dt_cert, 'Data da Certidão não informada')
                // existsOrError(element.cart_vacinacao, 'Cartão de Vacinação não informado')
                // existsOrError(element.declaracao_escolar, 'Declaração Escolar não informada')
                if (element.dep_irrf == 1) {
                  existsOrError(element.cpf, "Se há Dedução pelo Imposto de Renda(IRRF) o CPF deverá ser informado");
                  cpfOrError(element.cpf, "CPF inválido");
                  const depExists = await app.db(tabelaDomain).where({ cpf: element.cpf })
                    .where(app.db.raw(`id_serv != ${element.id_serv}`)).first();
                  notExistsOrError(depExists, "CPF de dependente já informado para outro servidor");
                }
              } catch (error) {
                respError.push(`Erro em dependente ${element.nome}: ${error}`)
              }
    
              element = JSON.parse(JSON.stringify(element), removeAccentsObj);
              element = JSON.parse(JSON.stringify(element), changeUpperCase);
              if (element.id) {
                // Variáveis da edição de um registro
                // registrar o evento na tabela de eventos
                const { createEventUpd } = app.api.sisEvents;
                const evento = await createEventUpd({
                  notTo: ["created_at", "evento"],
                  last: await app.db(tabelaDomain).where({ id: element.id }).first(),
                  next: element,
                  request: req,
                  evento: {
                    evento: `Alteração de cadastro de ${tabela}`,
                    tabela_bd: tabela,
                  },
                });
    
                element.evento = evento;
                element.updated_at = new Date();
    
                await app
                  .db(tabelaDomain)
                  .update(element)
                  .where({ id: element.id })
                  .then((ret) => {
                    if (ret > 0) respSuccess.push(element);
                    else respError.push({ 'dependente': element.nome, 'error': element })
                  })
                  .catch((error) => {
                    app.api.logger.logError({
                      log: {
                        line: `Error in file: ${__filename}.${__function} ${error}`,
                        sConsole: true,
                      },
                    });
                    respError.push({ 'dependente': element.nome, 'error': error })
                  });
              } else {
                // Criação de um novo registro
                const nextEventID = await app
                  .db("sis_events")
                  .select(app.db.raw("count(*) as count"))
                  .first();
                element.evento = nextEventID.count + 1;
                element.status = STATUS_ACTIVE;
                element.created_at = new Date();
    
                await app
                  .db(tabelaDomain)
                  .insert(element)
                  .then((ret) => {
                    element.id = ret[0];
                    // registrar o evento na tabela de eventos
                    const { createEventIns } = app.api.sisEvents;
                    createEventIns({
                      notTo: ["created_at", "evento"],
                      next: element,
                      request: req,
                      evento: {
                        evento: `Novo registro`,
                        tabela_bd: tabela,
                      },
                    });
                    respSuccess.push(element);
                  })
                  .catch((error) => {
                    app.api.logger.logError({
                      log: {
                        line: `Error in file: ${__filename}.${__function} ${error}`,
                        sConsole: true,
                      },
                    });
                    respError.push({ 'dependente': element.nome, 'error': error })
                  });
              }
            }
          }
        }
        return res.send({ success: respSuccess, errors: respError });
      };

    const limit = 20 // usado para paginação
    const get = async (req, res) => {
        let user = req.user
        const id_serv_vinc = req.params.id_serv_vinc
        const key = req.query.key ? req.query.key : ''
        const uParams = await app.db('users').where({ id: user.id }).first();
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
                return res.status(500).send(error)
            })
    }

    const getById = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
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
                return res.status(500).send(error)
            })
    }

    const remove = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
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