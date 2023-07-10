const moment = require('moment')
const randomstring = require("randomstring")
const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, notExistsOrError, equalsOrError, isValidEmail, isMatchOrError, noAccessMsg, isParamOrError } = app.api.validation
    const { mailyCliSender } = app.api.mailerCli
    const { convertESocialTextToJson, getIdParam, getIdCargos } = app.api.facilities
    const tabela = 'serv_vinculos'
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99

    const save = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        let body = { ...req.body }
        // delete body.id_serv
        // body.id_serv = req.params.id_serv
        if (req.params.id) body.id = req.params.id
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        try {
            // Alçada para edição
            if (body.id)
                isMatchOrError(uParams && uParams.cad_servidores >= 3, `${noAccessMsg} "Edição de ${tabela}"`)
            // Alçada para inclusão
            else isMatchOrError(uParams && uParams.cad_servidores >= 1, `${noAccessMsg} "Inclusão de ${tabela}"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const contentType = req.headers['content-type']
        if (contentType == "text/plain") {
            const bodyRaw = convertESocialTextToJson(req.body)
            //return res.send(bodyRaw)
            body = {}
            
            body.matricula = bodyRaw.matricula_108
            //body.sit_func = bodyRaw.
            body.tp_reg_prev = bodyRaw.tpRegPrev_110        
            body.id_param_tp_prov = await getIdParam('tpProv', bodyRaw.tpProv_141)   
            body.data_exercicio = bodyRaw.dtExercicio_144    
            body.tp_plan_rp = bodyRaw.tpPlanRP_145 //obs        
            body.teto_rgps = bodyRaw.indTetoRGPS_222          
            body.abono_perm = bodyRaw.indAbonoPerm_223         
            body.d_inicio_abono = bodyRaw.dtIniAbono_224     
            body.d_ing_cargo = bodyRaw.dtIngrCargo_227        
            body.id_cargo = await getIdCargos('nome', bodyRaw.nmCargo_225)           
            body.acum_cargo = bodyRaw.acumCargo_230        
            body.id_param_cod_categ = await getIdParam('codCatg', bodyRaw.codCateg_151)
            body.qtd_hr_sem = bodyRaw.qtdHrsSem_176        
            body.id_param_tp_jor = await getIdParam('tpJornada', bodyRaw.tpJornada_177)    
            body.id_param_tmp_parc = await getIdParam('tmpParc', bodyRaw.tmpParc_179)    
            body.hr_noturno = bodyRaw.horNoturno_241         
            body.desc_jornd = bodyRaw.dscJorn_242    
            body.id_param_grau_exp = await getIdParam('grauExp', bodyRaw.grauExp_64) 
            // Os dados a seguir deverão ser capturados no banco de dados e enviados pelo PonteCasV2     
            // body.pis = bodyRaw.pis
            // body.dt_pis = bodyRaw.dt_pis           
            // body.tempo_servico = bodyRaw.tempo_servico  
            // body.tempo_final = bodyRaw.tempo_final      
            // body.titulo = bodyRaw.titulo           
            // body.tit_uf = bodyRaw.tit_uf           
            // body.tit_zona = bodyRaw.tit_zona         
            // body.tit_secao = bodyRaw.tit_secao        
            // body.dt_nomeacao = bodyRaw.dt_nomeacao      
            // body.nom_edital = bodyRaw.nom_edital       
            // body.nom_nr_inscr = bodyRaw.nom_nr_inscr     
            // body.id_siap_pub = bodyRaw.id_siap_pub      
    }
                
        try {
            existsOrError(body.id_vinc_principal, 'Vinculo Principal não informado')
            existsOrError(body.matricula, 'Matrícula do Trabalhador não informada')
            existsOrError(body.sit_func, 'Situação Funcional não informada')
            existsOrError(body.tp_reg_prev, 'Tipo Regime Previdência não informado')
            existsOrError(body.id_param_tp_prov, 'Tipo Provimento não informado')
            existsOrError(await isParamOrError('tpProv', body.id_param_tp_prov), 'Tipo Provimento selecionado não existe')
            existsOrError(body.data_exercicio, 'Data do Exercício não informado')
            existsOrError(body.tp_plan_rp, 'Plano Segregação em Massa não informado')
            existsOrError(body.teto_rgps, 'Teto RGPS não informado')
            existsOrError(body.abono_perm, 'Abono Permanência não informado')
            existsOrError(body.d_inicio_abono, 'Data Início do Abono não informado')
            existsOrError(body.d_ing_cargo, 'Data de Ingressão do Cargo não informado')
            existsOrError(body.id_cargo, 'Cargo não informado')
            //existsOrError(body.acum_cargo, 'Cargo Acumulável não informado')
            existsOrError(body.id_param_cod_categ, 'Código da Categoria não informado')
            existsOrError(await isParamOrError('codCatg', body.id_param_cod_categ), 'Código da Categoria selecionado não existe')
            //existsOrError(body.qtd_hr_sem, 'Quantidade de Horas Semanais não informada')
            existsOrError(body.id_param_tp_jor, 'Tipo Jornada não informado')
            existsOrError(await isParamOrError('tpJornada', body.id_param_tp_jor), 'Tipo Jornada selecionado não existe')
            existsOrError(body.id_param_tmp_parc, 'Tempo Parcial não informado')
            existsOrError(await isParamOrError('tmpParc', body.id_param_tmp_parc), 'Tempo Parcial selecionado não existe')
            existsOrError(body.hr_noturno, 'Horário Noturno não informado')
            existsOrError(body.desc_jornd, 'Descrição de Jornada não informada')
            existsOrError(body.pis, 'PIS não informado')
            existsOrError(body.dt_pis, 'Data do PIS não informada')
            existsOrError(body.tempo_servico, 'Tempo de Serviço não informado')
            existsOrError(body.tempo_final, 'Tempo Final não informado')
            existsOrError(body.titulo, 'Título não informado')
            existsOrError(body.tit_uf, 'UF não informada')
            existsOrError(body.tit_zona, 'Zona do Título não informada')
            existsOrError(body.tit_secao, 'Seção do Título não informada')
            existsOrError(body.dt_nomeacao, 'Data da Nomeação não informada')
            existsOrError(body.nom_edital, 'Nome do Edital não informado')
            existsOrError(body.nom_nr_inscr, 'Número da Inscrição não informado')
            existsOrError(body.id_siap_pub, 'Veículo Publicação não informado')
            existsOrError(body.id_param_grau_exp, 'Grau de Experiência não informado')
        }
    catch (error) {
            return res.status(400).send(error)
        }
        body.matricula = body.matricula.padStart(8, '0')
        delete body.hash

        const { changeUpperCase, removeAccentsObj } = app.api.facilities
        body = (JSON.parse(JSON.stringify(body), removeAccentsObj));
        body = (JSON.parse(JSON.stringify(body), changeUpperCase));

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
                else res.status(200).send('Rúbrica não foi encontrada')
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

    const limit = 5 // usado para paginação
    const get = async (req, res) => {
        let user = req.user
        const id_serv = req.params.id_serv
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
        .where({ status: STATUS_ACTIVE, id_serv: req.params.id_serv })
        .where(function () {
            this.where(app.db.raw(`tbl1.matricula regexp('${key.toString().replace(' ', '.+')}')`))
        })
        sql = await app.db.raw(sql.toString())
        const count = sql[0][0].count
        const ret = app.db({ tbl1: tabelaDomain })
            .where({ status: STATUS_ACTIVE, id_serv: req.params.id_serv })
            .where(function () {
                this.where(app.db.raw(`tbl1.matricula regexp('${key.toString().replace(' ', '.+')}')`))
            })
        ret.orderBy('matricula').limit(limit).offset(page * limit - limit)
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
            .where({ id_serv: req.params.id_serv, id: req.params.id, status: STATUS_ACTIVE }).first()
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
                .where({ id_serv: req.params.id_serv, id: req.params.id })
            existsOrError(rowsUpdated, 'Registro não foi encontrado')

            res.status(204).send()
        } catch (error) {
            res.status(400).send(error)
        }
    }
    return { save, get, getById, remove }
}