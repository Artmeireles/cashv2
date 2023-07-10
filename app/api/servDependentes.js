const moment = require("moment");
const randomstring = require("randomstring");
const { dbPrefix } = require("../.env");

module.exports = (app) => {
  const {
    existsOrError,
    existsOrMsgError,
    notExistsOrError,
    notExistsOrMsgError,
    cpfOrError,
    cpfOrMsgError,
    isMatchOrError,
    noAccessMsg,
    isParamOrError,
  } = app.api.validation;
  const { mailyCliSender } = app.api.mailerCli;
  const { convertESocialTextToJson, getIdParam } = app.api.facilities;
  const tabela = "serv_dependentes";
  const STATUS_ACTIVE = 10;
  const STATUS_DELETE = 99;

  const save = async (req, res) => {
    let user = req.user;
    const uParams = await app.db("users").where({ id: user.id }).first();
    let body = { ...req.body };
    delete body.id
    const id_serv = req.params.id_serv;
    if (req.params.id) body.id = req.params.id;
    try {
      // Alçada para edição
      if (body.id)
        isMatchOrError(
          uParams && uParams.cad_servidores >= 1,
          `${noAccessMsg} "Edição de ${tabela}"`
        );
      // Alçada para inclusão
      else
        isMatchOrError(
          uParams && uParams.cad_servidores >= 1,
          `${noAccessMsg} "Inclusão de ${tabela}"`
        );
    } catch (error) {
      return res.status(401).send(error);
    }
    const contentType = req.headers["content-type"];
    if (contentType == "text/plain") {
      return saveBatch(req, res);
    }

    // return res.send(body)
    const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`;

    try {
      existsOrError(body.id_param_tp_dep, "Tipo do Dependente não informado");
      existsOrError(
        await isParamOrError("tpDep", body.id_param_tp_dep),
        "Tipo do Dependente selecionado não existe"
      );
      existsOrError(body.nome, "Nome não informado");
      existsOrError(body.data_nasc, "Data de Nascimento não informada");

      if (moment(body.data_nasc, "DD/MM/YYYY") < moment("1890-01-01")) {
        throw `A data de nascimento (${body.data_nasc}) não pode ser anterior à (01/01/1890)`;
      }
      existsOrError(body.id_param_sexo, "Sexo não informado");
      existsOrError(
        await isParamOrError("sexo", body.id_param_sexo),
        "Sexo selecionado não existe"
      );
      existsOrError(
        body.dep_irrf,
        "Dedução pelo Imposto de Renda não informado"
      );
      existsOrError(
        body.dep_sf,
        "Recebimento do Salário Família não informado"
      );
      existsOrError(
        body.inc_trab,
        "Incapacidade Física ou Mental não informada"
      );
      // existsOrError(body.dt_limite_prev,"Data Limite Previdência não informada");
      //existsOrError(body.dt_limite_prev, 'Data Limite Previdência não informada')
      //existsOrError(body.dt_limite_irpf, 'Data Limite IRPF não informada')
      // existsOrError(body.certidao, 'Certidão não informada')
      // existsOrError(body.cert_livro, 'Livro não informada')
      // existsOrError(body.cert_folha, 'Folha não informada')
      // existsOrError(body.dt_cert, 'Data da Certidão não informada')
      // existsOrError(body.cart_vacinacao, 'Cartão de Vacinação não informado')
      // existsOrError(body.declaracao_escolar, 'Declaração Escolar não informada')
      if (body.dep_irrf == 1) {
        existsOrError(
          body.cpf,
          "Se há Dedução pelo Imposto de Renda(IRRF) o CPF deverá ser informado"
        );
        cpfOrError(body.cpf, "CPF inválido");
        const depExists = await app
          .db(tabelaDomain)
          .where({ cpf: body.cpf })
          .where(app.db.raw(`id_serv != ${id_serv}`))
          .first();
        notExistsOrError(
          depExists,
          "CPF de dependente já informado para outro servidor"
        );
      }
    } catch (error) {
      return res.status(400).send(error);
    }

    delete body.hash;

    const { changeUpperCase, removeAccentsObj } = app.api.facilities;
    body = JSON.parse(JSON.stringify(body), removeAccentsObj);
    body = JSON.parse(JSON.stringify(body), changeUpperCase);
    if (body.id) {
      // Variáveis da edição de um registro
      // registrar o evento na tabela de eventos
      const { createEventUpd } = app.api.sisEvents;
      const evento = await createEventUpd({
        notTo: ["created_at", "evento"],
        last: await app.db(tabelaDomain).where({ id: body.id }).first(),
        next: body,
        request: req,
        evento: {
          evento: `Alteração de cadastro de ${tabela}`,
          tabela_bd: tabela,
        },
      });

      body.evento = evento;
      body.updated_at = new Date();

      let rowsUpdated = app
        .db(tabelaDomain)
        .update(body)
        .where({ id: body.id })      
        .then((ret) => {
          if (ret > 0) res.status(200).send(body);
          else res.status(200).send("Rúbrica não foi encontrada");
        })
        .catch((error) => {
          app.api.logger.logError({
            log: {
              line: `Error in file: ${__filename}.${__function} ${error}`,
              sConsole: true,
            },
          });
          return res.status(500).send(error);
        });
    } else {
      // Criação de um novo registro
      const nextEventID = await app
        .db("sis_events")
        .select(app.db.raw("count(*) as count"))
        .first();
      body.evento = nextEventID.count + 1;
      body.status = STATUS_ACTIVE;
      body.created_at = new Date();
      body.id_serv = id_serv;

      await app
        .db(tabelaDomain)
        .insert(body)
        .then((ret) => {
          body.id = ret[0];
          // registrar o evento na tabela de eventos
          const { createEventIns } = app.api.sisEvents;
          createEventIns({
            notTo: ["created_at", "evento"],
            next: body,
            request: req,
            evento: {
              evento: `Novo registro`,
              tabela_bd: tabela,
            },
          });
          return res.json(body);
        })
        .catch((error) => {
          app.api.logger.logError({
            log: {
              line: `Error in file: ${__filename}.${__function} ${error}`,
              sConsole: true,
            },
          });
          return res.status(500).send(error);
        });
    }
  };

  const saveBatch = async (req, res) => {
    let user = req.user;
    const uParams = await app.db("users").where({ id: user.id }).first();
    let body = { ...req.body };
    const id_serv = req.params.id_serv;
    try {
      // Alçada para edição
      isMatchOrError(
        uParams && uParams.cad_servidores >= 3,
        `${noAccessMsg} "Edição de ${tabela}"`
      );
    } catch (error) {
      return res.status(401).send(error);
    }
    const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`;
    const { changeUpperCase, removeAccentsObj } = app.api.facilities;
    const bodyRaw = convertESocialTextToJson(req.body);
    body = [];
    for (let index = 0; index < bodyRaw.INCLUIRDEPENDENTE_91.length; index++) {
      body.push({
        id_param_tp_dep: await getIdParam("tpDep", bodyRaw.tpDep_92[index]),
        nome: bodyRaw.nmDep_93[index],
        data_nasc: bodyRaw.dtNascto_251[index],
        cpf: bodyRaw.cpfDep_95[index],
        dep_irrf: bodyRaw.depIRRF_96[index],
        dep_sf: bodyRaw.depSF_97[index],
        id_param_sexo: await getIdParam("sexo", bodyRaw.sexoDep_252[index]),
        inc_trab: bodyRaw.incTrab_99[index],
        // Os dados a seguir deverão ser capturados no banco de dados e enviados pelo PonteCasV2
        // body.dt_limite_prev = bodyRaw.
        // body.dt_limite_irpf = bodyRaw.
        // body.certidao = bodyRaw.
        // body.cert_livro = bodyRaw.
        // body.cert_folha = bodyRaw.
        // body.dt_cert = bodyRaw.
        // body.cart_vacinacao = bodyRaw.
        // body.declaracao_escolar = bodyRaw.
      });
    }
    const respError = [];
    const respSuccess = [];

    for (let index = 0; index < body.length; index++) {
      let element = body[index];
      try {
        let erros = "";
        existsOrError(element.nome, "Nome não informado");
        cpfOrError(element.cpf, "CPF inválido");

        const tpl = await app
          .db(tabelaDomain)
          .where({ id_serv: id_serv, cpf: element.cpf })
          .first();
        if (tpl && tpl.id) {
          element.id = tpl.id;
        }

        existsOrError(
          element.id_param_tp_dep,
          "Tipo do Dependente não informado"
        );
        existsOrError(
          await isParamOrError("tpDep", element.id_param_tp_dep),
          "Tipo do Dependente selecionado não existe"
        );
        existsOrError(element.nome, "Nome não informado");
        existsOrError(element.data_nasc, "Data de Nascimento não informada");

        if (moment(element.data_nasc, "DD/MM/YYYY") < moment("1890-01-01")) {
          erros += `A data de nascimento (${element.data_nasc}) não pode ser anterior à (01/01/1890)`;
        }
        existsOrError(element.id_param_sexo, "Sexo não informado");
        existsOrError(
          await isParamOrError("sexo", element.id_param_sexo),
          "Sexo selecionado não existe"
        );
        existsOrError(
          element.dep_irrf,
          "Dedução pelo Imposto de Renda não informado"
        );
        existsOrError(
          element.dep_sf,
          "Recebimento do Salário Família não informado"
        );
        existsOrError(
          element.inc_trab,
          "Incapacidade Física ou Mental não informada"
        );
        // existsOrError(element.dt_limite_prev, 'Data Limite Previdência não informada')
        // existsOrError(element.dt_limite_irpf, 'Data Limite IRPF não informada')
        // existsOrError(element.certidao, 'Certidão não informada')
        // existsOrError(element.cert_livro, 'Livro não informada')
        // existsOrError(element.cert_folha, 'Folha não informada')
        // existsOrError(element.dt_cert, 'Data da Certidão não informada')
        // existsOrError(element.cart_vacinacao, 'Cartão de Vacinação não informado')
        // existsOrError(element.declaracao_escolar, 'Declaração Escolar não informada')
        if (element.dep_irrf == 1) {
          existsOrError(
            element.cpf,
            "Se há Dedução pelo Imposto de Renda(IRRF) o CPF deverá ser informado"
          );
          cpfOrError(element.cpf, "CPF inválido");
          const depExists = await app
            .db(tabelaDomain)
            .where({ cpf: element.cpf })
            .where(app.db.raw(`id_serv != ${element.id_serv}`))
            .first();
          notExistsOrError(
            depExists,
            "CPF de dependente já informado para outro servidor"
          );
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
            console.log(ret);
            if (ret > 0) respSuccess.push(element);
            else respError.push({'dependente': element.nome, 'error': element})
          })
          .catch((error) => {
            app.api.logger.logError({
              log: {
                line: `Error in file: ${__filename}.${__function} ${error}`,
                sConsole: true,
              },
            });
            respError.push({'dependente': element.nome, 'error': error})
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
        element.id_serv = id_serv;

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
            respError.push({'dependente': element.nome, 'error': error})
          });
      }
    }
    return res.send({success: respSuccess, erros: respError});
  };

  const limit = 5; // usado para paginação
  const get = async (req, res) => {
    let user = req.user;
    const id_serv = req.params.id_serv;
    const key = req.query.key ? req.query.key : "";
    const uParams = await app.db("users").where({ id: user.id }).first();
    try {
      // Alçada para exibição
      isMatchOrError(
        uParams && uParams.financeiro >= 1,
        `${noAccessMsg} "Exibição de financeiros"`
      );
    } catch (error) {
      return res.status(401).send(error);
    }
    const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`;

    const page = req.query.page || 1;

    let sql = app
      .db({ tbl1: tabelaDomain })
      .count("tbl1.id", { as: "count" })
      .where({ status: STATUS_ACTIVE, id_serv: req.params.id_serv })
      .where(function () {
        this.where(
          app.db.raw(`tbl1.nome regexp('${key.toString().replace(" ", ".+")}')`)
        );
      });
    sql = await app.db.raw(sql.toString());
    const count = sql[0][0].count;

    const ret = app
      .db({ tbl1: tabelaDomain })
      .where({ status: STATUS_ACTIVE, id_serv: req.params.id_serv })
      .where(function () {
        this.where(
          app.db.raw(`tbl1.nome regexp('${key.toString().replace(" ", ".+")}')`)
        );
      });
    ret
      .orderBy("nome")
      .limit(limit)
      .offset(page * limit - limit);
    ret
      .then((body) => {
        return res.json({ data: body, count, limit });
      })
      .catch((error) => {
        app.api.logger.logError({
          log: {
            line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`,
            sConsole: true,
          },
        });
        return res.status(500).send(error);
      });
  };

  const getById = async (req, res) => {
    let user = req.user;
    const uParams = await app.db("users").where({ id: user.id }).first();
    try {
      // Alçada para exibição
      isMatchOrError(
        uParams && uParams.cad_servidores >= 1,
        `${noAccessMsg} "Exibição de cadastro de ${tabela}"`
      );
    } catch (error) {
      return res.status(401).send(error);
    }

    const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`;
    const ret = app
      .db({ tbl1: tabelaDomain })
      .select(
        app.db.raw(`tbl1.*, SUBSTRING(SHA(CONCAT(id,'${tabela}')),8,6) as hash`)
      )
      .where({
        id_serv: req.params.id_serv,
        id: req.params.id,
        status: STATUS_ACTIVE,
      })
      .first()
      .then((body) => {
        return res.json(body);
      })
      .catch((error) => {
        app.api.logger.logError({
          log: {
            line: `Error in file: ${__filename}.${__function} ${error}`,
            sConsole: true,
          },
        });
        return res.status(500).send(error);
      });
  };

  const remove = async (req, res) => {
    let user = req.user;
    const uParams = await app.db("users").where({ id: user.id }).first();
    try {
      // Alçada para exibição
      isMatchOrError(
        uParams && uParams.cad_servidores >= 1,
        `${noAccessMsg} "Exclusão de cadastro de ${tabela}"`
      );
    } catch (error) {
      return res.status(401).send(error);
    }
    const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`;
    const registro = { status: STATUS_DELETE };
    try {
      // registrar o evento na tabela de eventos
      const last = await app
        .db(tabelaDomain)
        .where({ id: req.params.id })
        .first();
      const { createEventUpd } = app.api.sisEvents;
      const evento = await createEventUpd({
        notTo: ["created_at", "evento"],
        last: last,
        next: registro,
        request: req,
        evento: {
          classevento: "Remove",
          evento: `Exclusão de cadastro de ${tabela}`,
          tabela_bd: tabela,
        },
      });
      const rowsUpdated = await app
        .db(tabelaDomain)
        .update({
          status: registro.status,
          updated_at: new Date(),
          evento: evento,
        })
        .where({ id_serv: req.params.id_serv, id: req.params.id });
      existsOrError(rowsUpdated, "Registro não foi encontrado");

      res.status(204).send();
    } catch (error) {
      res.status(400).send(error);
    }
  };
  return { save, get, getById, remove };
};
