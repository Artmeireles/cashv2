const moment = require('moment')
const randomstring = require("randomstring")
const { dbPrefix } = require("../.env")
const accents = require('remove-accents')

module.exports = app => {
    const { existsOrError, booleanOrError, notExistsOrError, equalsOrError, emailOrError, isMatchOrError, diffOrError, noAccessMsg } = app.api.validation
    const { mailyCliSender } = app.api.mailerCli
    const tabelaClasses = 'cad_classes'
    const tabelaReferencias = 'fin_referencias'
    const tabelaParametros = 'fin_parametros'
    const tabelaFuncional = 'fin_sfuncional'
    const tabelaServidores = 'cad_servidores'
    const tabelaRubricas = 'fin_rubricas'
    const tabelaEventos = 'fin_eventos'
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99

    const getByFunction = async (req, res) => {
        const func = req.params.func
        switch (func) {
            case 'gfl':
                gerarFolha(req, res)
                break;
            case 'grf':
                getReferencias(req, res)
                break;
            default:
                res.status(404).send('Função inexitente')
                break;
        }
    }

    /**
     * Executa de forma assíncrona as operações de geração da folha
     * Baseasse na folha atual do req.user.f_[ano|mes|complementar]
     */
    const gerarFolha = async (req, res) => {
        const body = { ...req.body }
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError((uParams.financeiro && uParams.financeiro >= 3), `${noAccessMsg} "Consulta de referência financeira"`)
        } catch (error) {
            res.status(401).send(error)
        }
        try {
            booleanOrError(body.proximaFolha, 'Se está gerando a próxima folha não foi informado')
            existsOrError(body.nextComplementar, 'Complementar desejada não informada')
            isMatchOrError(!(body.nextComplementar != '000' && body.proximaFolha === true), `Para gerar uma folha complementar você deve estar acessando o mês pretendido`)
        } catch (error) {
            res.status(400).send(error)
        }
        // Para evitar repetição de consulta a dados do usuário, eles são armazenados como objeto da request
        // e assim podem ser utilizados durante a execução
        req.uParams = uParams
        // Determinar os parâmetros da folha a ser gerada
        const f_ano = req.user.f_ano
        const f_mes = req.user.f_mes
        let nextDate = moment(`01/${f_mes}/${f_ano}`, 'DD/MM/YYYY')
        // Adiciona um mês ao parâmetro da folha a ser gerada caso body.proximaFolha === true 
        if (body.proximaFolha === true) nextDate = nextDate.add(1, 'months')
        const nextYear = moment(nextDate).format('YYYY')
        const nextMonth = moment(nextDate).format('MM')
        const nextComplementar = body.nextComplementar
        try {
            let fechaFolha = body.proximaFolha
            let funcional = true
            let geraParametro = true
            let proventosIniciais = undefined
            // Gera ou atualiza e retorna do BD os dados do parâmetro da folha
            geraParametro = await setParametro(req, res)
            // O ano, mês e complementar das próximas funções será definido aqui
            // e armazenado como variáveis da requisição
            req.ano = geraParametro.ano
            req.mes = geraParametro.mes
            req.complementar = geraParametro.complementar
            req.ano_informacao = geraParametro.ano_informacao
            req.mes_informacao = geraParametro.mes_informacao
            req.complementar_informacao = geraParametro.complementar_informacao

            // Fechas as demais folhas
            if (body.proximaFolha === true && Number(body.nextComplementar) === 0)
                fechaFolha = await fechaFolhas(req, res)
            // Gera em BD os dados funcionais
            funcional = await setFuncional(req, res)
            // Gera em BD os proventos iniciais (001,002,003) para folhas regulares
            if (Number(body.nextComplementar) === 0)
                proventosIniciais = await setProventosIniciais(req, res)
            res.send({ geraParametro, fechaFolha, funcional, proventosIniciais })
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } });
            res.status(500).send(`Erro ao tentar gerar a folha ${nextMonth}|${nextYear}|${nextComplementar}. Erro: ${error}`)
        }
    }

    /**
     * Insere ou edita um parâmetro financeiro
     * Baseasse na folha atual do req.user.f_[ano|mes|complementar]
     */
    const setParametro = async (req, res) => {
        const body = { ...req.body }
        const uParams = req.uParams
        const f_ano = req.user.f_ano
        const f_mes = req.user.f_mes
        const f_complementar = req.user.f_complementar
        const tabelaDomainParametros = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabelaParametros}`
        let nextDate = moment(`01/${f_mes}/${f_ano}`, 'DD/MM/YYYY')
        if (body.proximaFolha === true) nextDate = nextDate.add(1, 'months')
        const nextDay = moment(nextDate).format('DD')
        const nextMonth = moment(nextDate).format('MM')
        const nextMonthExtensive = moment(nextDate).locale('pt-br').format('MMMM').toLocaleUpperCase()
        const nextYear = moment(nextDate).format('YYYY')
        const descricaoComplementar = Number(body.nextComplementar) > 0 ? ` COMPLEMENTAR ${Number(body.nextComplementar)}` : " REGULAR"
        const last = await app.db(tabelaDomainParametros)
            .where({ ano: f_ano, mes: f_mes, complementar: f_complementar })
            .first()
        // Folhas complementares terão como mês base o ano/mês atual e complementar '000'
        //  e não o ano/mês/complementar de informação
        if (Number(body.nextComplementar) > 0) {
            last.ano_informacao = f_ano
            last.mes_informacao = f_mes
            last.complementar_informacao = '000'
        }
        last.ano = nextYear
        last.mes = nextMonth
        last.complementar = body.nextComplementar
        last.d_situacao = `${nextDay}/${nextMonth}/${nextYear}`
        last.descricao = `FOLHA${descricaoComplementar} DE ${accents.remove(`${nextMonthExtensive} ${last.ano}`)}`
        last.mensagem = accents.remove(last.mensagem)
        last.mensagem_aniversario = accents.remove(last.mensagem_aniversario)
        const exists = await app.db(tabelaDomainParametros)
            .where({
                ano: last.ano,
                mes: last.mes,
                complementar: last.complementar
            })
            .first()
        const upd = app.db(tabelaDomainParametros)
        try {
            if (exists) {
                // Folhas complementares terão como mês base o ano/mês atual e complementar '000'
                //  e não o ano/mês/complementar de informação
                if (Number(body.nextComplementar) > 0) {
                    exists.ano_informacao = f_ano
                    exists.mes_informacao = f_mes
                    exists.complementar_informacao = '000'
                }
                exists.descricao = `FOLHA${descricaoComplementar} DE ${accents.remove(`${nextMonthExtensive} ${exists.ano}`)}`
                const before = exists
                // Variáveis da edição de um registro
                // registrar o evento na tabela de eventos
                const { createEventUpd } = app.api.sisEvents
                const evento = await createEventUpd({
                    "notTo": ['created_at', 'evento', 'updated_at', 'id'],
                    "last": before,
                    "next": exists,
                    "request": req,
                    "evento": {
                        "evento": `Alteração autônoma de parâmetro financeiro`,
                        "tabela_bd": tabelaParametros,
                    }
                })
                exists.updated_at = new Date()
                exists.situacao = 1
                exists.status = STATUS_ACTIVE
                exists.evento = evento
                await upd.update(exists).where({ id: exists.id })
                return exists
            } else {
                delete last.id
                delete last.updated_at
                const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()
                last.evento = nextEventID.count + 1
                last.situacao = 1
                last.created_at = new Date()
                last.status = STATUS_ACTIVE
                const { createEventIns } = app.api.sisEvents
                createEventIns({
                    "notTo": ['created_at', 'evento', 'updated_at'],
                    "next": last,
                    "request": req,
                    "evento": {
                        "evento": `Novo registro autônomo de parâmetro financeiro`,
                        "tabela_bd": tabelaParametros,
                    }
                })
                await upd.insert(last)
                return last
            }
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } });
            res.status(500).send(`Erro ao tentar criar/editar o parâmetro de folha ${f_mes}|${f_ano}|${f_complementar}. Erro: ${error}`)
        }
    }

    /**
     * !!! Esta operação não atende clientes que nunca tiveram uma folha gerada
     * !!! pois a última folha gerada será a base para todas as operações desta função
     * 
     * Por meio de uma bd.transaction, localiza a folha informação,
     * edita os valores de folha informação e corrente, exclui os
     * registros s_funcional existentes e insere os dados de acordo com
     * a folha informação
     * Baseasse na folha atual do req.user.f_[ano|mes|complementar]
     */
    const setFuncional = async (req, res) => {
        const body = { ...req.body }
        const uParams = req.uParams
        const f_ano = req.ano
        const f_mes = req.mes
        const f_ano_informacao = req.ano_informacao
        const f_mes_informacao = req.mes_informacao
        const f_complementar_informacao = req.complementar_informacao
        const tabelaDomainFuncional = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabelaFuncional}`
        let nextDate = moment(`01/${f_mes}/${f_ano}`, 'DD/MM/YYYY')
        if (body.proximaFolha === true) nextDate = nextDate.add(1, 'months')
        const nextMonth = moment(nextDate).format('MM')
        const nextYear = moment(nextDate).format('YYYY')
        try {
            // console.log(app.db({ fs: tabelaDomainFuncional })
            //     .where({ ano: f_ano_informacao, mes: f_mes_informacao, complementar: f_complementar_informacao }).toString());
            const sqlFuncional = await app.db({ fs: tabelaDomainFuncional })
                .where({ ano: f_ano_informacao, mes: f_mes_informacao, complementar: f_complementar_informacao })
            // registrar o evento na tabela de eventos
            const { createEvent } = app.api.sisEvents
            const evento = await createEvent({
                "request": req,
                "evento": {
                    "ip": req.ip,
                    "id_user": uParams.id,
                    "evento": `Inclusão autônoma de dados funcionais. ${sqlFuncional.length} serão percorridos.`,
                    "classevento": `folha.setFuncional`,
                    "id_registro": null
                }
            })
            await app.db.transaction(async trx => {
                // Excluir os lançamentos existentes
                await app.db(tabelaDomainFuncional)
                    .where({ ano: nextYear, mes: nextMonth, complementar: body.nextComplementar })
                    .del().transacting(trx)
                const generalUpdate = {
                    created_at: new Date(),
                    status: STATUS_ACTIVE,
                    evento: evento,
                    ano: nextYear,
                    mes: nextMonth,
                    complementar: body.nextComplementar
                }
                sqlFuncional.forEach(element => {
                    delete element.id
                    delete element.updated_at
                    element.created_at = generalUpdate.created_at
                    element.status = generalUpdate.status
                    element.evento = generalUpdate.evento
                    element.ano = generalUpdate.ano
                    element.mes = generalUpdate.mes
                    element.complementar = generalUpdate.complementar
                });
                await app.db(tabelaDomainFuncional).insert(sqlFuncional).transacting(trx)
            })

            let p = ''
            let pp = ''
            if (sqlFuncional.length > 1) {
                p = 's';
                pp = 'is';
            } else { pp = 'l'; }
            return `${sqlFuncional.length} linha${p} funciona${pp} inserida${p}`
        } catch (error) {
            res.status(500).send(`Erro ao tentar inserir/editar o funcional dos servidores. Erro: ${error}`)
        }
    }

    const setProventosIniciais = async (req, res) => {
        const body = { ...req.body }
        const uParams = req.uParams
        const f_ano = req.ano
        const f_mes = req.mes
        const f_complementar = req.complementar
        const tabelaDomainFuncional = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabelaFuncional}`
        const tabelaDomainRubricas = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabelaRubricas}`
        const tabelaDomainServidores = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabelaServidores}`
        const tabelaDomainEventos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabelaEventos}`

        try {
            // console.log(app.db({ ff: tabelaDomainFuncional })
            // .select('c.id', 'c.matricula', 'c.d_admissao', 'ff.id_pccs', 'ff.id_vinculo', 'ff.situacao')
            // .join({ c: tabelaDomainServidores }, 'ff.id_cad_servidores', '=', 'c.id')
            // .where({ ano: f_ano, mes: f_mes, complementar: f_complementar })
            // .having('ff.id_pccs', '>', '0')
            // .having('ff.id_vinculo', '>=', '0')
            // .having('ff.situacao', '=', '1').toString());
            // Retorna o funcional de todos os servidores
            const sqlFuncional = await app.db({ ff: tabelaDomainFuncional })
                .select('c.id', 'c.matricula', 'c.d_admissao', 'ff.id_pccs', 'ff.id_vinculo', 'ff.situacao')
                .join({ c: tabelaDomainServidores }, 'ff.id_cad_servidores', '=', 'c.id')
                .where({ ano: f_ano, mes: f_mes, complementar: f_complementar })
                .having('ff.id_pccs', '>', '0')
                .having('ff.id_vinculo', '>=', '0')
                .having('ff.situacao', '=', '1')
            const endOfMonth = moment(`${f_ano}-${f_mes}-01`).endOf('month');

            await sqlFuncional.forEach(async elementFuncional => {
                let d_admissao = moment(elementFuncional.d_admissao, "DD/MM/YYYY")

                let years = endOfMonth.diff(d_admissao, 'year');
                d_admissao.add(years, 'years');
                elementFuncional.anos = years

                let months = endOfMonth.diff(d_admissao, 'months');
                d_admissao.add(months, 'months');
                elementFuncional.meses = months

                let days = endOfMonth.diff(d_admissao, 'days');
                elementFuncional.dias = days
            })

            // return sqlFuncional
            // Retorna o evento na tabela de eventos
            const { createEvent } = app.api.sisEvents
            const evento = await createEvent({
                "request": req,
                "evento": {
                    "ip": req.ip,
                    "id_user": uParams.id,
                    "evento": `Inclusão autônoma de dados financeiros. ${sqlFuncional.length} serão percorridos.`,
                    "classevento": `folha.setProventosIniciais`,
                    "id_registro": null
                }
            })
            // Inicia o array de objetos que serão inseridos na tabela fin_rubricas do cliente
            const proventos = []
            // Objeto contendo os dados básicos de todos os objetos a inserir
            const generalUpdate = {
                created_at: new Date(),
                status: STATUS_ACTIVE,
                evento: evento,
                dominio: req.user.dominio,
                daysInMonth: moment(`${f_ano}-${f_mes}`, "YYYY-MM").daysInMonth()
            }
            // Retorna os eventos da tabela fin_eventos para estas rúbricas
            const idFinEventos = await app.db({ fe: tabelaDomainEventos })
                .select('fe.id', 'fe.id_evento')
                .whereIn('fe.id_evento', ['001', '002', '003'])
            // Array que conterá os fin_eventos.id para ser usado mais tarde na exclusão na tabela fin_rubricas
            const eventosDel = []
            idFinEventos.forEach(element => {
                eventosDel.push(element.id)
            });
            // Percorre os dados da tabela funcional para criar os objetos a inserir
            sqlFuncional.forEach(async elementFuncional => {
                req.body.id_pccs = elementFuncional.id_pccs
                req.body.anos = elementFuncional.anos
                req.body.meses = elementFuncional.meses
                req.body.dias = elementFuncional.dias
                // Restaura as referências financeiras para o id_pccs
                let referencias = await getReferencias(req, res)
                referencias = JSON.parse(JSON.stringify(referencias))
                // console.log(referencias);
                // Instancia a variável que irá armazenar o idEvento de acordo com fin_eventos.id
                let idEvento
                // let idEvento
                if (['1', '2', '3'].includes(elementFuncional.id_vinculo)) idEvento = '001'
                else if (['6'].includes(elementFuncional.id_vinculo)) idEvento = '002'
                else if (['4', '5', '7'].includes(elementFuncional.id_vinculo)) idEvento = '003'
                else throw `Vinculo funcional incompatível: (${elementFuncional.id_vinculo})`
                // Determinada a rúbrica (idEvento), percorre id_finEventos e redefine idEventos com o element.id
                idEvento = idFinEventos.find(element => element.id_evento == idEvento)
                idEvento = idEvento.id
                // Cria um objeto provento e o insere no array proventos com os dados armazenados
                const provento = {
                    status: generalUpdate.status,
                    dominio: generalUpdate.dominio,
                    evento: generalUpdate.evento,
                    created_at: generalUpdate.created_at,
                    id_cad_servidores: elementFuncional.id,
                    id_fin_eventos: idEvento,
                    id_con_contratos: null,
                    ano: f_ano,
                    mes: f_mes,
                    complementar: f_complementar,
                    referencia: generalUpdate.daysInMonth,
                    valor_baseespecial: 0.0,
                    valor_base: 0.0,
                    valor_basefixa: 0.0,
                    valor_desconto: 0.0,
                    valor_percentual: 0.0,
                    valor_saldo: 0.0,
                    valor: referencias.valor,
                    valor_patronal: 0.0,
                    valor_maternidade: 0.0,
                    prazo: 999,
                    prazot: 999
                }
                proventos.push(provento)
                // console.log(provento);
            });
            // Inicia uma transação
            await app.db.transaction(async trx => {
                // Excluir os lançamentos existentes
                await app.db(tabelaDomainRubricas)
                    .where({ ano: f_ano, mes: f_mes, complementar: f_complementar })
                    .whereIn('id_fin_eventos', eventosDel)
                    .del().transacting(trx)
                // Insere os objetos como um batch na tabela
                await app.db(tabelaDomainRubricas).insert(proventos).transacting(trx)
            })
            // console.log(proventos);
            // return { 'status': `${sqlFuncional.length} proventos iniciais (001, 002 ou 003) foram inseridos.`, proventos }
            return `${sqlFuncional.length} proventos iniciais (001, 002 ou 003) foram inseridos.`
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } });
            res.status(500).send(`Erro ao tentar inserir proventos iniciais dos servidores. Erro: ${error}`)
        }
    }

    /**
     * Fechas as folhas de pagamento anteriores inclusive as suas complementares
     * Reabre ou mantém abertas as folhas atual e posteriores inclusive as suas complementares
     * Por padrão, apenas folhas abertas poderão ser editadas
     * Para fechar ou reabrir, utiliza a informação em bd.fin_sfuncional.d_situacao em conformidade
     * com req.user.f_[ano|mes|complementar]
     */
    const fechaFolhas = async (req, res) => {
        const body = { ...req.body }
        const uParams = req.uParams
        const f_ano = req.ano
        const f_mes = req.mes
        const tabelaDomainParametros = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabelaParametros}`
        let sqlClose = `UPDATE ${tabelaDomainParametros} SET situacao = 0 WHERE STR_TO_DATE(d_situacao,'%d/%m/%Y') `
        sqlClose += `< STR_TO_DATE('01/${f_mes}/${f_ano}','%d/%m/%Y')`
        let sqlOpen = `UPDATE ${tabelaDomainParametros} SET situacao = 1 WHERE STR_TO_DATE(d_situacao,'%d/%m/%Y') `
        sqlOpen += `>= STR_TO_DATE('01/${f_mes}/${f_ano}','%d/%m/%Y')`
        try {
            const rClose = await app.db.raw(sqlClose)
            const rOpen = await app.db.raw(sqlOpen)
            const rowsUpdate = rClose[0].message.split(' ')[5] + rOpen[0].message.split(' ')[5]
            return rowsUpdate > 0 ? `${rClose[0].message.split(' ')[5]} folhas fechadas e ${rOpen[0].message.split(' ')[5]} folhas aberta` : 'Todas as folhas estavam fechadas exceto a atual, as seguintes e suas complementares (caso aja alguma)';
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } });
            res.status(500).send(`Erro ao tentar fechar as folhas. Erro: ${error}`)
        }
    }

    /**
     * Retorna a referência financeira para um determinado pcc
     * Baseasse na folha atual do req.user.f_[ano|mes|complementar]
     */
    const getReferencias = async (req, res) => {
        const body = { ...req.body }
        const uParams = req.uParams || req.user
        const f_ano = req.ano || uParams.f_ano
        const f_mes = req.mes || uParams.f_mes
        const tabelaDomainReferencias = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabelaReferencias}`
        const tabelaDomainClasses = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabelaClasses}`
        let r = app.db({ cc: tabelaDomainClasses })
            .select('fr.id', 'fr.id_pccs', 'fr.id_classe', 'cc.nome_classe', 'fr.referencia', 'fr.valor', 'fr.data',
                app.db.raw('COALESCE(cc.i_ano_inicial,0) i_ano_inicial'),
                app.db.raw('COALESCE(cc.i_ano_final,0) i_ano_final'))
            .join({ fr: tabelaDomainReferencias }, { 'fr.id_classe': 'cc.id_classe', 'fr.id_pccs': 'cc.id_pccs' })
            .where({ 'cc.id_pccs': body.id_pccs })
            .where(app.db.raw(`${body.anos} between cc.i_ano_inicial and cc.i_ano_final`))
            .where(app.db.raw(`STR_TO_DATE(fr.data,'%d/%m/%Y') <= LAST_DAY(STR_TO_DATE('01/${f_mes}/${f_ano}','%d/%m/%Y'))`))
        const yearsIntoClass = 3 // Período da mudança de classes em anos. Um dia a mais muda de classe.
        // Se for multiplo do período da mudança de classest yearsIntoClass) 
        // e HOUVER meses ou dias adicionais adiciona a clausula à query
        if (body.anos % yearsIntoClass == 0 && (body.meses != 0 || body.dias != 0))
            r.where(function () {
                this.where('cc.i_ano_inicial', '>=', body.anos)
                    .orWhere('cc.i_ano_final', '>=', '99')
                // .orWhere(app.db.raw('(`cc`.`i_ano_inicial` = 0 AND `cc`.`i_ano_final` = 99 )'))
            })


        r.groupBy('fr.id_pccs', 'fr.id_classe', 'fr.referencia', 'fr.valor')
            .orderBy('fr.id_pccs')
            .orderBy(app.db.raw(`STR_TO_DATE(fr.data,'%d/%m/%Y')`), 'desc')
            .orderBy('cc.i_ano_final')
            .limit(1)
        // console.log(r.toString());
        try {
            r = await app.db.raw(r.toString())
            const valor = r[0][0] && r[0][0].valor ? r[0][0].valor : 0
            if (req.uParams) {
                return { valor: valor }
            }
            else {
                return res.send({ valor: valor })
            }
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } });
            res.status(500).send(`Erro ao tentar retornar a referência financeira para o pcc ${body.id_pccs}. Erro: ${error}`)
        }
    }

    return { getByFunction }
}