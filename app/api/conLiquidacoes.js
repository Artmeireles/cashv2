const moment = require('moment')
const randomstring = require("randomstring")
const { ftp, dbPrefix } = require('../.env')
const csv = require('csvtojson')
const conContratos = require('./conContratos')

module.exports = app => {
    const { cpfOrError, lengthOrError, existsOrError, notExistsOrError, valueOrError, valueMinorOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const { STATUS_FINISHED } = app.api.conContratos
    const { uploadsRoot, ftpRoot, baseFrontendUrl } = require('../config/params');
    const { afastamentosDef } = require('../config/lists');
    const tabela = 'con_liquidacoes'
    const STATUS_UNAUTHORIZED = 9
    const SITUACAO_ACATADO = 1
    const STATUS_ACTIVE = 10
    const STATUS_MATCH = 20
    const STATUS_DELETE = 99
    const SIT_EXCESSO_DEBITO = 3
    const fs = require('fs');
    
    const save = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        const body = { ...req.body }
        try {
            // Alçada para edição de registro
            if (body.id)
                isMatchOrError(uParams && uParams.admin >= 1 && uParams.con_contratos >= 3, `${noAccessMsg} "Edição de liquidação de contrato de consignação"`)
            // Alçada para criação de registro
            else isMatchOrError(uParams && uParams.admin >= 1 && uParams.con_contratos >= 2, `${noAccessMsg} "Inclusão de liquidação de contrato de consignação"`)
        } catch (error) {
            return res.status(401).send(error)
        }

        const tabelaDomain = `${dbPrefix}_app.${tabela}`
        if (req.params.id) body.id = req.params.id
        if (body.id) {
            // Validação unitária de registro de liquidação
            try {
                if (body.cpf) {
                    const cpf = body.cpf.replace(/([^\d])+/gim, '')
                    existsOrError(body.id_convenio, 'Convênio (Banco) não informado')
                    cpfOrError(cpf, 'CPF inválido ou não informado')
                }
                existsOrError(body.cliente, 'Cliente não informado')
                existsOrError(body.dominio, 'Domínio do servidor não informado')
                existsOrError(body.cpf, 'CPF do servidor não informado')
                existsOrError(body.folha_mes, 'Mês (MM) não informado ou incorreto')
                existsOrError(body.folha_mes, 'Ano (AAAA) não informado ou incorreto')
                existsOrError(body.seq, 'Número sequencial não informado')
                existsOrError(body.prz_total, 'Prazo total não informado')
                existsOrError(body.prz_reman >= 0, 'Prazo remanescente não informado')
                existsOrError(body.contrato, 'Número de contrato não informado')
                existsOrError(body.prestacao, 'Número da prestação atual não informado')
                existsOrError(body.id_cad_servidores, 'Servidor não informado')
                existsOrError(body.v_prestacao, 'Valor da parcela não informado')
                valueOrError(body.v_prestacao, 'Valor da parcela inválido')
            } catch (error) {
                return res.status(400).send(error)
            }
            // Variáveis da edição de um registro
            // registrar o evento na tabela de eventos
            const { createEventUpd } = app.api.sisEvents
            const evento = await createEventUpd({
                "notTo": ['created_at', 'evento', 'updated_at'],
                "last": await app.db(tabelaDomain).where({ id: body.id }).first(),
                "next": body,
                "request": req,
                "evento": {
                    "evento": `Alteração de liquidação de convenente`,
                    "tabela_bd": tabela,
                }
            })
            body.contrato = body.contrato.replace(/([^\d])+/gim, "")
            body.evento = evento
            body.updated_at = new Date()
            delete body.clientName
            delete body.statusImp
            const rowsUpdated = await app.db(tabelaDomain)
                .update(body)
                .where({ id: body.id })
                .then(() => {
                    return res.status(200).send('Registro editado com sucesso!')
                })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function}:${__line} ${error}`, sConsole: true } })
                    
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
            existsOrError(rowsUpdated, 'Contrato não foi encontrado')
        } else {
            try {
                existsOrError(body.liquidacoes, 'Linhas do lote de liquidações não informadas')
                existsOrError(body.id_convenio, 'Convênio bancário não informado')
                existsOrError(body.folha_mes, 'Mês da folha de destino não informada')
                existsOrError(body.folha_ano, 'Ano da folha de destino não informada')
                existsOrError(body.folha_complementar, 'Complementar da folha de destino não informada')
            } catch (error) {
                return res.status(400).send(error)
            }
            setInLiquidationsByBatch(req, res)
        }
    }

    /**
     * Importar os dados informados no banco de dados da API.
     * @returns 
     */
    const setInLiquidationsByBatch = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        if (!(uParams.admin >= 1 || uParams.con_contratos >= 2)) return res.status(401).send('Unauthorized')
        req.user = uParams
        const body = { ...req.body }
        const mode = body.mode
        // Validação unitária de registro de liquidação
        try {
            existsOrError(body.id_convenio, 'Convênio (Banco) não informado')
            existsOrError(body.mode, 'Operação não informada ( Validar ou Salvar? )')
        } catch (error) {
            return res.status(400).send(error)
        }

        let isValid = true
        let batchResult = []
        /**
         * Inclusão de lote de registro de liquidação seguindo a seguinte ordem de colunas conforme remetido em março de 2021
         * Seq;Prz Total;Prz Reman;Contrato;Nº Prest;Nome;CPF;Valor Prest
         * !!! Importante: Não informar cabeçalhos de colunas
         * !!! Importante 02: Valores em formato 0.00
         */
        csv({ noheader: true, output: "json", delimiter: ";", trim: true, }).fromString(body.liquidacoes).then(csvRow => {
            // Variáveis da criação de um novo registro
            let linhas = 0
            let answer = ''
            csvRow.forEach(async (element, index, array) => {
                try {
                    existsOrError(element.field1, 'Número sequencial da linha não informado')
                    existsOrError(element.field2, 'Prazo total da linha não informado')
                    existsOrError(element.field3, 'Prazo remanescente da linha não informado')
                    existsOrError(element.field4, 'Número de contrato da linha não informado')
                    existsOrError(element.field5, 'Número da prestação atual da linha não informado')
                    existsOrError(element.field5, 'Número da prestação atual da linha não informado')
                    existsOrError(element.field7, 'CPF não informado')
                    cpfOrError(element.field7.replace(/([^\d])+/gim, ''), 'CPF inválido')
                    existsOrError(element.field8, 'Valor da parcela da linha não informado')
                    valueOrError(element.field8, 'Valor da parcela da linha inválido')
                } catch (error) {
                    answer = `Erro na linha ${linhas + 1}: ${error} ou incorreto`
                    isValid = false
                    return res.status(400).send(answer);
                }

                linhas++
                answer = `${linhas} linha${linhas > 1 ? 's' : ''} válida${linhas > 1 ? 's' : ''}`

                if (mode === 'executar') {
                    const createdAt = new Date()
                    batchResult.push({
                        seq: element.field1,
                        prz_total: element.field2,
                        prz_reman: element.field3,
                        // contrato: element.field4.replace(/,+/gim, ", "),
                        contrato: element.field4.replace(/([^\d])+/gim, ''),
                        prestacao: element.field5,
                        nome: element.field6,
                        cpf: element.field7.replace(/([^\d])+/gim, ''),
                        v_prestacao: element.field8.replace('R$', '').replace(' ', '').replace('.', '').replace(',', '.'),
                        folha_mes: body.folha_mes,
                        folha_ano: body.folha_ano,
                        id_consignatario: 0,
                        id_convenio: body.id_convenio,
                        status: body.STATUS_ACTIVE,
                        created_at: createdAt,
                        cliente: uParams.cliente
                    })
                    if (linhas === array.length && isValid) {
                        answer += ` inserida${linhas > 1 ? 's' : ''}`
                        const batch = batchResult
                        const tabelaDomain = `${tabela}`
                        let countBatch = 0
                        const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()
                        batchResult.forEach(element => {
                            element.evento = nextEventID.count + 1
                        });
                        let rbp = 0
                        let repetitions = undefined
                        app.db.transaction(async (trx) => {
                            try {
                                req.trx = trx
                                const sql = await app.db(tabelaDomain).transacting(trx).insert(batchResult)
                                console.log(`${batchResult.length} linhas inseridas com sucesso`)

                                await setDomainOwnStatus(req).then(() => {
                                    console.log('Setar o domínio do servidor: sucesso')
                                }).catch((error) =>
                                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (setDomainOwnStatus:${__line}). Error: ${error}`, sConsole: true } })
                                );
                                await setBillingPortionValue(req).then(() => {
                                    console.log('Verificar NÚMERO das parcelas: sucesso')
                                }).catch((error) =>
                                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (setBillingPortionValue:${__line}). Error: ${error}`, sConsole: true } })
                                );
                                await setBillingPortionNumber(req).then(() => {
                                    console.log('Verificar VALOR das parcelas: sucesso')
                                }).catch((error) =>
                                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (setBillingPortionNumber:${__line}). Error: ${error}`, sConsole: true } })
                                );
                                await setConsignatario(uParams.cliente, uParams.dominio, trx).then(() => {
                                    console.log('Setar o banco consignatário: sucesso')
                                }).catch((error) =>
                                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (setConsignatario:${__line}). Error: ${error}`, sConsole: true } })
                                );
                                await getRepeatBillingPortion(req).then((res) => {
                                    rbp = res
                                    console.log('Verificar parcelas em excesso: sucesso')
                                }).catch((error) =>
                                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (getRepeatBillingPortion:${__line}). Error: ${error}`, sConsole: true } })
                                );
                                await setSituacao(req).then(() => {
                                    console.log('Setar a situação 001-Acatar: sucesso')
                                }).catch((error) =>
                                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (setSituacao:${__line}). Error: ${error}`, sConsole: true } })
                                );
                                await setStatusPendente(req).then(() => {
                                    console.log('Setar o status dos sem domínio para 0: sucesso')
                                }).catch((error) =>
                                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (setSituacao:${__line}). Error: ${error}`, sConsole: true } })
                                );
                                if (rbp.length > 0) repetitions = rbp || undefined
                                // registrar o evento na tabela de eventos
                                const { createEvent } = app.api.sisEvents
                                createEvent({
                                    "request": req,
                                    "evento": {
                                        "ip": req.ip,
                                        "id_user": req.user.id,
                                        "evento": `Novos registro de liquidações por arquivo remessa. ${batchResult.length} linhas inseridas`,
                                        "classevento": `conoquidacoes.setInLiquidationsByBatch`,
                                        "id_registro": null
                                    }
                                })
                                await trx.commit();
                                return res.send({ data: answer, isValid, rbp: repetitions });
                            } catch (error) {
                                const errorId = Date.now()
                                app.api.logger.logError({ log: { line: `Error in file: ${__filename} ( Transaction:${__line}). Error Id(${errorId}): ${error}`, sConsole: true } })
                                return res.status(400).send(`Erro na inclusão dos dados. Erro Id: ${errorId}`);
                            }
                        })
                    }
                }
            })
            if (mode === 'validar') return res.send({ data: answer, isValid, lines: linhas });
        })
    }

    /**
     * Corrigir valores diferentes entre liquidações e contratos
     * @returns 
     */
    const setBillingPortionValue = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        if (!(uParams.admin >= 1 || uParams.con_contratos >= 2)) return res.status(401).send('Unauthorized')
        const body = { ...req.body }

        const dominios = await getDomainsByClient(req, res)
        const trx = req.trx
        dominios.forEach(element => {
            const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${element.value}.con_contratos`
            const tabelaCadServidoresDomain = `${dbPrefix}_${uParams.cliente}_${element.value}.cad_servidores`
            const query = app.db.raw(`UPDATE ${tabelaDomain} cc 
                JOIN con_liquidacoes cl ON cl.contrato = cc.contrato
                JOIN ${tabelaCadServidoresDomain} cs ON cs.id = cc.id_cad_servidores
                SET cc.valor_parcela = cl.v_prestacao
                WHERE cc.valor_parcela != cl.v_prestacao AND cc.status = ? AND cl.dominio = ?
                AND cl.folha_ano = ? AND cl.folha_mes = ?`, [STATUS_ACTIVE, element.value, body.folha_ano, body.folha_mes])
                .transacting(trx)
                .then(() => {
                    // registrar o evento na tabela de eventos
                    const { createEvent } = app.api.sisEvents
                    createEvent({
                        "request": req,
                        "evento": {
                            "ip": req.ip,
                            "id_user": user.id,
                            "evento": `Corrigir valores diferentes entre liquidações e contratos`,
                            "classevento": `setBillingPortionValue`,
                            "id_registro": null
                        }
                    })
                })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    return error
                })
        });
        return true;
    }

    /**
     * Detectar e corrigir linhas cobradas em duplicidade. Repetição do contrato e parcela
     * @returns 
     */
    const getRepeatBillingPortion = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        if (!(uParams.admin >= 1 || uParams.con_contratos >= 2)) return res.status(401).send('Unauthorized')
        const body = { ...req.body }

        const actualMonth = moment(`01/${body.folha_mes}/${body.folha_ano}`, 'DD/MM/YYYY')
        const lastMonth = actualMonth.add(-1, 'months').format('MM').toString()
        const trx = req.trx
        let query = await app.db({ clO: 'con_liquidacoes' }).transacting(trx)
            .select('clO.contrato', 'clO.nome', 'clO.dominio', 'clO.v_prestacao', 'clO.prestacao', 'clC.prestacao', 'clC.situacao', 'clC.id')
            .join({ clC: 'con_liquidacoes' }, function () {
                this.on(`clO.contrato`, `=`, `clC.contrato`)
                    .andOn(`clO.folha_ano`, `=`, `clC.folha_ano`)
            })
            .where({
                'clO.folha_ano': body.folha_ano,
                'clO.folha_mes': lastMonth,
                'clC.folha_mes': body.folha_mes,
                'clO.cliente': uParams.cliente,
                'clO.dominio': uParams.dominio
            })
            .having(app.db.raw('clO.prestacao = clC.prestacao'))
        let answer = 'Todos os dados foram lançados e nenhuma parcela foi cobrada em excesso!'
        if (query && query.length > 0) {
            let answer = 'Os seguintes contratos estavam sendo cobrados em duplicidade e foram marcados como excesso de débito:'
            query.forEach(async element => {
                answer += '\n'
                answer += JSON.stringify(element)
                await app.db({ clC: 'con_liquidacoes' })
                    .update({ 'clC.situacao': SIT_EXCESSO_DEBITO })
                    .where({ id: element.id })
            });
        }
        return answer
    }

    /**
     * Corrigir parcelas diferentes entre liquidações e contratos
     * @returns 
     */
    const setBillingPortionNumber = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        if (!(uParams.admin >= 1 || uParams.con_contratos >= 2)) return res.status(401).send('Unauthorized')
        const body = { ...req.body }

        const dominios = await getDomainsByClient(req, res)
        const trx = req.trx
        dominios.forEach(element => {
            const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${element.value}.con_contratos`
            const tabelaCadServidoresDomain = `${dbPrefix}_${uParams.cliente}_${element.value}.cad_servidores`
            const query = app.db.raw(`UPDATE ${tabelaDomain} cc 
                JOIN con_liquidacoes cl ON cl.contrato = cc.contrato
                JOIN ${tabelaCadServidoresDomain} cs ON cs.id = cc.id_cad_servidores
                SET cc.parcela = cl.prestacao
                WHERE cc.parcela != cl.prestacao AND cc.status = ? AND cl.dominio = ?
                AND cl.folha_ano = ? AND cl.folha_mes = ?`, [STATUS_ACTIVE, element.value, body.folha_ano, body.folha_mes])
                .transacting(trx)
                .then((resp) => {
                    // registrar o evento na tabela de eventos
                    const { createEvent } = app.api.sisEvents
                    createEvent({
                        "request": req,
                        "evento": {
                            "ip": req.ip,
                            "id_user": user.id,
                            "evento": `Corrigir parcelas diferentes entre liquidações e contratos`,
                            "classevento": `setBillingPortionNumber`,
                            "id_registro": null
                        }
                    })
                })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    return error
                })
        });
        return true;
    }

    /**
     * Atualizar o domínio, o id_cad_servidores e o status
     * @returns 
     */
    const setDomainOwnStatus = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        if (!(uParams.admin >= 1 || uParams.con_contratos >= 2)) return res.status(401).send('Unauthorized')
        const body = { ...req.body }
        const tabelaDomain = `${dbPrefix}_app.con_liquidacoes`

        const dominios = await getDomainsByClient(req, res)
        const trx = req.trx
        const query = app.db.raw(`UPDATE ${tabelaDomain} cl 
                LEFT JOIN ${tabelaDomain} clo ON clo.contrato = cl.contrato 
                    AND clo.folha_ano = EXTRACT(YEAR FROM DATE_SUB('${body.folha_ano}-${body.folha_mes}-01', INTERVAL 1 MONTH))
                    AND clo.folha_mes = EXTRACT(MONTH FROM DATE_SUB('${body.folha_ano}-${body.folha_mes}-01', INTERVAL 1 MONTH))
                SET cl.id_cad_servidores = clo.id_cad_servidores, cl.dominio = clo.dominio, cl.status = ?
                WHERE cl.folha_ano = ? AND cl.folha_mes = ? AND (cl.dominio IS NULL OR LENGTH(TRIM(cl.dominio)) = 0) AND cl.id_cad_servidores IS NULL`,
            [STATUS_MATCH, body.folha_ano, body.folha_mes]).transacting(trx)
            .then((resp) => {
                // registrar o evento na tabela de eventos
                const { createEvent } = app.api.sisEvents
                createEvent({
                    "request": req,
                    "evento": {
                        "ip": req.ip,
                        "id_user": user.id,
                        "evento": `Atualizar o domínio, o id_cad_servidores e o status`,
                        "classevento": `setDomainOwnStatus`,
                        "id_registro": null
                    }
                })
                // Remove o status 20 dos registros sem domínio
                app.db.raw('UPDATE con_liquidacoes SET STATUS = 0 WHERE (dominio IS NULL OR LENGTH(TRIM(dominio)) = 0)')
                console.log('resp: ', resp[0]);
                return resp[0];
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return error
            })
    }

    const setConsignatario = async (cliente, dominio, trx) => {
        const tabelaDomain = `${dbPrefix}_app.${tabela}`
        const tabelaClienteConsignatariosDomain = `${dbPrefix}_${cliente}_${dominio}.consignatarios`
        try {
            await app.db.raw(`
            UPDATE ${tabelaDomain} cl 
                JOIN ${tabelaClienteConsignatariosDomain} cn ON cn.id_convenio = cl.id_convenio
                SET cl.id_consignatario = cn.id
        `).transacting(trx)
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            return false;
        }
        return true;
    }

    /**
     * Setar a situação 1 em todos que não forem situação excesso de débito
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    const setSituacao = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        if (!(uParams.admin >= 1 || uParams.con_contratos >= 2)) return res.status(401).send('Unauthorized')

        const body = { ...req.body }
        const trx = req.trx
        let query = app.db.raw(`UPDATE con_liquidacoes SET situacao = "1"
                            WHERE status = 20 AND situacao != "1" AND 
                            cliente = ? AND folha_ano = ? AND folha_mes = ?`, [uParams.cliente, body.folha_ano, body.folha_mes])
        query.transacting(trx)
            .then((resp) => {
                // registrar o evento na tabela de eventos
                const { createEvent } = app.api.sisEvents
                createEvent({
                    "request": req,
                    "evento": {
                        "ip": req.ip,
                        "id_user": user.id,
                        "evento": `Setar a situação 1 em todos que não forem situação excesso de débito`,
                        "classevento": `setSituacao`,
                        "id_registro": null
                    }
                })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return error
            })

        return true;
    }

    /**
     * Setar o status para 0(pendente) para todos os que não tiverem domínio
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    const setStatusPendente = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        if (!(uParams.admin >= 1 || uParams.con_contratos >= 2)) return res.status(401).send('Unauthorized')

        const body = { ...req.body }
        const trx = req.trx
        let query = app.db.raw(`UPDATE con_liquidacoes SET status = "0"
                            WHERE cliente = ? AND folha_ano = ? AND folha_mes = ? 
                            AND (dominio is null or length(dominio) = 0)`, [uParams.cliente, body.folha_ano, body.folha_mes])
        query.transacting(trx)
            .then((resp) => {
                // registrar o evento na tabela de eventos
                const { createEvent } = app.api.sisEvents
                createEvent({
                    "request": req,
                    "evento": {
                        "ip": req.ip,
                        "id_user": user.id,
                        "evento": `Setar o status para 0(pendente) para todos os que não tiverem domínio`,
                        "classevento": `setStatusPendente`,
                        "id_registro": null
                    }
                })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return error
            })

        return true;
    }

    const getDomainsByClient = async (req, res) => {
        const user = req.user
        const domains = app.db('params')
            .select('value')
            .where({ meta: 'domainName', dominio: user.cliente })
        return domains
    }

    const saveInConLiquidCli = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        if (!(uParams.admin >= 1 || uParams.con_contratos >= 2)) return res.status(401).send('Unauthorized')
        const tabelaDomainApi = `${dbPrefix}_app.${tabela}`
        // Recupera domínios do cliente
        const dominios = await app.db('params')
            .select({ 'dominios': 'value' })
            .where({ 'dominio': uParams.cliente, 'meta': 'domainName' })
            .orderBy('dominios', 'asc')
        const convenentes = await app.db(tabelaDomainApi).where({ cliente: uParams.cliente, status: STATUS_ACTIVE })
        const countBatch = convenentes.length
        let batchMatch = 0
        let countMatch = 1
        for (const convenente of convenentes) {
            let servidorMatch = false
            for (const dominio of dominios) {
                if (!servidorMatch) {
                    const tabelaCadServidoresCliente = `${dbPrefix}_${uParams.cliente}_${dominio.dominios}.cad_servidores`
                    const tabelaFuncionalCliente = `${dbPrefix}_${uParams.cliente}_${dominio.dominios}.fin_sfuncional`
                    const tabelaFinanceiroCliente = `${dbPrefix}_${uParams.cliente}_${dominio.dominios}.fin_rubricas`
                    const tabelaFinEventosCliente = `${dbPrefix}_${uParams.cliente}_${dominio.dominios}.fin_eventos`
                    const tabelaDomainCliente = `${dbPrefix}_${uParams.cliente}_${dominio.dominios}.${tabela}`
                    let folhaMes = (convenente.folha_mes - 1)
                    folhaMes = folhaMes.toString().padStart(2, '0')
                    // Recupera movimento financeiro do servidor
                    const lastReceipt = await app.db({ cs: tabelaCadServidoresCliente })
                        .select('cs.id', 'ff.ano', 'ff.mes')
                        .join({ ff: tabelaFuncionalCliente }, 'ff.id_cad_servidores', '=', 'cs.id')
                        .where({ 'cs.cpf': convenente.cpf, 'ff.ano': convenente.folha_ano, 'ff.mes': folhaMes })
                        // .where(app.db.raw(`ff.situacaofuncional IS NOT NULL`))
                        // .where(app.db.raw(`ff.situacaofuncional > 0`))
                        .where(app.db.raw(`ff.id_vinculo IN(1,4,5,6)`))
                        .orderBy('ff.ano', 'desc')
                        .orderBy('ff.mes', 'desc')
                        .first()
                    if (lastReceipt && lastReceipt.id) {
                        // Recupera o total bruto de proventos
                        const proventos = await app.db({ fr: tabelaFinanceiroCliente })
                            .select(app.db.raw('SUM(fr.valor) as tProventos'))
                            .join({ fe: tabelaFinEventosCliente }, 'fe.id', '=', 'fr.id_fin_eventos')
                            .where({ 'fr.id_cad_servidores': lastReceipt.id, 'fr.ano': convenente.folha_ano, 'fr.mes': folhaMes }).first()
                        // Verifica se o servidor tem proventos no mês
                        if (proventos.tProventos > convenente.v_prestacao) {
                            servidorMatch = true
                            // Se localizar o servidor não passa para o próximo domínio
                            convenente.id_cad_servidores = lastReceipt.id
                            convenente.updated_at = new Date()
                            convenente.folha_mes = folhaMes
                            delete convenente.cliente
                            delete convenente.dominio
                            delete convenente.id
                            // insere o registro no banco de dados do cliente e dominio
                            await app.db(tabelaDomainCliente)
                                .insert(convenente)
                                .then(async (ret) => {
                                    // registrar o evento na tabela de eventos
                                    const { createEventIns } = app.api.sisEvents
                                    createEventIns({
                                        "notTo": ['created_at', 'evento', 'updated_at'],
                                        "next": convenente,
                                        "request": req,
                                        "evento": {
                                            "evento": `Novo registro de convenente`,
                                            "tabela_bd": tabelaDomainCliente,
                                        }
                                    })
                                    convenente.status = STATUS_MATCH;
                                    // registrar o evento na tabela de eventos
                                    const { createEventUpd } = app.api.sisEvents
                                    const evento = await createEventUpd({
                                        "notTo": ['created_at', 'evento', 'updated_at'],
                                        "last": await app.db(tabelaDomainApi).where({
                                            seq: convenente.seq,
                                            id_cad_servidores: convenente.id_cad_servidores,
                                            contrato: convenente.contrato
                                        }).first(),
                                        "next": convenente,
                                        "request": req,
                                        "evento": {
                                            "evento": `Alteração de liquidação de convenente`,
                                            "tabela_bd": tabelaDomainApi,
                                        }
                                    })
                                    convenente.evento = evento
                                    // Atualiza convenente na tabela API para STATUS_MATCH
                                    await app.db(tabelaDomainApi)
                                        .update({
                                            status: STATUS_MATCH,
                                            dominio: dominio.dominios,
                                            updated_at: new Date()
                                        })
                                        .where({
                                            seq: convenente.seq,
                                            contrato: convenente.contrato
                                        })
                                        .then()
                                        .catch(error => {
                                            app.api.logger.logError({ log: { line: `Erro ao tentar efetuar update em: ${__filename}.${__function}:${__line} ${error}`, sConsole: true } })
                                            
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                                        })
                                    batchMatch++
                                })
                                .catch(error => {
                                    app.api.logger.logError({ log: { line: `Erro ao tentar efetuar insert em: ${__filename}.${__function}:${__line} ${error}`, sConsole: true } })
                                    
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                                })
                        }
                    }
                }
            }
        }
        const batchReturn = await app.db(tabelaDomainApi).where({ cliente: uParams.cliente, status: STATUS_ACTIVE })
        return res.send({
            data: `${batchMatch} de ${countBatch} linhas foram inseridas`,
            linesNoMatch: batchReturn.length,
            batchReturn: batchReturn
        })
    }

    const saveInContract = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        if (!(uParams.admin >= 1 || uParams.con_contratos >= 2)) return res.status(401).send('Unauthorized')
        // Recupera domínios do cliente
        const dominios = await app.db('params')
            .select({ 'dominios': 'value' })
            .where({ 'dominio': uParams.cliente, 'meta': 'domainName' })
            .orderBy('dominios', 'asc')
        let linesAdd = 0
        const batchResult = []
        for (const dominio of dominios) {
            let returnDomain = ''
            const tabelaConsignatariosCliente = `${dbPrefix}_${uParams.cliente}_${dominio.dominios}.consignatarios`
            const tabelaConLiquidacoesApi = `${dbPrefix}_app.con_liquidacoes`
            const tabelaConEventosCliente = `${dbPrefix}_${uParams.cliente}_${dominio.dominios}.con_eventos`
            const tabelaConContratosCliente = `${dbPrefix}_${uParams.cliente}_${dominio.dominios}.con_contratos`

            const liquidacoes = await app.db({ cs: tabelaConLiquidacoesApi })
                .where({ 'folha_ano': uParams.f_ano, 'folha_mes': uParams.f_mes })
            for (const liquidacao of liquidacoes) {
                const consignatario = await app.db(tabelaConsignatariosCliente).where({ id: liquidacao.id_consignatario }).first()
                const conEvento = await app.db({ ce: tabelaConEventosCliente })
                    .select(app.db.raw('MIN(id) id'))
                    .where({ id_consignatario: liquidacao.id_consignatario })
                    .where(app.db.raw(`id NOT IN(SELECT cc.id_con_eventos FROM ${tabelaConContratosCliente} cc 
                        WHERE cc.id_consignatario = ${liquidacao.id_consignatario} AND cc.status = ${STATUS_ACTIVE} 
                        AND cc.id_cad_servidores = ${liquidacao.id_cad_servidores})`)).first()
                const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()
                const vencimento = moment(`${liquidacao.folha_ano}-${(liquidacao.folha_mes).toString().padStart(2, '0')}-10`)
                const primeiroVencimento = vencimento.subtract({ 'months': liquidacao.prestacao }).format('YYYY-MM-DD').toString()
                const dataAverbacao = vencimento.subtract({ 'months': liquidacao.prestacao + 1 }).format('YYYY-MM-DD').toString()
                const dataLiquidacao = liquidacao.prestacao == liquidacao.prz_total ? vencimento.format('YYYY-MM-DD').toString() : null
                const contrato = {
                    status: parcela == parcelas ? STATUS_FINISHED : STATUS_ACTIVE,
                    evento: nextEventID.count + 1,
                    created_at: new Date(),
                    token: randomstring.generate(60),
                    id_user: 2,
                    id_consignatario: liquidacao.id_consignatario,
                    id_cad_servidores: liquidacao.id_cad_servidores,
                    id_con_eventos: conEvento.id,
                    contrato: liquidacao.contrato,
                    primeiro_vencimento: primeiroVencimento,
                    valor_parcela: liquidacao.v_prestacao,
                    parcela: liquidacao.prestacao,
                    parcelas: liquidacao.prz_total,
                    valor_total: liquidacao.prz_total * liquidacao.v_prestacao,
                    valor_liquido: liquidacao.prz_total * liquidacao.v_prestacao,
                    qmar: consignatario.qmar,
                    averbado_online: "1",
                    data_averbacao: dataAverbacao,
                    data_liquidacao: dataLiquidacao
                }
                delete contrato.id
                await app.db(tabelaConContratosCliente)
                    .insert(contrato)
                    .then(ret => {
                        linesAdd++
                        contrato.id = ret[0]
                        // registrar o evento na tabela de eventos
                        const { createEventIns } = app.api.sisEvents
                        createEventIns({
                            "notTo": ['created_at', 'evento', 'updated_at'],
                            "next": contrato,
                            "request": req,
                            "evento": {
                                "evento": `Novo registro de contrato`,
                                "tabela_bd": tabela,
                            }
                        })
                    })
                    .catch(error => {
                        app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                        batchResult.push(error)
                    })
            }
            batchResult.push(`${linesAdd} linhas foram inseridas para ${uParams.cliente} em ${dominio.dominios}`)
            linesAdd = 0
        }
        return res.send(batchResult)
    }

    const getImportToMGFolha = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        if (!(uParams.admin >= 1 || uParams.con_contratos >= 2)) return res.status(401).send('Unauthorized')
        const dominios = await app.db('params')
            .select({ 'dominios': 'value' })
            .where({ 'dominio': uParams.cliente, 'meta': 'domainName' })
            .orderBy('dominios', 'asc')
        const batchResult = []
        for (const dominio of dominios) {
            let returnDomain = ''
            batchResult.push({ dominio: dominio.dominios })
            const tabelaCadServidoresCliente = `${dbPrefix}_${uParams.cliente}_${dominio.dominios}.cad_servidores`
            const tabelaConsignatariosCliente = `${dbPrefix}_${uParams.cliente}_${dominio.dominios}.consignatarios`
            const tabelaConLiquidacoesApi = `${dbPrefix}_app.con_liquidacoes`
            const tabelaBancosCliente = `${dbPrefix}_${uParams.cliente}_${dominio.dominios}.cad_bancos`
            const liquidacoes = await app.db({ cl: tabelaConLiquidacoesApi })
                .select('cl.folha_ano', 'cl.folha_mes', 'cs.matricula', 'cb.febraban', 'cl.prestacao', 'cl.prz_total', 'cl.v_prestacao')
                .join({ cs: tabelaCadServidoresCliente }, 'cs.id', '=', 'cl.id_cad_servidores')
                .join({ ct: tabelaConsignatariosCliente }, 'ct.id', '=', 'cl.id_consignatario')
                .join({ cb: tabelaBancosCliente }, 'cb.id', '=', 'ct.id_cad_bancos')
                .where({
                    'cl.folha_ano': uParams.f_ano,
                    'cl.folha_mes': uParams.f_mes,
                    'cl.dominio': dominio.dominios,
                    'cl.cliente': uParams.cliente,
                })
                .whereIn('cl.status', [STATUS_MATCH])
                .whereIn('cl.situacao', [SITUACAO_ACATADO])
                .orderBy('cs.matricula')
                .orderBy('cb.febraban')
            for (const liquidacao of liquidacoes) {
                const matricula = liquidacao.matricula.toString().padStart(10, '0')
                let thisLine = `${liquidacao.folha_ano};${liquidacao.folha_mes};${matricula};`
                thisLine += `${liquidacao.febraban};${liquidacao.prestacao},${liquidacao.prz_total};${liquidacao.v_prestacao}`
                batchResult.push(thisLine)
            }
        }
        return res.send(batchResult)
    }

    const limit = 20 // usado para paginação
    const get = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        try {
            // Alçada para exibição
            // let pode = (uParams && (uParams.admin >= 1 || (uParams.tipoUsuario >= 1 && uParams.gestor >= 1)))
            // app.api.logger.logInfo({ log: { line: `Tentativa de acesso por: ${JSON.stringify(uParams)}. Permissão: "${pode}"`, sConsole: true } })
            isMatchOrError((uParams && (uParams.admin >= 1 || (uParams.tipoUsuario >= 1 && uParams.gestor >= 1))), `${noAccessMsg} "Exibição de linhas de liquidação de contrato de consignação"`)
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            return res.status(401).send(error)
        }
        const page = req.query.page || 1
        const tabelaDomain = `${dbPrefix}_app.${tabela}`
        const tabelaConsignatarioDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.consignatarios`
        const tabelaBancosDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.cad_bancos`
        const optionStatus = req.query.optionStatus || 10
        const optionSituacoes = req.query.optionSituacoes && req.query.optionSituacoes.length > 0 ? req.query.optionSituacoes : undefined
        const key = req.query.key || ''
        const optionsBancos = req.query.optionsBancos ? req.query.optionsBancos : undefined
        let dominio
        let cliente
        if (uParams.admin >= 1) {
            dominio = req.query.dominio
            cliente = req.query.cliente || ''
        }
        else if (uParams.tipoUsuario >= 1 && uParams.gestor >= 1) {
            if (uParams.multiCliente >= 1) {
                dominio = req.query.dominio
            }
            if (uParams.multiCliente >= 2) {
                cliente = req.query.cliente || ''
            } else cliente = uParams.cliente
        }

        const cpf = key.replace(/([^\d])+/gim, "") || ''

        let sql = app.db({ cl: tabelaDomain })
            .select(app.db.raw('count(*) as count'))
            .join({ 'co': tabelaConsignatarioDomain }, 'co.id', '=', 'cl.id_consignatario')
            .join({ 'cb': tabelaBancosDomain }, 'cb.id', '=', 'co.id_cad_bancos')
            .where(app.db.raw(`cl.status in(${optionStatus})`))
        if (optionsBancos != undefined)
            sql.andWhere({ 'cb.febraban': optionsBancos })
        if (uParams.admin < 1) {
            sql.where({ 'cl.id_consignatario': uParams.consignatario })
        }
        if (dominio == "*") sql.where({ 'cl.dominio': '' })
        if (!["*", "-1"].includes(dominio)) sql.where({ 'cl.dominio': dominio })
        if (cliente.length > 0) sql.where({ 'cl.cliente': cliente })
        if (optionSituacoes >= 0) sql.where({ 'cl.situacao': optionSituacoes })
        sql.where(function () {
            if (cpf.length > 0)
                this.where(app.db.raw(`cl.contrato like '%${key}%'`))
                    .orWhere(app.db.raw(`cl.cpf like '%${cpf}%'`))
                    .orWhere(app.db.raw(`cl.nome like '%${key}%'`))
                    .orWhere(app.db.raw(`concat(cl.folha_mes,'/',cl.folha_ano) = '${key}'`))
            else
                this.where(app.db.raw(`cl.contrato like '%${key}%'`))
                    .orWhere(app.db.raw(`cl.nome like '%${key}%'`))
                    .orWhere(app.db.raw(`concat(cl.folha_mes,'/',cl.folha_ano) = '${key}'`))
        })
        const result = await app.db.raw(sql.toString())
        const count = parseInt(result[0][0].count) || 0

        let ret = app.db({ cl: tabelaDomain })
            .select(app.db.raw('cl.*'), 'cb.febraban')
            .join({ 'co': tabelaConsignatarioDomain }, 'co.id', '=', 'cl.id_consignatario')
            .join({ 'cb': tabelaBancosDomain }, 'cb.id', '=', 'co.id_cad_bancos')
            .where(app.db.raw(`cl.status in(${optionStatus})`))
        if (optionsBancos != undefined)
            ret.andWhere({ 'cb.febraban': optionsBancos })
        if (uParams.admin < 1) {
            ret.where({ id_consignatario: uParams.consignatario })
        }
        if (dominio == "*") ret.where({ 'cl.dominio': '' })
        if (!["*", "-1"].includes(dominio)) ret.where({ 'cl.dominio': dominio })
        if (cliente.length > 0) ret.where({ 'cl.cliente': cliente })
        if (optionSituacoes >= 0) ret.where({ 'cl.situacao': optionSituacoes })
        ret.where(function () {
            if (cpf.length > 0)
                this.where(app.db.raw(`cl.contrato like '%${key}%'`))
                    .orWhere(app.db.raw(`cl.cpf like '%${cpf}%'`))
                    .orWhere(app.db.raw(`cl.nome like '%${key}%'`))
                    .orWhere(app.db.raw(`concat(cl.folha_mes,'/',cl.folha_ano) = '${key}'`))
            else
                this.where(app.db.raw(`cl.contrato like '%${key}%'`))
                    .orWhere(app.db.raw(`cl.nome like '%${key}%'`))
                    .orWhere(app.db.raw(`concat(cl.folha_mes,'/',cl.folha_ano) = '${key}'`))
        })
            .limit(limit).offset(page * limit - limit)
            .orderBy('folha_ano', 'desc')
            .orderBy('folha_mes', 'desc')
            .orderBy('nome')
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
            isMatchOrError((uParams && (uParams.admin >= 1 || (uParams.tipoUsuario >= 1 && uParams.gestor >= 1))), `${noAccessMsg} "Exibição de linha de liquidação de contrato de consignação"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_app.${tabela}`
        const ret = app.db(tabelaDomain)
            .where({ id: req.params.id })
            .first()
            .then(body => {
                return res.json({ data: body })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                    return res.status(500).send(error)
            })
    }

    const getPendding = async (req, res) => {
        const tabelaDomain = `${dbPrefix}_app.${tabela}`
        const id_convenio = req.query.id_convenio || undefined

        try {
            existsOrError(id_convenio && id_convenio > 0, 'Consignatário não informado')
        } catch (error) {
            return res.status(400).send(error);
        }
        app.db(tabelaDomain).count({ count: 'id' })
            .where({ status: STATUS_ACTIVE, id_convenio: id_convenio })
            .first()
            .then((body) => {
                return res.json(body.count)
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                    return res.status(500).send(error)
            })
    }

    const getByField = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
        const field = req.query.field
        const filter = req.query.filter
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.admin >= 1 || (uParams.tipoUsuario >= 1 && uParams.gestor >= 1), `${noAccessMsg} "Exibição de ${field} de ${tabela}"`)
        } catch (error) {
            return res.status(401).send(error)
        }

        const tabelaDomain = `${dbPrefix}_app.${tabela}`
        let sql = app.db(tabelaDomain).select([field])
        if (field && filter) sql.where({
            [field]: filter
        })
        sql.orderBy(field).groupBy(field)
        sql.then(body => res.json({ data: body }))
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                    return res.status(500).send(error)
            })
    }

    const getByFunction = async (req, res) => {
        const func = req.params.func
        switch (func) {
            // case 'scl0':
            //     saveInConLiquidCliByContract(req, res)
            //     break;
            case 'scl':
                saveInConLiquidCli(req, res)
                break;
            case 'gic':
                saveInContract(req, res)
                break;
            case 'gimf':
                getImportToMGFolha(req, res)
                break;
            case 'gPndd':
                getPendding(req, res)
                break;
            case 'gbf':
                getByField(req, res)
                break;
            default:
                res.status(404).send('Função inexitente')
                break;
        }
    }

    return { save, get, getById, getByFunction } //get, getById, remove,
}