const moment = require('moment')
const randomstring = require("randomstring")
const client = require("basic-ftp")
const { dbPrefix, jasperServerUrl, jasperServerU, jasperServerK, baseApiUrl } = require("../.env")
const bcrypt = require('bcrypt')
const JSIntegration = require('../config/jSIntegration')

module.exports = app => {
    const { existsOrError, valueOrError, notExistsOrError, levenshtein, isMatchOrError, noAccessMsg } = app.api.validation
    const { getLastDateOfMonth } = app.api.facilities
    const { uploadsRoot, ftpRoot, baseFrontendUrl } = require('../config/params');
    const tabela = 'con_contratos'
    const STATUS_NONACTIVE = 9
    const STATUS_ACTIVE = 10
    const STATUS_FINISHED = 20
    const STATUS_DELETE = 99
    const fs = require('fs');
    const ftpClient = new client.Client()
    ftpClient.ftp.verbose = true

    const save = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        const body = { ...req.body }
        try {
            // Alçada para edição de registro
            if (body.id)
                isMatchOrError(uParams && (uParams.id_cadas && uParams.tipoUsuario == 0) // Servidor
                    || uParams.con_contratos >= 3, `${noAccessMsg} "Edição de contrato de consignação"`)
            // Alçada para criação de registro
            else isMatchOrError(uParams && (uParams.id_cadas && uParams.tipoUsuario == 0) // Servidor
                || uParams.con_contratos >= 2, `${noAccessMsg} "Inclusão de contrato de consignação"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaConvenios = `${dbPrefix}_app.con_convenios`
        const tabelaParcelasDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_parcelas`
        const tabelaConsignatariosDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_consign`
        if (req.params.id) body.id = req.params.id
        if (body.status == 10 && !uParams.averbaOnline) {
            try {
                existsOrError(body.id_cadas, 'Cliente ainda não tem perfil de usuário')
                const uProper = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').where({ 'u.id_cadas': body.id_cadas, 'e.cliente': uParams.cliente }).first()
                existsOrError(uProper.id, 'Cliente ainda não tem perfil de usuário')
                // existsOrError(body.u_keypass, 'Senha do cliente não informada')
                if (uProper && body.u_keypass) {
                    let isMatch = bcrypt.compareSync(body.u_keypass, uProper.password)
                    if (!isMatch) throw 'A senha informada é inválida!'
                    body.averbado_online = "1"
                }
            } catch (error) {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function}:${__line} ${error}`, sConsole: true } })
                return res.status(400).send(error)
            }
        }
        delete body.id_cadas
        delete body.u_keypass
        delete body.cpf
        delete body.nome
        delete body.parcela
        delete body.id_parcela
        try {
            existsOrError(body.id_user, 'Usuário consignatário não informado')
            existsOrError(body.id_consign, 'Consignatário não informado')
            existsOrError(body.id_serv, 'Servidor(cliente) não informado')
            existsOrError(body.contrato, 'Número de contrato não informado')
            if (body.id_consign == "1" && body.contrato.length > 9) throw 'O Número de contrato não pode ter mais que 9(nove) dígitos'
            if (body.id_consign == "2" && body.contrato.length > 19) throw 'O Número de contrato não pode ter mais que 19(dezenove) dígitos'
            const contratosServidor = await app.db(tabelaDomain)
                .where({
                    'id_serv': body.id_serv,
                    'status': STATUS_ACTIVE
                })
                .whereNot({ 'id': body.id || 0 })
            contratosServidor.forEach(element => {
                if (element.contrato == body.contrato) throw 'Já há um contrato ativo para este cliente com este número'
                const percent = 94.7
                if (levenshtein(element.contrato, body.contrato) > percent) throw `O contrato informado (${body.contrato}) é muito parecido com algum contrato ativo. Verifique antes de continuar.`
            });
            //existsOrError(body.id_con_eventos, 'Evento da folha não informado')
            existsOrError(body.primeiro_vencimento, 'Primeiro vencimento não informado')
            existsOrError(body.valor_parcela, 'Valor da parcela não informada')
            valueOrError(body.valor_parcela, 'Valor da parcela inválido')
            existsOrError(body.parcelas, 'Quantidade de parcelas não informada')
            existsOrError(body.valor_total, 'Valor total do contrato não informado')
            existsOrError(body.valor_liquido, 'Valor liquido do contrato não informado')
            existsOrError(body.qmar, 'Quantidade mínima de parcelas para renovar não informado')

            const apenasEfetivo = await app.db({ 'cn': tabelaConsignatariosDomain })
                .join({ 'cv': tabelaConvenios }, 'cn.id_convenio', '=', 'cv.id')
                .select('cv.apenas_efetivos')
                .where({ 'cn.id': uParams.consignatario }).first()
            if (apenasEfetivo && apenasEfetivo.apenas_efetivos) {
                // Apenas servidores efetivos e aposentados
                const tabelaFinSFuncionalDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.fin_sfuncional`
                const vinculoFuncional = await app.db(tabelaFinSFuncionalDomain)
                    .select({ id_vinculo: 'id_vinculo', vinculo: app.db.raw(`${dbPrefix}_app.getVinculoLabel(id_vinculo)`) })
                    .where({ id_serv: body.id_serv })
                    .orderBy('ano', 'desc')
                    .orderBy('mes', 'desc')
                    .first()
                // Contratual -> Efetivo, Aposentado, Pensionista, Eletivo, Estabilizado
                if (![1, 4, 5, 6, 9].includes(Number(vinculoFuncional.id_vinculo)))
                    throw `O vínculo funcional deste servidor (${vinculoFuncional.vinculo}) não permite novos contratos consignados`
            }
            req.methodRes = 'return'
            let margemAntes = await getMargemConsignavel(req);
            margemAntes += 0.01
            if (body.status != STATUS_FINISHED)
                if (margemAntes < 0.0) throw 'Valor da parcela ultrapassa a margem disponível'
        } catch (error) {
            app.api.logger.logInfo({ log: { line: `Error in file: ${__filename}.${__function}:${__line} ${error}`, sConsole: true } })
            return res.status(400).send(error)
        }

        delete body.banco
        delete body.febraban
        delete body.id_evento
        delete body.evento_nome
        delete body.agencia
        delete body.id_cad_bancos
        delete body.status_label
        delete body.qmp
        delete body.parcelasQuitadas
        delete body.user
        delete body.febraban
        body.contrato = body.contrato.replace(/([^\d])+/gim, "")
        const parcelasSituacao = body.parcelasSituacao
        delete body.parcelasSituacao

        const method = req.method
        delete req.method // remove a propriedade method para poder obter o retorno simples
        const convenio = await getDataCorte(req)
        req.method = method // devolve o valor da propriedade method   

        if (body.id) {
            const contratoOriginal = await app.db(tabelaDomain).where({ id: body.id }).first()
            // Variáveis da edição de um registro
            // registrar o evento na tabela de eventos
            const { createEventUpd } = app.api.sisEvents
            const evento = await createEventUpd({
                "notTo": ['created_at', 'evento', 'updated_at'],
                "last": contratoOriginal,
                "next": body,
                "request": req,
                "evento": {
                    "evento": `Alteração de contrato de consignação`,
                    "tabela_bd": tabela,
                }
            })
            body.evento = evento
            body.updated_at = new Date()

            app.db.transaction(async (trx) => {
                try {
                    if (parcelasSituacao) {

                        // 002 - Excluído (Renovação ou Liquidação)
                        // 006 - Servidor Aposentado (Para outro convênio)
                        // 104 - Servidor Falecido
                        // 105 - Servidor Exonerado
                        let parcelasSituacaoLabel = ''
                        switch (parseInt(parcelasSituacao)) {
                            case 2: parcelasSituacaoLabel = '002 - Excluído (Renovação ou Liquidação)'; break;
                            case 6: parcelasSituacaoLabel = '006 - Servidor Aposentado (Para outro convênio)'; break;
                            case 104: parcelasSituacaoLabel = '104 - Servidor Falecido'; break;
                            case 105: parcelasSituacaoLabel = '105 - Servidor Exonerado'; break;
                            default: parcelasSituacaoLabel = 'Situação não informada'; break;
                        }

                        // Antes de liquidar o contrato edita as parcelas
                        let vencimento = 'NOW()'
                        const dataCt = moment(convenio.data_corte)
                        if (dataCt.month() != moment().month()) vencimento = 'DATE_ADD(NOW(), INTERVAL 1 MONTH)'

                        const parcelasUpdated = await app.db.raw(`UPDATE ${tabelaParcelasDomain} SET
                            situacao = ${parcelasSituacao}, 
                            observacao = 'Nova situação da parcela: ${parcelasSituacaoLabel}'
                            WHERE id_con_contratos = ${body.id} AND vencimento >= ${vencimento}`)
                            .transacting(trx)
                            .catch(error => {
                                app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function}:${__line} ${error}`, sConsole: true } })

                                app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                                return res.status(500).send(error)
                            })
                        existsOrError(parcelasUpdated, 'Não foram encontradas as parcelas do contrato')
                    }

                    if (contratoOriginal.primeiro_vencimento != body.primeiro_vencimento) {
                        // Exclui as parcelas do contrato para poder recriar a partir do novo primeiro_vencimento
                        const parcelasDelete = await app.db.raw(`DELETE from ${tabelaParcelasDomain} 
                            WHERE id_con_contratos = ${body.id}`)
                            .transacting(trx)
                            .catch(error => {
                                app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function}:${__line} ${error}`, sConsole: true } })

                                app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                                return res.status(500).send(error)
                            })
                    }

                    const rowsUpdated = await app.db(tabelaDomain).transacting(trx)
                        .update(body)
                        .where({ id: body.id })
                        .then(async (ret) => {
                            return res.status(200).send(body)
                        })
                        .catch(error => {
                            app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function}:${__line} ${error}`, sConsole: true } })

                            app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                            return res.status(500).send(error)
                        })
                    existsOrError(rowsUpdated, 'Contrato não foi encontrado')
                    await trx.commit();
                    const { gPCE } = app.api.conContrParcelas
                    req.query.contrato = body.id
                    req.query.res = false
                    const gPCERes = await gPCE(req)
                    delete req.query.contrato
                    delete req.query.res
                } catch (error) {
                    const errorId = Date.now()
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (Transaction line:${__line}). Error Id(${errorId}): ${error}`, sConsole: true } })
                    return res.status(400).send(`Erro na inclusão dos dados. Erro Id: ${errorId}`);
                }
            })
        } else {
            // Criação de um novo registro
            const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()
            body.evento = nextEventID.count + 1
            // Variáveis da criação de um novo registro
            body.token = randomstring.generate(60)
            body.status = STATUS_NONACTIVE
            body.created_at = new Date()

            body.primeiro_vencimento = convenio.primeiro_vencimento

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
                            "evento": `Novo contrato de consignação`,
                            "tabela_bd": tabela,
                        }
                    })
                    return res.status(200).send(body)
                })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function}:${__line} ${error}`, sConsole: true } })

                    app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
        }
    }

    /**
     * Retorna a margem do servidor baseado na última folha ativa do servidor
     * @param {*} req 
     * @returns 
     */
    const getMargemConsignavel = async (req, res) => {
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').where({ 'u.id': req.user.id }).first();
        const body = { ...req.body }
        let margemConsignavel = {
            margemFolha: 0.0,
            somaEventos: 0.0,
        }
        const tabelaDomainParams = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.local_params`
        const tabelaDomainRubricas = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.fin_rubricas`
        const tabelaDomainEventos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.fin_eventos`
        const tabelaDomainContratos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_contratos`
        const tabelaParcelasDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_parcelas`
        const folha = {
            ano: '0000',
            mes: '00'
        }
        try {
            // Captura a última folha ativa do servidor
            const maxFolha = await app.db({ fr: tabelaDomainRubricas })
                .select('fr.ano', 'fr.mes')
                .join({ fe: tabelaDomainEventos }, 'fe.id', '=', 'fr.id_fin_eventos')
                .where({ 'fr.id_serv': body.id_serv, 'fe.tipo': '0' })
                .whereNot({ 'fr.mes': '13' })
                .orderBy('fr.ano', 'DESC')
                .orderBy('fr.mes', 'DESC')
                .first()
            // Armazena em folha{ano,mes}
            if (maxFolha) {
                folha.ano = maxFolha.ano
                folha.mes = maxFolha.mes
            }
            // Retorna a soma dos valores da folha
            const valoresFolha = await app.db({ fr: tabelaDomainRubricas })
                .select(app.db.raw('SUM(fr.valor) valor'), 'fe.consignavel', 'fe.consignado')
                .join({ fe: tabelaDomainEventos }, 'fe.id', '=', 'fr.id_fin_eventos')
                .where({
                    'fr.id_serv': body.id_serv,
                    'fr.ano': folha.ano,
                    'fr.mes': folha.mes,
                    'fr.complementar': '000'
                })
                .where(app.db.raw('fr.valor > 0'))
                .groupBy('fe.consignavel', 'fe.consignado')
            // Retorna o percentual da margem consignável
            const percMargem = await app.db({ lp: tabelaDomainParams }).select('parametro').where({ 'dominio': 'cash', 'grupo': 'base' }).first()
            // Contratos no CPF
            const contratos = await app.db({ cc: tabelaDomainContratos })
                .select(app.db.raw('COALESCE(SUM(cc.valor_parcela),0) valor_parcela'))
                .where({ 'cc.id_serv': body.id_serv, 'cc.status': STATUS_ACTIVE }).first()
            let consignavel = 0
            let margem = 0
            let somaContratos = contratos.valor_parcela
            let margemFinal = 0
            valoresFolha.forEach(element => {
                if (element.consignavel == '1') consignavel += element.valor
            });
            margem = Math.round(consignavel * (percMargem.parametro / 100) * 100) / 100
            margemFinal = margem - somaContratos
            // Se for uma requisição externa
            if (req.methodRes == 'return') return margemFinal
            // Se for uma requisição interna
            else return res.status(200).send({ margemFinal, maxFolha })
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function}:${__line} ${error}`, sConsole: true } })

            app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
            return res.status(500).send(error)

        }
    }

    const limitGetByIdCadas = 15 // usado para paginação
    const getByCadas = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        const cpf = req.query.cpf ? req.query.cpf : ''
        const id_cadas = req.params.id_cadas
        try {
            // Alçada para exibição
            isMatchOrError((uParams && (uParams.con_contratos >= 1 || uParams.gestor === 1 || uParams.admin >= 1 ||
                uParams.con_contratos >= 1)) || (user.cpf == cpf), `${noAccessMsg} "Exibição de dados contratos consignados de servidor"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaServidores = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.cad_servidores`
        const tabelaConEventos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_eventos`
        const tabelaEventos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.fin_eventos`
        const tabelaConsignatarios = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_consign`
        const tabelaConvenios = `${dbPrefix}_app.con_convenios`
        const tabelaBancos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.cad_bancos`

        const page = req.query.page || 1
        const idConsignatario = uParams.consignatario
        let sql = app.db({ tb1: `${tabelaDomain}` })
            .select(app.db.raw('count(*) as count'))
            .leftJoin({ ce: `${tabelaConEventos}` }, `ce.id`, `=`, `tb1.id_con_eventos`)
            .leftJoin({ fe: `${tabelaEventos}` }, `fe.id`, `=`, `ce.id_fin_eventos`)
            .leftJoin({ co: `${tabelaConsignatarios}` }, `co.id`, `=`, `tb1.id_consign`)
            .leftJoin({ cv: `${tabelaConvenios}` }, `cv.id`, `=`, `co.id_convenio`)
            .leftJoin(tabelaServidores, `${tabelaServidores}.id`, `=`, `tb1.id_serv`)
            .leftJoin({ cb: `${tabelaBancos}` }, `cb.id`, `=`, `co.id_cad_bancos`)
            .where({ 'tb1.id_serv': id_cadas })
            .whereIn('tb1.status', [STATUS_NONACTIVE, STATUS_ACTIVE, STATUS_FINISHED])
        // if (uParams.tipoUsuario < 2) // Se não for operador
        //     sql.andWhere(app.db.raw(idConsignatario ? `co.id = ${idConsignatario}` : '1=1'))
        const result = await app.db.raw(sql.toString())
        const count = parseInt(result[0][0].count) || 0

        let ret = app.db({ tb1: `${tabelaDomain}` })
            .select('tb1.*', `fe.id_evento`, `fe.evento_nome`, `cb.nome as banco`,
                `cv.agencia`, app.db.raw(`${dbPrefix}_app.getStatusLabel(tb1.status) as status_label`),
                app.db.raw(`(SELECT COALESCE(MAX(prazo), 0) FROM ${dbPrefix}_${uParams.cliente}_${uParams.dominio}.fin_rubricas fr WHERE fr.id_con_contratos = tb1.id) as parcelasQuitadas`),
                `cv.qmp`)
            .leftJoin({ ce: `${tabelaConEventos}` }, `ce.id`, `=`, `tb1.id_con_eventos`)
            .leftJoin({ fe: `${tabelaEventos}` }, `fe.id`, `=`, `ce.id_fin_eventos`)
            .leftJoin({ co: `${tabelaConsignatarios}` }, `co.id`, `=`, `tb1.id_consign`)
            .leftJoin({ cv: `${tabelaConvenios}` }, `cv.id`, `=`, `co.id_convenio`)
            .leftJoin({ cs: `${tabelaServidores}` }, `cs.id`, `=`, `tb1.id_serv`)
            .leftJoin({ cb: `${tabelaBancos}` }, `cb.id`, `=`, `co.id_cad_bancos`)
            .where({ 'tb1.id_serv': id_cadas })
            .whereIn('tb1.status', [STATUS_NONACTIVE, STATUS_ACTIVE, STATUS_FINISHED])
        // if (uParams.tipoUsuario < 2) // Se não for operador
        //     ret.andWhere(app.db.raw(idConsignatario ? `co.id = ${idConsignatario}` : '1=1'))
        ret.orderBy('tb1.status')
            .orderBy('tb1.created_at', 'desc')
            .limit(limitGetByIdCadas).offset(page * limitGetByIdCadas - limitGetByIdCadas)
        ret.then(body => {
            return res.json({ data: body, count, limit: limitGetByIdCadas })
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function}:${__line} ${error}`, sConsole: true } })

                app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const limit = 20
    const get = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        try {
            // Alçada para exibição
            isMatchOrError((uParams && (
                (uParams.id_cadas && uParams.tipoUsuario == 0) // Servidor
                || uParams.con_contratos >= 1 || uParams.gestor === 1)), `${noAccessMsg} "Exibição de dados contratos consignados de servidor"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaCadastrosDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.cad_servidores`
        const tabelaConsignatarioDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_consign`
        const tabelaBancosDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.cad_bancos`
        const tabelaParcelasDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_parcelas`

        const page = req.query.page || 1
        const key = req.query.key ? req.query.key.trim() : ''
        const complied = req.query.complied ? req.query.complied : undefined
        const status = req.query.status ? req.query.status : undefined
        const pv = req.query.pv ? req.query.pv : undefined
        const vencimento = req.query.vcto ? req.query.vcto : undefined
        const optionsBancos = req.query.optionsBancos ? req.query.optionsBancos : undefined

        const cpf = key.replace(/([^\d])+/gim, "") || ''
        let count = 0
        if (page > 0) {
            let sql = app.db({ tb1: `${tabelaDomain}` })
                .select(app.db.raw('count(*) as count'))
                .join({ 'cs': tabelaCadastrosDomain }, 'cs.id', '=', 'tb1.id_serv')
                .join({ 'co': tabelaConsignatarioDomain }, 'co.id', '=', 'tb1.id_consign')
                .join({ 'cb': tabelaBancosDomain }, 'cb.id', '=', 'co.id_cad_bancos')
                .join({ 'cp': tabelaParcelasDomain }, function () {
                    this.on('cp.id_con_contratos', '=', 'tb1.id')
                    if (!vencimento && !pv && !complied)
                        this.andOn(app.db.raw(`CONCAT(EXTRACT(YEAR FROM cp.vencimento),'-',LPAD(EXTRACT(MONTH FROM cp.vencimento), 2, '0')) = '${uParams.f_ano}-${uParams.f_mes}'`))
                    // Caso tenha vencimento então retorna apenas os a acatar
                    if (vencimento) this.andOn(app.db.raw('cp.situacao = 1'))
                })
                .whereNot({ 'tb1.status': STATUS_DELETE })
            if (complied != undefined)
                sql.andWhere({ 'cp.situacao': complied })
            if (status != undefined)
                sql.andWhere({ 'tb1.status': status })
            if (pv != undefined)
                sql.andWhere(app.db.raw(`CONCAT(EXTRACT(YEAR FROM tb1.primeiro_vencimento),'-',LPAD(EXTRACT(MONTH FROM tb1.primeiro_vencimento), 2, '0')) = substring('${pv}', 1, 7)`))
            if (vencimento != undefined)
                sql.andWhere(app.db.raw(`CONCAT(EXTRACT(YEAR FROM cp.vencimento),'-',LPAD(EXTRACT(MONTH FROM cp.vencimento), 2, '0')) = substring('${vencimento}', 1, 7)`))
                    .andWhere(app.db.raw('cp.situacao = 1'))
            if (optionsBancos != undefined)
                sql.andWhere({ 'cb.febraban': optionsBancos })
            sql.where(function () {
                if (cpf.length > 0)
                    this.where(app.db.raw(`tb1.contrato like '%${key}%'`))
                        .orWhere(app.db.raw(`cs.cpf like '%${cpf}%'`))
                        .orWhere(app.db.raw(`cs.nome like '%${key}%'`))
                else
                    this.where(app.db.raw(`tb1.contrato like '%${key}%'`))
                        .orWhere(app.db.raw(`cs.nome like '%${key}%'`))
            })
                .groupBy('tb1.contrato', 'tb1.status')
            const result = await app.db.raw(sql.toString())
            count = parseInt(result[0].length) || 0
        }
        let ret = app.db({ tb1: `${tabelaDomain}` })
            // .select('tb1.*', { 'id_parcela': 'cp.id' }, 'cb.febraban', 'cs.cpf', 'cs.nome', 'cp.parcela')
            .select('cs.matricula', 'cb.febraban', 'cp.parcela', 'tb1.parcelas', 'tb1.valor_parcela', 'tb1.id', 'cs.nome', 'tb1.id_consign', 'cs.cpf', 'tb1.contrato', 'tb1.primeiro_vencimento', 'tb1.status', { 'id_parcela': 'cp.id' })
            .join({ 'cs': tabelaCadastrosDomain }, 'cs.id', '=', 'tb1.id_serv')
            .join({ 'co': tabelaConsignatarioDomain }, 'co.id', '=', 'tb1.id_consign')
            .join({ 'cb': tabelaBancosDomain }, 'cb.id', '=', 'co.id_cad_bancos')
            .leftJoin({ 'cp': tabelaParcelasDomain }, function () {
                this.on('cp.id_con_contratos', '=', 'tb1.id')
                if (!vencimento && !pv && !complied)
                    this.andOn(app.db.raw(`CONCAT(EXTRACT(YEAR FROM cp.vencimento),'-',LPAD(EXTRACT(MONTH FROM cp.vencimento), 2, '0')) = '${uParams.f_ano}-${uParams.f_mes}'`))
                // Caso tenha vencimento então retorna apenas os a acatar
                if (vencimento) this.andOn(app.db.raw('cp.situacao = 1'))
            })
            .whereNot({ 'tb1.status': STATUS_DELETE })
        if (complied != undefined)
            ret.andWhere({ 'cp.situacao': complied })
        if (status != undefined)
            ret.andWhere({ 'tb1.status': status })
        if (pv != undefined)
            ret.andWhere(app.db.raw(`CONCAT(EXTRACT(YEAR FROM tb1.primeiro_vencimento),'-',LPAD(EXTRACT(MONTH FROM tb1.primeiro_vencimento), 2, '0')) = substring('${pv}', 1, 7)`))
        if (vencimento != undefined)
            ret.andWhere(app.db.raw(`CONCAT(EXTRACT(YEAR FROM cp.vencimento),'-',LPAD(EXTRACT(MONTH FROM cp.vencimento), 2, '0')) = substring('${vencimento}', 1, 7)`))
                .andWhere(app.db.raw('cp.situacao = 1'))
        if (optionsBancos != undefined)
            ret.andWhere({ 'cb.febraban': optionsBancos })
        ret.where(function () {
            if (cpf.length > 0)
                this.where(app.db.raw(`tb1.contrato like '%${key}%'`))
                    .orWhere(app.db.raw(`cs.cpf like '%${cpf}%'`))
                    .orWhere(app.db.raw(`cs.nome like '%${key}%'`))
            else
                this.where(app.db.raw(`tb1.contrato like '%${key}%'`))
                    .orWhere(app.db.raw(`cs.nome like '%${key}%'`))
        })
            .groupBy('tb1.contrato', 'tb1.status')
        if (complied) ret.orderBy('cs.matricula')
        else ret.orderBy('cs.nome').orderBy('tb1.created_at')
        if (page > 0) ret.limit(limit).offset(page * limit - limit)
        ret.then(body => {
            const resCount = count || body.length
            return res.json({ data: body, count: resCount, limit })
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function}:${__line} ${error}`, sConsole: true } })

                app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getById = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        try {
            // Alçada para exibição
            isMatchOrError((uParams && (
                (uParams.id_cadas && uParams.tipoUsuario == 0) // Servidor
                || uParams.con_contratos >= 1 || uParams.gestor === 1)), `${noAccessMsg} "Exibição de dados contratos consignados de servidor"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaServidores = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.cad_servidores`
        const tabelaConEventos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_eventos`
        const tabelaEventos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.fin_eventos`
        const tabelaConsignatarios = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_consign`
        const tabelaBancos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.cad_bancos`
        const tabelaUsers = `users`
        let ret = app.db({ tb1: `${tabelaDomain}` })
            .select('tb1.*', `fe.id_evento`, `fe.evento_nome`,
                app.db.raw(`(SELECT COALESCE(MAX(prazo), 0) FROM ${dbPrefix}_${uParams.cliente}_${uParams.dominio}.fin_rubricas fr WHERE fr.id_con_contratos = tb1.id) as parcelasQuitadas`),
                app.db.raw(`${dbPrefix}_app.getStatusLabel(tb1.status) as status_label`))
            .leftJoin({ ce: `${tabelaConEventos}` }, `ce.id`, `=`, `tb1.id_con_eventos`)
            .leftJoin({ fe: `${tabelaEventos}` }, `fe.id`, `=`, `ce.id_fin_eventos`)
            .leftJoin({ co: `${tabelaConsignatarios}` }, `co.id`, `=`, `tb1.id_consign`)
            .leftJoin({ cs: `${tabelaServidores}` }, `cs.id`, `=`, `tb1.id_serv`)
            .leftJoin({ cb: `${tabelaBancos}` }, `cb.id`, `=`, `co.id_cad_bancos`)
            .whereIn('tb1.status', [STATUS_NONACTIVE, STATUS_ACTIVE, STATUS_FINISHED])
        if (req.query && req.query.tkn) {
            ret.where(app.db.raw(`tb1.token = '${req.query.tkn}'`))
        } else
            ret.where(app.db.raw('tb1.id = ?', [req.params.id]))
        ret.first()
            .then(async (body) => {
                let user
                if (body && body.id_user)
                    user = await app.db(tabelaUsers).select('name', 'email').where({ id: body.id_user }).first()
                return res.json({ data: body, user })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function}:${__line} ${error}`, sConsole: true } })

                app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getByFunction = async (req, res) => {
        const func = req.params.func
        switch (func) {
            case 'gsc':
                getSomaContratos(req, res)
                break;
            case 'gmc':
                getMargemConsignavel(req, res)
                break;
            case 'gpq':
                getParcelasQuitadas(req, res)
                break;
            case 'gcc':
                getCountContratos(req, res)
                break;
            case 'gavb': // 
                getAverbacao(req, res)
                break;
            case 'gdc': // 
                getDataCorte(req, res)
                break;
            case 'gcl': // 
                getContractsLength(req, res)
                break;
            default:
                res.status(404).send('Função inexitente')
                break;
        }
    }

    const getContractsLength = async (req, res) => {
        const uParams = await app.db('users').where({ id: req.user.id }).first();
        const tabelaContratosDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_contratos`
        const body = { ...req.body }

        try {
            existsOrError(body.id_serv, 'Servidor não informado')
        } catch (error) {
            return res.status(400).send(error)
        }

        const ceil = await app.db(tabelaContratosDomain)
            .select(app.db.raw('CEIL(AVG(LENGTH(contrato))) as ceil'))
            .where({ 'id_consign': uParams.consignatario }).first()

        const contrato = await app.db(tabelaContratosDomain)
            .select('contrato')
            .where(app.db.raw(`LENGTH(contrato) < ${ceil.ceil}`))
            .where({
                'id_consign': uParams.consignatario,
                'id_serv': body.id_serv,
                'status': STATUS_ACTIVE
            }).first()

        return req.method === 'POST' ? res.status(200).send({ ...ceil, ...contrato }) : { ...ceil, ...contrato }
    }

    const getDataCorte = async (req, res) => {
        const uParams = await app.db('users').where({ id: req.user.id }).first();
        const tabelaConvenios = `${dbPrefix}_app.con_convenios`
        const tabelaConsignatariosDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_consign`

        const convenio = await app.db({ 'cv': tabelaConvenios })
            .select('dia_corte', 'mes_corte')
            .join({ 'cn': tabelaConsignatariosDomain }, 'cn.id_convenio', '=', 'cv.id')
            .where({ 'cn.id': uParams.consignatario }).first()
        const dataAtual = new Date();
        const dia = dataAtual.getDate();

        let data_corte = moment().date(convenio.dia_corte)

        if (dia <= convenio.dia_corte) {
            const lastDateCurrentMonth = getLastDateOfMonth(parseInt(convenio.mes_corte));
            convenio.primeiro_vencimento = lastDateCurrentMonth
            convenio.data_corte = data_corte
        } else {
            const lastDateCurrentMonth = getLastDateOfMonth(parseInt(convenio.mes_corte) + 1);
            convenio.primeiro_vencimento = lastDateCurrentMonth
            convenio.data_corte = data_corte.add(1, 'month')
        }
        return req.method === 'POST' ? res.status(200).send(convenio) : convenio
    }

    const getCountContratos = async (req, res) => {
        try {
            // Alçada para exibição
            isMatchOrError(req.user && req.user.id, `${noAccessMsg} "Exibição de contagem de contratos consignados de servidor"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const uParams = await app.db('users').where({ id: req.user.id }).first();
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaDomainCadastros = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.cad_servidores`
        const _status = req.body._status
        const contNAverbs = await app.db({ cc: tabelaDomain })
            .select(app.db.raw('cc.id id_contrato, u.id, u.name, u.email, DATE_FORMAT(cc.`created_at`, "%d/%m/%Y") created_at, cc.contrato, c.matricula, c.nome, CONCAT("https://mgcash.app.br/servidor-panel/",c.matricula) link'))
            .join({ u: 'wwmgca_api.users' }, 'u.id', '=', 'cc.id_user')
            .join({ c: tabelaDomainCadastros }, 'c.id', '=', 'cc.id_serv')
            .where({ 'cc.status': 9 })
            .where(function () {
                if (uParams.admin == 0) this.where({ 'id_consign': uParams.consignatario })
            })
            .andWhere(app.db.raw(uParams.gestor >= 1 ? '1=1' : `u.id = ${req.user.id}`))
        const ret = app.db({ cc: `${tabelaDomain}` }).count('cc.id')
            .join({ u: 'wwmgca_api.users' }, 'u.id', '=', 'cc.id_user')
            .where({ 'cc.status': _status })
            // if (uParams.admin == 0)
            //     ret.where({ 'id_consign': uParams.consignatario })
            .where(function () {
                if (uParams.admin == 0) this.where({ 'id_consign': uParams.consignatario })
            })
        ret.andWhere(app.db.raw(uParams.gestor >= 1 ? '1=1' : `u.id = ${req.user.id}`))
            .first()
        ret.then(body => {
            return res.json({
                data: {
                    cliente: uParams.cliente,
                    dominio: uParams.dominio,
                    count: body['count(`cc`.`id`)'],
                    nAverbs: contNAverbs
                }
            })
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })

                app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getSomaContratos = async (req, res) => {
        const uParams = await app.db('users').where({ id: req.user.id }).first();

        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const id_servidor = req.body.id
        const ret = app.db({ tb1: `${tabelaDomain}` })
            .select(app.db.raw('SUM(valor_parcela) soma_parcelas')).where({ status: STATUS_ACTIVE, id_serv: id_servidor })
            .first()
        ret.then(body => {
            return res.json({ data: body })
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })

                app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getParcelasQuitadas = async (req, res) => {
        const uParams = await app.db('users').where({ id: req.user.id }).first();

        const tabelaRubricas = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.fin_rubricas`
        const idConContratos = req.body.id_con_contratos
        const ret = app.db({ fr: `${tabelaRubricas}` })
            .select(app.db.raw('MAX(fr.prazo) as parcelasQuitadas')).where({ id_con_contratos: idConContratos })
            .first()
        ret.then(body => {
            body.parcelasQuitadas = body.parcelasQuitadas || 0
            return res.json({ data: body })
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })

                app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const remove = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        try {
            // Alçada para exclusão
            isMatchOrError(uParams && uParams.con_contratos >= 3, `${noAccessMsg} "Exclusão de contrato"`)
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
                .where({ id: req.params.id })
                .delete()
            existsOrError(rowsUpdated, 'Registro não foi encontrado')

            res.status(204).send()
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } });
            res.status(400).send(error)
        }
    }

    const createRoot = async (req, res) => {
        if (!fs.existsSync(uploadsRoot)) {
            fs.mkdirSync(uploadsRoot, { recursive: true });
            // registrar o evento na tabela de eventos
            const { createEvent } = app.api.sisEvents
            app.api.logger.logInfo({ log: { line: `Criação do diretório root ${uploadsRoot}!`, sConsole: true } })
        }
    }
    createRoot()

    const createFolder = async (req, res) => {
        const folder = `${uploadsRoot}/${req.folder}`
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true })
            // registrar o evento na tabela de eventos
            const { createEvent } = app.api.sisEvents
            app.api.logger.logInfo({ log: { line: `Criação de um diretório ${folder}!`, sConsole: true } })
            const evento = await createEvent({
                "request": req,
                "evento": {
                    "ip": req.ip,
                    "id_user": req.user.id,
                    "evento": `Criação de um diretório ${folder}`,
                    "classevento": `conContratos.createFolder`,
                    "id_registro": null
                }
            })
        }
    }

    const getAverbacao = async (req, res) => {
        const idConContratos = req.query.idConContratos
        const dbSchema = req.query.dbSchema
        const fileName = req.query.fileName || "Averbação"

        try {
            existsOrError(idConContratos, 'Contrato não informado')
            existsOrError(dbSchema, 'Cliente não informado')
        } catch (error) {
            return res.status(400).send(error)
        }

        const jsIntegration = new JSIntegration(
            jasperServerUrl, // URL of the Jasper Server
            'reports/Cash/consignados/averbacao', // Path to the Report Unit
            'pdf', // Export type
            jasperServerU, // User
            jasperServerK, // Password
            { "idConContratos": idConContratos, "dbSchema": dbSchema } // Optional parameters
        )
        const data = jsIntegration.execute()
            .then((data) => {
                // res.setHeader("Access-Control-Allow-Origin", "*");
                res.setHeader("Content-Type", "application/pdf");
                res.setHeader("Content-Disposition", `attachment; filename=${fileName}.pdf`);
                res.setHeader("Content-Length", data.length);
                res.send(data);
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } });
            });
    }

    return {
        save, get, getById, getByCadas, remove, getByFunction,
        STATUS_NONACTIVE, STATUS_ACTIVE, STATUS_FINISHED, STATUS_DELETE
    }
}