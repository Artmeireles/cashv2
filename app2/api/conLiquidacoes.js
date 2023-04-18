const moment = require('moment')
const randomstring = require("randomstring")
const client = require("basic-ftp")
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
    const ftpClient = new client.Client()
    ftpClient.ftp.verbose = true

    const save = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
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

        const tabelaDomain = `${dbPrefix}_api.${tabela}`
        if (req.params.id) body.id = req.params.id
        if (body.id) {
            // Edição unitária de registro de liquidação
            try {
                const cpf = body.cpf.replace(/([^\d])+/gim, '')
                existsOrError(body.id_consignatario, 'Consignatário(banco) não informado')
                cpfOrError(cpf, 'CPF inválido ou não informado')
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
                existsOrError(body.v_pagar, 'Valor a pagar não informado')
                valueOrError(body.v_pagar, 'Valor a pagar inválido')
                existsOrError(body.situacao, 'Situação da liquidação não informada')
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
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
            existsOrError(rowsUpdated, 'Contrato não foi encontrado')
        } else {
            try {
                existsOrError(body.liquidacoes, 'Linhas do lote de liquidações não informadas')
                existsOrError(body.id_consignatario, 'Banco consignatário não informado')
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
        const uParams = await app.db('users').where({ id: user.id }).first();
        if (!(uParams.admin >= 1 || uParams.con_contratos >= 2)) return res.status(401).send('Unauthorized')
        const body = { ...req.body }
        const mode = body.mode
        let isValid = true
        let batchResult = []

        /**
         * Inclusão de lote de registro de liquidação seguindo a seguinte ordem de colunas conforme remetido em março de 2021
         * Seq;Prz Total;Prz Reman;Contrato;Nº Prest;Nome;CPF;Valor Prest;Valor a Pagar;Situação de Desconto;Competencia
         * !!! Importante: Não informar cabeçalhos de colunas
         * !!! Importante 02: Valores em formato 0.00
         */
        csv({ noheader: true, output: "json", delimiter: ";", trim: true, }).fromString(body.liquidacoes).then(csvRow => {
            // Variáveis da criação de um novo registro
            let linhas = 0
            let answer = ''
            csvRow.forEach(async (element, index, array) => {
                try {
                    const cpf = element.field7.replace(/([^\d])+/gim, '')
                    cpfOrError(cpf, 'CPF inválido ou não informado')
                } catch (error) {
                    answer = `Erro na linha ${linhas + 1}: ${error}`
                    isValid = false
                    return res.status(400).send(answer);
                }
                try {
                    const mesAno = element.field11.replace(/([^\d])+/gim, '')
                    lengthOrError(mesAno, 6, 'Mês/Ano (MM/AAAA) da linha não informado ou incorreto')
                } catch (error) {
                    answer = `Erro na linha ${linhas + 1}: ${error}`
                    isValid = false
                    return res.status(400).send(answer);
                }
                try {
                    existsOrError(element.field1, 'Número sequencial da linha não informado')
                    existsOrError(element.field2, 'Prazo total da linha não informado')
                    existsOrError(element.field3, 'Prazo remanescente da linha não informado')
                    existsOrError(element.field4, 'Número de contrato da linha não informado')
                    existsOrError(element.field5, 'Número da prestação atual da linha não informado')
                    existsOrError(element.field8, 'Valor da parcela da linha não informado')
                    valueOrError(element.field8, 'Valor da parcela da linha inválido')
                    existsOrError(element.field9, 'Valor a pagar da linha não informado')
                    valueOrError(element.field9, 'Valor a pagar da linha inválido')
                    existsOrError(element.field10, 'Situação da liquidação da linha não informada')
                } catch (error) {
                    answer = `Erro na linha ${linhas + 1}: ${error} ou incorreto`
                    isValid = false
                    return res.status(400).send(answer);
                }

                linhas++
                answer = `${linhas} linha${linhas > 1 ? 's' : ''} válida${linhas > 1 ? 's' : ''}`

                if (mode === 'executar') {
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
                        v_pagar: element.field9.replace('R$', '').replace(' ', '').replace('.', '').replace(',', '.'),
                        situacao: element.field10,
                        folha_mes: element.field11.substring(0, 2),
                        folha_ano: element.field11.substring(3, 7),
                        id_consignatario: body.id_consignatario,
                    })
                    if (linhas === array.length && isValid) {
                        if (mode == 'executar') answer += ` inserida${linhas > 1 ? 's' : ''}`
                        const batch = batchResult
                        const tabelaDomain = `${tabela}`
                        let countBatch = 0
                        for (let obj in batch) {
                            const body = batch[obj];

                            let nextDate = moment(`01/${body.folha_mes}/${body.folha_ano}`, 'DD/MM/YYYY')
                            nextDate = nextDate.add(-1, 'months')
                            body.folha_mes = moment(nextDate).format('MM')
                            body.folha_ano = moment(nextDate).format('YYYY')

                            const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()

                            body.evento = nextEventID.count + 1
                            // Variáveis da criação de um novo registro
                            body.status = STATUS_ACTIVE
                            body.created_at = new Date()
                            body.cliente = uParams.cliente
                            const sql = app.db(tabelaDomain)
                                .insert(body)
                            sql.then(ret => {
                                countBatch++
                                body.id = ret[0]
                                // registrar o evento na tabela de eventos
                                const { createEventIns } = app.api.sisEvents
                                createEventIns({
                                    "notTo": ['created_at', 'evento', 'updated_at'],
                                    "next": body,
                                    "request": req,
                                    "evento": {
                                        "evento": `Novo registro de convenente`,
                                        "tabela_bd": tabela,
                                    }
                                })
                            })
                                .catch(error => {
                                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                                    return res.status(500).send(error)
                                })
                        }
                        let repetitions = undefined
                        if (countBatch + 1 === batch.length) {
                            const bpv = await setBillingPortionValue(req)
                            const bpn = await setBillingPortionNumber(req)
                            const bdos = await setDomainOwnStatus(req)
                            const rbp = await getRepeatBillingPortion(req)
                            if (bpv != true) answer += bpv
                            if (bpn != true) answer += bpn
                            if (bdos != true) answer += bdos
                            if (rbp.length > 0) repetitions = rbp
                        }
                        return res.send({ data: answer, isValid, batchResult: batchResult, rbp: repetitions });
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
        const uParams = await app.db('users').where({ id: user.id }).first();
        if (!(uParams.admin >= 1 || uParams.con_contratos >= 2)) return res.status(401).send('Unauthorized')
        const body = { ...req.body }

        const dominios = await getDomainsByClient(req, res)
        dominios.forEach(element => {
            const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${element.value}.con_contratos`
            const tabelaCadServidoresDomain = `${dbPrefix}_${uParams.cliente}_${element.value}.cad_servidores`
            const query = app.db.raw(`UPDATE ${tabelaDomain} cc 
                JOIN con_liquidacoes cl ON cl.contrato = cc.contrato
                JOIN ${tabelaCadServidoresDomain} cs ON cs.id = cc.id_cad_servidores
                SET cc.valor_parcela = cl.v_prestacao
                WHERE cc.valor_parcela != cl.v_prestacao AND cc.status = ? AND cl.dominio = ?
                AND cl.folha_ano = ? AND cl.folha_mes = ?`, [STATUS_ACTIVE, element.value, body.folha_ano, body.folha_mes])
            query.then(() => {
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
        const uParams = await app.db('users').where({ id: user.id }).first();
        if (!(uParams.admin >= 1 || uParams.con_contratos >= 2)) return res.status(401).send('Unauthorized')
        const body = { ...req.body }

        const actualMonth = moment(`01/${body.folha_mes}/${body.folha_ano}`, 'DD/MM/YYYY')
        const lastMonth = actualMonth.add(-1, 'months').format('MM').toString()
        let query = await app.db({ clO: 'con_liquidacoes' })
            .select('clO.contrato', 'clO.nome', 'clO.dominio', 'clO.v_prestacao', 'clO.prestacao', 'clC.prestacao', 'clC.situacao', 'clC.id')
            .join({ clC: 'con_liquidacoes' }, function () {
                this.on(`clO.contrato`, `=`, `clC.contrato`)
                    .andOn(`clO.folha_ano`, `=`, `clC.folha_ano`)
            })
            .where({
                'clO.folha_ano': body.folha_ano,
                'clO.folha_mes': lastMonth,
                'clC.folha_mes': body.folha_mes
            })
            .having(app.db.raw('clO.prestacao = clC.prestacao'))
        let answer = 'Os seguintes contratos estavam sendo cobrados em duplicidade e foram marcados como excesso de débito:'
        query.forEach(async element => {
            answer += '\n'
            answer += JSON.stringify(element)
            await app.db({ clC: 'con_liquidacoes' })
                .update({ 'clC.situacao': SIT_EXCESSO_DEBITO })
                .where({ id: element.id })
        });
        return answer
    }

    /**
     * Corrigir parcelas diferentes entre liquidações e contratos
     * @returns 
     */
    const setBillingPortionNumber = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        if (!(uParams.admin >= 1 || uParams.con_contratos >= 2)) return res.status(401).send('Unauthorized')
        const body = { ...req.body }

        const dominios = await getDomainsByClient(req, res)
        dominios.forEach(element => {
            const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${element.value}.con_contratos`
            const tabelaCadServidoresDomain = `${dbPrefix}_${uParams.cliente}_${element.value}.cad_servidores`
            const query = app.db.raw(`UPDATE ${tabelaDomain} cc 
                JOIN con_liquidacoes cl ON cl.contrato = cc.contrato
                JOIN ${tabelaCadServidoresDomain} cs ON cs.id = cc.id_cad_servidores
                SET cc.parcela = cl.prestacao
                WHERE cc.parcela != cl.prestacao AND cc.status = ? AND cl.dominio = ?
                AND cl.folha_ano = ? AND cl.folha_mes = ?`, [STATUS_ACTIVE, element.value, body.folha_ano, body.folha_mes])
            query.then((resp) => {
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
        const uParams = await app.db('users').where({ id: user.id }).first();
        if (!(uParams.admin >= 1 || uParams.con_contratos >= 2)) return res.status(401).send('Unauthorized')
        const body = { ...req.body }
        const tabelaDomain = `${dbPrefix}_api.con_liquidacoes`

        const dominios = await getDomainsByClient(req, res)
        // dominios.forEach(element => {
        // const tabelaContratosDomain = `${dbPrefix}_${uParams.cliente}_${element.value}.con_contratos`
        const query = app.db.raw(`UPDATE ${tabelaDomain} cl 
                LEFT JOIN ${tabelaDomain} clo ON clo.contrato = cl.contrato 
                    AND clo.folha_ano = EXTRACT(YEAR FROM DATE_SUB('${body.folha_ano}-${body.folha_mes}-01', INTERVAL 1 MONTH))
                    AND clo.folha_mes = EXTRACT(MONTH FROM DATE_SUB('${body.folha_ano}-${body.folha_mes}-01', INTERVAL 1 MONTH))
                SET cl.id_cad_servidores = clo.id_cad_servidores, cl.dominio = clo.dominio, cl.status = ?
                WHERE cl.folha_ano = ? AND cl.folha_mes = ? AND (cl.dominio IS NULL OR LENGTH(TRIM(cl.dominio)) = 0) AND cl.id_cad_servidores IS NULL`,
            [STATUS_MATCH, body.folha_ano, body.folha_mes])
        query.then((resp) => {
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
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return error
            })
        // });
        return true;
    }

    const getDomainsByClient = async (req, res) => {
        const user = req.user
        return app.db('params')
            .select('value')
            .where({ meta: 'domainName', dominio: user.cliente })
    }

    const saveInConLiquidCli = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        if (!(uParams.admin >= 1 || uParams.con_contratos >= 2)) return res.status(401).send('Unauthorized')
        const tabelaDomainApi = `${dbPrefix}_api.${tabela}`
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
                        if (proventos.tProventos > convenente.v_pagar) {
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
                                            app.api.logger.logError({ log: { line: `Erro ao tentar efetuar update em: ${__filename}.${__function} ${error}`, sConsole: true } })
                                            return res.status(500).send(error)
                                        })
                                    batchMatch++
                                })
                                .catch(error => {
                                    app.api.logger.logError({ log: { line: `Erro ao tentar efetuar insert em: ${__filename}.${__function} ${error}`, sConsole: true } })
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
        const uParams = await app.db('users').where({ id: user.id }).first();
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
            const tabelaConLiquidacoesApi = `${dbPrefix}_api.con_liquidacoes`
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
                    valor_parcela: liquidacao.v_pagar,
                    parcela: liquidacao.prestacao,
                    parcelas: liquidacao.prz_total,
                    valor_total: liquidacao.prz_total * liquidacao.v_pagar,
                    valor_liquido: liquidacao.prz_total * liquidacao.v_pagar,
                    qmar: consignatario.qmar,
                    averbado_online: 1,
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
        const uParams = await app.db('users').where({ id: user.id }).first();
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
            batchResult.push({ dominio: dominio.dominios })
            const tabelaCadServidoresCliente = `${dbPrefix}_${uParams.cliente}_${dominio.dominios}.cad_servidores`
            const tabelaConsignatariosCliente = `${dbPrefix}_${uParams.cliente}_${dominio.dominios}.consignatarios`
            const tabelaConLiquidacoesApi = `${dbPrefix}_api.con_liquidacoes`
            const tabelaBancosCliente = `${dbPrefix}_${uParams.cliente}_${dominio.dominios}.cad_bancos`
            const liquidacoes = await app.db({ cl: tabelaConLiquidacoesApi })
                .select('cl.folha_ano', 'cl.folha_mes', 'cs.matricula', 'cb.febraban', 'cl.prestacao', 'cl.prz_total', 'cl.v_pagar')
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
                thisLine += `${liquidacao.febraban};${liquidacao.prestacao},${liquidacao.prz_total};${liquidacao.v_pagar}`
                batchResult.push(thisLine)
            }
        }
        return res.send(batchResult)
    }

    const limit = 20 // usado para paginação
    const get = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
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
        const tabelaDomain = `${dbPrefix}_api.${tabela}`
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
                return res.status(500).send(error)
            })
    }

    const getById = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError((uParams && (uParams.admin >= 1 || (uParams.tipoUsuario >= 1 && uParams.gestor >= 1))), `${noAccessMsg} "Exibição de linha de liquidação de contrato de consignação"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_api.${tabela}`
        const ret = app.db(tabelaDomain)
            .where({ id: req.params.id })
            .first()
            .then(body => {
                return res.json({ data: body })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getPendding = async (req, res) => {
        const tabelaDomain = `${dbPrefix}_api.${tabela}`
        const id_consignatario = req.query.id_consignatario || undefined

        try {
            existsOrError(id_consignatario && id_consignatario > 0, 'Consignatário não informado')
        } catch (error) {
            return res.status(400).send(error);
        }
        app.db(tabelaDomain).count({ count: 'id' })
            .where({ status: STATUS_ACTIVE, id_consignatario: id_consignatario })
            .first()
            .then((body) => {
                return res.json(body.count)
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getByField = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        const field = req.query.field
        const filter = req.query.filter
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.admin >= 1 || (uParams.tipoUsuario >= 1 && uParams.gestor >= 1), `${noAccessMsg} "Exibição de ${field} de ${tabela}"`)
        } catch (error) {
            return res.status(401).send(error)
        }

        const tabelaDomain = `${dbPrefix}_api.${tabela}`
        let sql = app.db(tabelaDomain).select([field])
        if (field && filter) sql.where({
            [field]: filter
        })
        sql.orderBy(field).groupBy(field)
        sql.then(body => res.json({ data: body }))
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
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