const moment = require("moment");
const randomstring = require("randomstring");
const { dbPrefix } = require("../.env");

module.exports = (app) => {
  const { existsOrError, isMatchOrError, noAccessMsg, isParamOrError } =
    app.api.validation;
  const { convertESocialTextToJson } = app.api.facilities;
  const tabela = "fin_rubricas";
  const tabelaParams = "params";
  const STATUS_ACTIVE = 10;
  const STATUS_DELETE = 99;

  const save = async (req, res) => {
    let user = req.user;
    const uParams = await app
      .db({ u: "users" })
      .join({ e: "empresa" }, "u.id_emp", "=", "e.id")
      .select("u.*", "e.cliente", "e.dominio")
      .where({ "u.id": user.id })
      .first();
    let body = { ...req.body };
    if (req.params.id) body.id = req.params.id;
    const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`;
    try {
      // Alçada para edição
      if (body.id)
        isMatchOrError(
          uParams && uParams.financeiro >= 3,
          `${noAccessMsg} "Edição de ${tabela}"`
        );
      // Alçada para inclusão
      else
        isMatchOrError(
          uParams && uParams.financeiro >= 1,
          `${noAccessMsg} "Inclusão de ${tabela}"`
        );
    } catch (error) {
      return res.status(401).send(error);
    }
    const contentType = req.headers["content-type"];
    if (contentType == "text/plain") {
      const bodyRaw = convertESocialTextToJson(req.body);
      body = {};
      const tpl = await app
        .db(tabelaDomain)
        .where({ cod_rubr: bodyRaw.codRubr_13 })
        .first();
      if (tpl && tpl.id) {
        body.id = tpl.id;
      }
      body.cod_rubr = bodyRaw.codRubr_13;
      body.ini_valid = bodyRaw.iniValid_15 || bodyRaw.iniValid_44;
      body.dsc_rubr = bodyRaw.dscRubr_18;
      body.id_param_cod_inc_cprp =
        bodyRaw.codIncCPRP_35 || bodyRaw.codIncCPRP_47;
      try {
        if (
          (id = await app
            .db(tabelaParams)
            .select("id")
            .where({ meta: "natRubrica", value: bodyRaw.natRubr_19 })
            .first()) != null
        )
          body.id_param_nat_rubr = id.id;
        else throw "Natureza da Rubrica não encontrada " + bodyRaw.natRubr_19;
        if (
          (id = await app
            .db(tabelaParams)
            .select("id")
            .where({ meta: "tpRubrica", value: bodyRaw.tpRubr_20 })
            .first()) != null
        )
          body.id_param_tipo = id.id;
        else throw "Tipo da Rubrica não encontrada " + bodyRaw.tpRubr_20;
        if (
          (id = await app
            .db(tabelaParams)
            .select("id")
            .where({ meta: "codIncCP", value: bodyRaw.codIncCP_21 })
            .first()) != null
        )
          body.id_param_cod_inc_cp = id.id;
        else
          throw (
            "Código de Incidência Tributária não encontrada " +
            bodyRaw.codIncCP_21
          );
        if (
          (id = await app
            .db(tabelaParams)
            .select("id")
            .where({ meta: "codIncIRRF", value: bodyRaw.codIncIRRF_22 })
            .first()) != null
        )
          body.id_param_cod_inc_irrf = id.id;
        else throw "Código IRRF não encontrada " + bodyRaw.codIncIRRF_22;
        if (
          (id = await app
            .db(tabelaParams)
            .select("id")
            .where({ meta: "codIncFGTS", value: bodyRaw.codIncFGTS_23 })
            .first()) != null
        )
          body.id_param_cod_inc_fgts = id.id;
        else throw "Código FGTS não encontrada " + bodyRaw.codIncFGTS_23;
        if (
          (id = await app
            .db(tabelaParams)
            .select("id")
            .where({ meta: "codIncCPRP", value: body.id_param_cod_inc_cprp })
            .first()) != null
        )
          body.id_param_cod_inc_cprp = id.id;
        else throw "Código CPRP não encontrada " + bodyRaw.codIncCPRP_35;
      } catch (error) {
        app.api.logger.logError({
          log: {
            line: `Erro no salvamento da rubrica ${body.cod_rubr} via PonteCash: ${error}`,
            sConsole: true,
          },
        });
      }
      body.teto_remun = bodyRaw.tetoRemun_36 || bodyRaw.tetoRemun_48 || "N";
      body.consignado = "0";
      body.consignavel = "1";
    }

    body.id_emp = req.params.id_emp;
    try {
      existsOrError(body.id_emp, "Órgão não informado");
      existsOrError(body.cod_rubr, "Código da Rúbrica não informado");
      existsOrError(body.ini_valid, "Inicio da válidade não informada");
      existsOrError(body.dsc_rubr, "Descrição da Rúbrica não informada");
      existsOrError(
        body.id_param_nat_rubr,
        "Natureza da Rúbrica não informada"
      );
      existsOrError(
        await isParamOrError("natRubrica", body.id_param_nat_rubr),
        "Natureza da Rúbrica selecionada não existe"
      );
      existsOrError(body.id_param_tipo, "Tipo da Rúbrica não informado");
      existsOrError(
        await isParamOrError("tpRubrica", body.id_param_tipo),
        "Tipo da Rúbrica selecionada não existe"
      );
      existsOrError(
        body.id_param_cod_inc_cp,
        "Código de Incidência Tributária não informado"
      );
      existsOrError(
        await isParamOrError("codIncCP", body.id_param_cod_inc_cp),
        "Código de Incidência Tributária selecionado não existe"
      );
      existsOrError(body.id_param_cod_inc_irrf, "Código IRRF não informado");
      existsOrError(
        await isParamOrError("codIncIRRF", body.id_param_cod_inc_irrf),
        "Código IRRF selecionado não existe"
      );
      existsOrError(body.id_param_cod_inc_fgts, "Código FGTS não informado");
      existsOrError(
        await isParamOrError("codIncFGTS", body.id_param_cod_inc_fgts),
        "Código FGTS selecionado não existe"
      );
      existsOrError(body.id_param_cod_inc_cprp, "Código CPRP não informado");
      existsOrError(
        await isParamOrError("codIncCPRP", body.id_param_cod_inc_cprp),
        "Código CPRP selecionado não existe"
      );
      existsOrError(body.teto_remun, "Teto Remuneratório não informado");
      existsOrError(body.consignado, "Consignado não informado");
      existsOrError(body.consignavel, "Consignável não informado");
      //existsOrError(body.observacao, 'Observação não informado')
    } catch (error) {
      if (contentType != "text/plain") return res.status(400).send(error);
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

      body.evento = evento;
      body.updated_at = new Date();
      let rowsUpdated = app
        .db(tabelaDomain)
        .update(body)
        .where({ id: body.id });
      rowsUpdated
        .then((ret) => {
          if (ret > 0) res.status(200).send(body);
          else res.status(200).send("Rúbrica não encontrada");
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
      // Variáveis da criação de um novo registro
      body.status = STATUS_ACTIVE;
      body.created_at = new Date();

      app
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

  const get = async (req, res) => {
    let user = req.user;
    const id_emp = req.params.id_emp;
    const key = req.query.key ? req.query.key : "";
    const uParams = await app
      .db({ u: "users" })
      .join({ e: "empresa" }, "u.id_emp", "=", "e.id")
      .select("u.*", "e.cliente", "e.dominio")
      .where({ "u.id": user.id })
      .first();
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

    const ret = app
      .db({ tbl1: tabelaDomain })
      .where({ status: STATUS_ACTIVE, id_emp: req.params.id_emp })
      .where(function () {
        this.where(
          app.db.raw(
            `tbl1.cod_rubr regexp('${key.toString().replace(" ", ".+")}')`
          )
        );
        this.orWhere(
          app.db.raw(
            `tbl1.dsc_rubr regexp('${key.toString().replace(" ", ".+")}')`
          )
        );
      });
    ret.orderBy("cod_rubr");
    ret
      .then((body) => {
        return res.json({ data: body });
      })
      .catch((error) => {
        app.api.logger.logError({
          log: {
            line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`,
            sConsole: true,
          },
        });

        app.api.logger.logError({
          log: {
            line: `Error in file: ${__filename}.${__function} ${error}`,
            sConsole: true,
          },
        });
        return res.status(500).send(error);
      });
  };

  const getById = async (req, res) => {
    let user = req.user;
    const uParams = await app
      .db({ u: "users" })
      .join({ e: "empresa" }, "u.id_emp", "=", "e.id")
      .select("u.*", "e.cliente", "e.dominio")
      .where({ "u.id": user.id })
      .first();
    try {
      // Alçada para exibição
      isMatchOrError(
        uParams && uParams.admin >= 1,
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
        id_emp: req.params.id_emp,
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
    const uParams = await app
      .db({ u: "users" })
      .join({ e: "empresa" }, "u.id_emp", "=", "e.id")
      .select("u.*", "e.cliente", "e.dominio")
      .where({ "u.id": user.id })
      .first();
    try {
      // Alçada para exibição
      isMatchOrError(
        uParams && uParams.admin >= 1,
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
        .where({ id_emp: req.params.id_emp, id: req.params.id });
      existsOrError(rowsUpdated, "Registro não foi encontrado");

      res.status(204).send();
    } catch (error) {
      res.status(400).send(error);
    }
  };
  return { save, get, getById, remove };
};
