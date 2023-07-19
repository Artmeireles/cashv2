const moment = require('moment')
const randomstring = require("randomstring")
const { dbPrefix } = require("../.env")

module.exports = app => {
  const { existsOrError, notExistsOrError, equalsOrError, isValidEmail, isMatchOrError, noAccessMsg } = app.api.validation
  const { mailyCliSender } = app.api.mailerCli
  const { convertESocialTextToJson, countOccurrences, getRawValueFromKeyPairString, getValueFromKeyPairString, getIdParam, getIdRubricas } = app.api.facilities;
  const tabela = 'remuneracao'
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
          
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                    return res.status(500).send(error)
        })
    }
  }

  const saveBatch = async (req, res) => {
    let user = req.user;
    const uParams = await app.db("users").where({ id: user.id }).first();
    try {
      // Alçada para edição
      isMatchOrError(uParams && uParams.cad_servidores >= 3, `${noAccessMsg} "Edição de ${tabela}"`);
    } catch (error) {
      return res.status(401).send(error);
    }
    let body = { ...req.body };

    const { changeUpperCase, removeAccentsObj } = app.api.facilities;

    const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`;
    const tabelaServidoresDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.servidores`;
    const tabelaServVinculoDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.serv_vinculos`;
    const tabelaRemunParamDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.remun_params`;

    const bodyString = req.body.toString();
    const lines = bodyString.split(/\r?\n/);
    const data = [];
    let rubricas = {}
    let servVinculoAtualiados = []
    let dmDevStart = false
    let dmDevEnd = false
    let dmRubrStart = false
    let dmRubrEnd = false
    let perApur = undefined
    let cpfTrab = undefined
    let codCateg = undefined
    let matricula = undefined
    let grauExp = undefined
    lines.forEach(async (element) => {
      // Atenção para a ordem em que os campos são lidos
      const keysPerApur = ['perApur_7']
      if (keysPerApur.includes(getRawValueFromKeyPairString(element, 'key')))
        perApur = getRawValueFromKeyPairString(element)

      const keysCpfTrab = ['cpfTrab_15']
      if (keysCpfTrab.includes(getRawValueFromKeyPairString(element, 'key')))
        cpfTrab = getRawValueFromKeyPairString(element)

      const keysDmDev = ['INCLUIRDMDEV_153']
      dmDevStart = keysDmDev.includes(getRawValueFromKeyPairString(element, 'key'))
      if (dmDevStart) {
        // Sempre que iniciar dmDevStart, os campos abaixo são zerados para serem setados novamente
        codCateg = undefined
        matricula = undefined
        grauExp = undefined
      }

      // Setar os valores de codCateg, matricula e grauExp
      const keysDodCateg = ['codCateg_112']
      if (!codCateg && keysDodCateg.includes(getRawValueFromKeyPairString(element, 'key')) &&
        (codCateg = getRawValueFromKeyPairString(element)) != null) codCateg = await getIdParam("codCateg", codCateg)

      const keysMatricula = ['matricula_44']
      if (!matricula && keysMatricula.includes(getRawValueFromKeyPairString(element, 'key')) &&
        (matricula = getRawValueFromKeyPairString(element)) != null) matricula = getRawValueFromKeyPairString(element)

      const keysGrauExp = ['grauExp_64']
      if (!grauExp && keysGrauExp.includes(getRawValueFromKeyPairString(element, 'key')) &&
        (grauExp = getRawValueFromKeyPairString(element)) != null) grauExp = await getIdParam("grauExp", grauExp)

      // if (codCateg && grauExp && matricula) {
      //   console.log({ codCateg, grauExp, matricula })
      // }

      if ((perApur && cpfTrab && codCateg && matricula && grauExp)) {
        // Se perApur, cpfTrab, codCateg, matricula e grauExp estiverem setados, 
        // então é possível buscar o registro de vinculo do servidor e setar  codCateg e grauExp
        const serv_vinc = await app.db({ 'v': tabelaServVinculoDomain })
          .join({ 's': tabelaServidoresDomain }, 's.id', 'v.id_serv')
          .where(function () {
            this.where('v.matricula', matricula)
              .andWhere('s.cpf_trab', cpfTrab)
              .andWhere('v.ini_valid', '<=', `${perApur.substring(0, 4)}-${perApur.substring(5, 7)}`)
          }).first()
        console.log({ serv_vinc });
        const remun_param = await app.db(tabelaRemunParamDomain)
          .where({ 'ano': perApur.substring(0, 4), 'mes': perApur.substring(5, 7), 'complementar': '000' }).first()
        
        if (serv_vinc && remun_param) {
          // Executa a atualização do cadastro do servidor
          if (!servVinculoAtualiados.includes(serv_vinc.id)) {
            await app.db(tabelaServVinculoDomain).update({ 'codCateg': codCateg, 'grauExp': grauExp, 'updated_at': moment() }).where({ 'id': serv_vinc.id })
            servVinculoAtualiados.push(serv_vinc.id)
          }
          rubricas.id_serv_vinc = serv_vinc.id
          rubricas.id_remun_param = remun_param.id
        }

        const keysCodRubr = ['codRubr_47']
        if (keysCodRubr.includes(getRawValueFromKeyPairString(element, 'key')))
          rubricas.id_rubrica = await getIdRubricas(getRawValueFromKeyPairString(element), { cliente: uParams.cliente, dominio: uParams.dominio },
            `${perApur.substring(0, 4)}-${perApur.substring(5, 7)}`)

        const keysQtdRbr = ['qtdRubr_49']
        if (keysQtdRbr.includes(getRawValueFromKeyPairString(element, 'key')))
          rubricas.qtd_rubr = getRawValueFromKeyPairString(element) || 1

        const keysFatorRbr = ['fatorRubr_50']
        if (keysFatorRbr.includes(getRawValueFromKeyPairString(element, 'key')))
          rubricas.valor_rubr = getRawValueFromKeyPairString(element) || 1

        const keysValorRbr = ['vrRubr_52']
        if (keysValorRbr.includes(getRawValueFromKeyPairString(element, 'key')))
          rubricas.qtd_rubr = getRawValueFromKeyPairString(element) || 0

        const keysIndApur = ['indApurIR_115']
        if (keysIndApur.includes(getRawValueFromKeyPairString(element, 'key')))
          rubricas.ind_apur_ir = getRawValueFromKeyPairString(element) || 0

        console.log(rubricas);

        if (rubricas.id_serv_vinc && rubricas.id_remun_param && rubricas.id_rubrica && rubricas.qtd_rubr && rubricas.fator_rubr && rubricas.valor_rubr && rubricas.qtd_rubr && rubricas.ind_apur_ir) {
          rubricas.prazo_i = 1
          rubricas.prazo_f = 1
          data.push(rubricas)
        }
        dmRubrStart = !dmRubrEnd && (dmRubrStart || ['INCLUIRITENSREMUN_156'].includes(getRawValueFromKeyPairString(element, 'key')))
        if (dmRubrStart) rubricas = {}

      }
    });

    // const lines = await parseKeyValuePairs(req)
    // const lines = convertESocialTextToJson(req.body);
    return res.send(data)

    // Preciso ler o req.body que chega no formato text/plain linha a linha
    // a seguir, farei uma verificação cod valores recebidos que tem o formato chave=valor.
    // Tratarei as chaves e armazenarei os valores em um objeto

    // const bodyRaw = convertESocialTextToJson(req.body);
    // return res.send(bodyRaw)
    body = [];
    const respError = [];
    const respSuccess = [];
    const id_serv_vinc = await app.db(tabelaServidoresDomain).select('id').where({ matricula: bodyRaw.matricula_108 }).first();
    let ocorrencias = countOccurrences(JSON.stringify(bodyRaw), 'INCLUIRITENSREMUN_156') +
      countOccurrences(JSON.stringify(bodyRaw), 'INCLUIRITENSREMUN_63') +
      countOccurrences(JSON.stringify(bodyRaw), 'INCLUIRITENSREMUN_55');
    if (bodyRaw.INCLUIRITENSREMUN_156 && Array.isArray(bodyRaw.INCLUIRITENSREMUN_156)) ocorrencias = bodyRaw.INCLUIRITENSREMUN_156.length;
    else if (bodyRaw.INCLUIRITENSREMUN_63 && Array.isArray(bodyRaw.INCLUIRITENSREMUN_63)) ocorrencias = bodyRaw.INCLUIRITENSREMUN_63.length;
    else if (bodyRaw.INCLUIRITENSREMUN_55 && Array.isArray(bodyRaw.INCLUIRITENSREMUN_55)) ocorrencias = bodyRaw.INCLUIRITENSREMUN_55.length;
    console.log(ocorrencias);
    if (id_serv_vinc && id_serv_vinc.id && ocorrencias > 0) {
      for (let index = 0; index < ocorrencias; index++) {
        if ((bodyRaw.matricula_108 || (ocorrencias > 1 && bodyRaw.matricula_108[index]))) {
          body.push({
            id_serv_vinc: id_serv_vinc.id,
            id_remun_param: ocorrencias > 1 ? bodyRaw.id_remun_param[index] : bodyRaw.id_remun_param,
            id_rubrica: ocorrencias > 1 ? bodyRaw.id_rubrica[index] : bodyRaw.id_rubrica,
            id_ad_fg: ocorrencias > 1 ? bodyRaw.id_ad_fg[index] : bodyRaw.id_ad_fg,

            qtd_rubr: ocorrencias > 1 ? (bodyRaw.qtdRubr_49[index] || bodyRaw.qtdRubr_49[index] || bodyRaw.qtdRubr_49[index]) : (bodyRaw.qtdRubr_49 || bodyRaw.qtdRubr_49 || bodyRaw.qtdRubr_49),
            fator_rubr: ocorrencias > 1 ? bodyRaw.fatorRubr_50[index] : bodyRaw.fatorRubr_50,
            valor_rubr: ocorrencias > 1 ? bodyRaw.vrRubr_52[index] : bodyRaw.vrRubr_52,
            ind_apur_ir: ocorrencias > 1 ? bodyRaw.indApurIR_115[index] : bodyRaw.indApurIR_115,
            // Os dados a seguir deverão ser capturados no banco de dados e enviados pelo PonteCasV2
            prazo_i: ocorrencias > 1 ? bodyRaw.prazo_i[index] : bodyRaw.prazo_i,
            prazo_f: ocorrencias > 1 ? bodyRaw.prazo_f[index] : bodyRaw.prazo_f,
          });
          console.log(body[index]);
        }
      }

      for (let index = 0; index < body.length; index++) {
        let element = body[index];
        if (element.id_serv_vinc) {
          try {
            existsOrError(element.nome, "Nome não informado");
            const tpl = await app.db(tabelaDomain).where({ id_serv_vinc: element.id_serv_vinc }).first();
            if (tpl && tpl.id) element.id = tpl.id;
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
          } catch (error) {
            respError.push(`Erro na remuneração ${element.nome}: ${error}`)
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