const moment = require("moment");
const randomstring = require("randomstring");
const { dbPrefix } = require("../.env");

module.exports = (app) => {
  moment().locale("pt-br");
  const {
    existsOrError,
    notExistsOrError,
    equalsOrError,
    isValidEmail,
    isMatchOrError,
    noAccessMsg,
  } = app.api.validation;
  const { mailyCliSender } = app.api.mailerCli;
  const {
    convertESocialTextToJson,
    countOccurrences,
    getRawValueFromKeyPairString,
    getValueFromKeyPairString,
    getIdParam,
    getIdRubricas,
  } = app.api.facilities;
  const tabela = "remuneracao";
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
    const body = { ...req.body };
    delete body.id_vinculo; /* Pode ser ativo ou beneficiário */
    body.id_vinculo =
      req.params.id_vinculo; /* Pode ser ativo ou beneficiário */
    if (req.params.id) body.id = req.params.id;
    try {
      // Alçada para edição
      if (body.id)
        isMatchOrError(
          uParams && uParams.cad_servidores >= 3,
          `${noAccessMsg} "Edição de ${tabela}"`
        );
      // Alçada para inclusão
      else
        isMatchOrError(
          uParams && uParams.cad_servidores >= 2,
          `${noAccessMsg} "Inclusão de ${tabela}"`
        );
    } catch (error) {
      return res.status(401).send(error);
    }

    // Se a requisicao for do tipo text/plain, enviar para o saveBatch
    const contentType = req.headers["content-type"];
    if (contentType == "text/plain") {
      return saveBatch(req, res);
    }

    const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`;

    try {
      existsOrError(
        body.id_remun_param,
        "Parâmetros da Remuneração não informada"
      );
      existsOrError(body.id_rubrica, "Rúbrica não informada");
      existsOrError(body.id_ad_fg, "Tipo da Remuneração não informado");
      existsOrError(body.qtd_rubr, "Quantidade não informada");
      existsOrError(body.fator_rubr, "Fator da Rúbrica não informada");
      existsOrError(body.valor_rubr, "Valor da Rúbrica não informada");
      existsOrError(body.ind_apur_ir, "Indicativo de Apuração não informado");
      existsOrError(body.prazo_i, "Prazo Inicial não informado");
      existsOrError(body.prazo_f, "Prazo Final não informado");
      if (
        moment(body.prazo_f, "DD/MM/YYYY").format() <
        moment(body.prazo_i, "DD/MM/YYYY").format()
      ) {
        throw `O prazo inicial (${body.prazo_f}) não pode ser anterior à data do prazo final (${body.prazo_i})`;
      }
    } catch (error) {
      return res.status(400).send(error);
    }
    delete body.hash;

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
        .where({ id: body.id });
      rowsUpdated
        .then((ret) => {
          if (ret > 0) res.status(200).send(body);
          else res.status(200).send("O Parâmetro não foi encontrado");
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
    const uParams = await app
      .db({ u: "users" })
      .join({ e: "empresa" }, "u.id_emp", "=", "e.id")
      .select("u.*", "e.cliente", "e.dominio")
      .where({ "u.id": user.id })
      .first();
    try {
      // Alçada para edição
      isMatchOrError(
        uParams && uParams.cad_servidores >= 3,
        `${noAccessMsg} "Edição de ${tabela}"`
      );
    } catch (error) {
      return res.status(401).send(error);
    }

    const { changeUpperCase, removeAccentsObj } = app.api.facilities;

    const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`;
    const tabelaServidoresDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.servidores`;
    const tabelaServVinculoDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.serv_vinculos`;
    const tabelaRemunParamDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.remun_params`;

    const bodyString = req.body.toString();
    const lines = bodyString.split(/\r?\n/);
    const bodyRubricas = [];
    let countInsert = 0;
    let countUpdate = 0;
    let errorsMsg = [];
    // Variáveis de controle
    let beneficiario = false;
    let perApur = null;
    let remunParam = null;
    let cpfTrab = null;
    let codCateg = null;
    let matricula = null;
    let servVinc = {};
    // Variáveis de remuneração
    let grauExp = null;
    let codRubr = null;
    let qtdRubr = null;
    let fatorRubr = null;
    let vrRubr = null;
    let indApurIR = null;

    for (const line of lines) {
      if (line.startsWith("INCLUIRS1207")) beneficiario = true;
      else if (line.startsWith("perApur")) {
        perApur = line.split("=")[1];
        if (perApur.length == 4) perApur += "-12";
        let paramRemun = {
          ano: perApur.substring(0, 4),
          mes: perApur.substring(5, 7) ? perApur.substring(5, 7) : "13",
          complementar: "000",
        };
        remunParam = await app
          .db(tabelaRemunParamDomain)
          .where(paramRemun)
          .first();
        if (remunParam) remunParam = remunParam.id;
        else {
          paramRemun = {
            ...paramRemun,
            status: STATUS_ACTIVE,
            evento: 1,
            created_at: new Date(),
            ano_inf: perApur.substring(0, 4),
            mes_inf: perApur.substring(5, 7) ? perApur.substring(5, 7) : "13",
            complementar_inf: "000",
            descricao: `Remuneração ${perApur} criada dinamicamente na inclusão de um evento de remuneração do eSocial pelo PonteCashV2`,
          };
          remunParam = await app.db(tabelaRemunParamDomain).insert(paramRemun);
          remunParam = remunParam[0];
        }
      } else if (line.startsWith("cpfTrab_") || line.startsWith("cpfBenef_")) {
        cpfTrab = line.split("=")[1];
      } else if (line.startsWith("codCateg_")) {
        codCateg = await getIdParam("codCateg", line.split("=")[1]);
      } else if (line.startsWith("matricula_")) {
        matricula = line.split("=")[1];
      } else if (line.startsWith("grauExp_")) {
        grauExp = await getIdParam("grauExp", line.split("=")[1]);
      } else if (line.startsWith("codRubr_")) {
        codRubr = await getIdRubricas(
          line.split("=")[1],
          { cliente: uParams.cliente, dominio: uParams.dominio },
          perApur
        );
        if (!codRubr) {
          errorsMsg.push("Rubrica não encontrado");
          console.log("Rubrica não encontrado: ", line.split("=")[1]);
          break;
        }
      } else if (line.startsWith("qtdRubr_")) {
        qtdRubr = line.split("=")[1];
      } else if (line.startsWith("fatorRubr_")) {
        fatorRubr = line.split("=")[1];
      } else if (line.startsWith("vrRubr_")) {
        vrRubr = line.split("=")[1];
      } else if (line.startsWith("indApurIR_")) {
        indApurIR = line.split("=")[1];
        // Executa update em serv_vinculos ou para a execução (break) caso não seja encontrado
        servVinc = await app
          .db({ v: tabelaServVinculoDomain })
          .select("v.id")
          .join({ s: tabelaServidoresDomain }, "s.id", "=", "v.id_serv")
          .where(function () {
            this.where("v.matricula", matricula)
              .andWhere("s.cpf_trab", cpfTrab)
              .andWhere("v.ini_valid", "<=", perApur);
          })
          .first();
        if (servVinc && servVinc.id) {
          servVinc = servVinc.id;
          // Atualizar o registro em serv_vinculos para o servidor
          const vincUpdateBody = {
            id_param_cod_categ: codCateg,
            updated_at: new Date(),
          };
          if (grauExp) vincUpdateBody.id_param_grau_exp = grauExp;
          await app
            .db(tabelaServVinculoDomain)
            .update(vincUpdateBody)
            .where({ id: servVinc });
        } else {
          errorsMsg.push(
            `Registro de vínculo (CPF: ${cpfTrab} - Matrícula: ${matricula}) não encontrado`
          );
          break;
        }

        // return res.status(201).send({
        //   id_serv_vinc: servVinc,
        //   id_remun_param: remunParam,
        //   id_rubrica: codRubr,
        //   indApurIR
        // })
        const registro = await app
          .db(tabelaDomain)
          .select("id")
          .where({
            id_serv_vinc: servVinc,
            id_remun_param: remunParam,
            id_rubrica: codRubr,
          })
          .first();
        // if (!registro) {
        //   errorsMsg.push('Registro não encontrado');
        //   break;
        // }
        currentGroup = {
          id: registro ? registro.id : undefined,
          status: STATUS_ACTIVE,
          evento: 1,
          created_at: new Date(),
          updated_at: new Date(),
          id_serv_vinc: servVinc,
          id_remun_param: remunParam,
          id_rubrica: codRubr,
          qtd_rubr: qtdRubr.trim(),
          fator_rubr: fatorRubr.trim(),
          valor_rubr: vrRubr.trim(),
          ind_apur_ir: indApurIR.trim(),
          prazo_i: "1",
          prazo_f: "1",
        };
        bodyRubricas.push(currentGroup);
      }
    }

    for (let element of bodyRubricas) {
      try {
        if (element.id) {
          delete element.created_at;
          await app.db(tabelaDomain).update(element).where({ id: element.id });
          countUpdate++;
        } else {
          delete element.updated_at;
          await app.db(tabelaDomain).insert(element);
          countInsert++;
        }
      } catch (error) {
        errorsMsg.push(error);
      }
    }

    return res.status(countInsert + countUpdate > 0 ? 200 : 201).send({
      result: {
        registrosIncluidos: countInsert,
        registrosAlterados: countUpdate,
        errors: errorsMsg,
      },
      bodyRubricas,
    });
  };

  const limit = 20; // usado para paginação
  const get = async (req, res) => {
    let user = req.user;
    const id_vinculo = req.params.id_vinculo;
    const key = req.query.key ? req.query.key : "";
    console.log("2222");
    const uParams = await app
      .db({ u: "users" })
      .join({ e: "empresa" }, "u.id_emp", "=", "e.id")
      .select("u.*", "e.cliente", "e.dominio")
      .where({ "u.id": user.id })
      .first();
    try {
      // Alçada para exibição
      isMatchOrError(
        uParams && uParams.cad_servidores >= 1,
        `${noAccessMsg} "Exibição de financeiros"`
      );
    } catch (error) {
      return res.status(401).send(error);
    }
    const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`;
    const tabelaRubricasDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.fin_rubricas`;
    const tabelaRemunParamsDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.remun_params`;

    const page = req.query.page || 1;

    let sql = app
      .db({ tbl1: tabelaDomain })
      .count("tbl1.id", { as: "count" })
      .join({ ru: tabelaRubricasDomain }, "ru.id", "=", "tbl1.id_rubrica")
      .join(
        { rp: tabelaRemunParamsDomain },
        "rp.id",
        "=",
        "tbl1.id_remun_param"
      )
      .where({
        "tbl1.status": STATUS_ACTIVE,
        "rp.ano": uParams.f_ano,
        "rp.mes": uParams.f_mes,
        "rp.complementar": uParams.f_complementar,
      })
      .where(function () {
        this.where({ "tbl1.id_serv_vinc": req.params.id_vinculo }).orWhere({
          "tbl1.id_ben_vinc": req.params.id_vinculo,
        });
      })
    sql = await app.db.raw(sql.toString());
    const count = sql[0][0].count;

    const ret = app
      .db({ tbl1: tabelaDomain }).select('tbl1.*')
      .join({ ru: tabelaRubricasDomain }, "ru.id", "=", "tbl1.id_rubrica")
      .join(
        { rp: tabelaRemunParamsDomain },
        "rp.id",
        "=",
        "tbl1.id_remun_param"
      )
      .where({
        "tbl1.status": STATUS_ACTIVE,
        "rp.ano": uParams.f_ano,
        "rp.mes": uParams.f_mes,
        "rp.complementar": uParams.f_complementar,
      })
      .where(function () {
        this.where({ "tbl1.id_serv_vinc": req.params.id_vinculo }).orWhere({
          "tbl1.id_ben_vinc": req.params.id_vinculo,
        });
      })
      .orderBy("ru.cod_rubr")
      .limit(limit)
      .offset(page * limit - limit);
    console.log(ret.toString());
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
        id_serv_vinc: req.params.id_serv_vinc,
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
        uParams && uParams.cad_servidores >= 4,
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
        .where({ id_serv_vinc: req.params.id_serv_vinc, id: req.params.id });
      existsOrError(rowsUpdated, "Registro não foi encontrado");

      res.status(204).send();
    } catch (error) {
      res.status(400).send(error);
    }
  };
  return { save, get, getById, remove };
};
