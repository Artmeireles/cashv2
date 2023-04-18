const moment = require('moment')
const randomstring = require("randomstring")
const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, notExistsOrError, equalsOrError, emailOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const { mailyCliSender } = app.api.mailerCli
    const tabela = 'orgao'
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99

    const save = async(req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        const body = {...req.body }
        try {
            // Alçada para edição
            if (body.id)
                isMatchOrError(uParams && (uParams.gestor == 1 || uParams.admin >= 1), `${noAccessMsg} "Edição de registro do orgão"`)
                // Alçada para inclusão
            else isMatchOrError(uParams && (uParams.gestor == 1 || uParams.admin >= 1), `${noAccessMsg} "Inclusão de registro de orgão"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${user.cliente}_${user.dominio}.${tabela}`
        if (req.params.id) body.id = req.params.id

        try {
            existsOrError(body.matricula, 'Matrícula não informada')
            existsOrError(body.nome, 'Nome não informado')
            existsOrError(body.cpf, 'CPF Não informado')
            existsOrError(body.rg, 'RG não informado')
            existsOrError(body.rg_emissor, 'Emissor do RG não informado')
            existsOrError(body.rg_uf, 'UF do RG não informada')
            existsOrError(body.rg_d, 'Data do RG não informada')
            existsOrError(body.pispasep, 'PIS não informado')
            existsOrError(body.pispasep_d, 'Data do PIS não informada')
            existsOrError(body.titulo, 'Título não informado')
            existsOrError(body.titulosecao, 'Sessão do Título não informada')
            existsOrError(body.titulozona, 'Zona do Título não informada')
            existsOrError(body.ctps, 'CTPS não informada')
            existsOrError(body.ctps_serie, 'Série da CTPS não informada')
            existsOrError(body.ctps_uf, 'UF da CTPS não informada')
            existsOrError(body.ctps_d, 'Data da CTPS não informada')
            existsOrError(body.nascimento_d, 'Data de Nascimento não informado')
            existsOrError(body.mae, 'Nome da mãe não informado')
            existsOrError(body.cep, 'CEP não informado')
            existsOrError(body.logradouro, 'Logradouro não informado')
            existsOrError(body.numero, 'Número não informado')
            existsOrError(body.bairro, 'Bairro não informado')
            existsOrError(body.cidade, 'Cidade não informada')
            existsOrError(body.uf, 'UF não informada')
            existsOrError(body.naturalidade, 'Naturalidade não informada')
            existsOrError(body.naturalidade_uf, 'UF da naturalidade não informada')
            existsOrError(body.nacionalidade, 'Nacionalidade não informada')
            existsOrError(body.sexo, 'Sexo não informado')
            existsOrError(body.raca, 'Raça não informada')
            existsOrError(body.estado_civil, 'Estado civil não informado')
            existsOrError(body.d_admissao, 'Data de admissão não informada')

            if (body.cpf && (body.id || body.matricula)) {
                const dataFromDB = await app.db(tabelaDomain)
                    .where({ cpf: body.cpf, matricula: body.matricula, dominio: user.dominio })
                    .andWhere(app.db.raw(body.id ? (`id != '${body.id}'`) : '1=1'))
                    .first()
                notExistsOrError(dataFromDB, 'CPF já cadastrado')
            }
        } catch (error) {
            return res.status(400).send(error)
        }

        if (body.id) {
            // Variáveis da edição de um registro
            // registrar o evento na tabela de eventos
            const { createEventUpd } = app.api.sisEvents
            const evento = await createEventUpd({
                "notTo": ['created_at', 'evento', ],
                "last": await app.db(tabelaDomain).where({ id: body.id }).first(),
                "next": body,
                "request": req,
                "evento": {
                    "evento": `Alteração de cadastro`,
                    "tabela_bd": tabela,
                }
            })

            body.evento = evento
            body.updated_at = new Date()
            let rowsUpdated = app.db(tabelaDomain)
                .update(body)
                .where({ id: body.id, cpf: body.cpf })
            rowsUpdated.then((ret) => {
                    if (ret > 0) res.status(200).send({ id: body.id, nome: body.nome })
                    else res.status(200).send('Cadastro não foi encontrado')
                })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
        } else {
            // Criação de um novo registro
            const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()

            body.evento = nextEventID.count + 1
                // Variáveis da criação de um novo registro
            body.token = randomstring.generate(40)
            body.status = STATUS_ACTIVE
            body.dominio = user.dominio
            body.created_at = new Date()

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
                            "evento": `Novo registro`,
                            "tabela_bd": tabela,
                        }
                    })
                    return res.json({ id: body.id })
                })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
        }
    }

    const saveByBatch = async(req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para edição
            isMatchOrError(uParams && (uParams.cad_orgao >= 3 || uParams.gestor == 1 || uParams.admin >= 1), `${noAccessMsg} "Edição de registro do orgão em bloco"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const batch = {...req.body.orgao }
        const client = req.body.client
        const domain = req.body.domain
        let batchSize = 0
        let batchDone = 0
        let batchResult = []
        let pkToUpdate = ''
        const tabelaDomain = `${dbPrefix}_${client}_${domain}.${tabela}`
        for (let obj in batch) {
            ++batchSize
            const body = batch[obj];
            body.user = user
            const bodyId = await app.db(tabelaDomain)
                .where({ cnpj: body.cnpj })
                .first()
            body.id = bodyId && bodyId.id ? bodyId.id : bodyId;
            const bodyValidation = []
            if (!body.orgao) bodyValidation.push('Nome do orgao não informado')
            if (!body.cnpj) bodyValidation.push('Cnpj não informado')
            if (!body.cep) bodyValidation.push('Cep não informado')
            if (!body.logradouro) bodyValidation.push('Logradouro não informado')
            if (!body.numero) bodyValidation.push('Numero não informado')
            if (!body.bairro) bodyValidation.push('Bairro não informado')
            if (!body.cidade) bodyValidation.push('Cidade não informado')
            if (!body.uf) bodyValidation.push('Uf não informado')
            if (!body.email) bodyValidation.push('Email não informado')
            if (!body.telefone) bodyValidation.push('Telefone não informado')
            if (!body.codigo_fpas) bodyValidation.push('Codigo fpas não informado')
            if (!body.codigo_gps) bodyValidation.push('Codigo gps não informado')
            if (!body.codigo_cnae) bodyValidation.push('Codigo cnae não informado')
            if (!body.codigo_ibge) bodyValidation.push('Codigo ibge não informado')
            if (!body.codigo_fgts) bodyValidation.push('Codigo fgts não informado')
            if (!body.cpf_responsavel_dirf) bodyValidation.push('Cpf responsavel dirf não informado')
            if (!body.nome_responsavel_dirf) bodyValidation.push('Nome responsavel dirf não informado')
            if (!body.cpf_resp_gestao) bodyValidation.push('Cpf responsavel gestao não informado')
            if (!body.nome_resp_gestao) bodyValidation.push('Nome responsavel gestao não informado')
            if (!body.cpf_resp_contInt) bodyValidation.push('Cpf responsavel controle interno não informado')
            if (!body.nome_resp_contInt) bodyValidation.push('Nome responsavel controle interno não informado')
            if (!body.cpf_resp_contabil) bodyValidation.push('Cpf responsavel contabil não informado')
            if (!body.nome_resp_contabil) bodyValidation.push('Nome responsavel contabil não informado')
            if (bodyValidation.length > 0) batchResult.push({ cnpj: body.cnpj, result: JSON.stringify(bodyValidation) })

            if (batchResult.length > 0) {
                const mail = {
                    "from": "suporte@mgcash.app.br",
                    "to": "suporte@mgcash.app.br",
                    "subject": "Erro orgao saveByBatch",
                    "message": `${JSON.stringify(batchResult[0])}`
                }
                req.mail = mail
                req.batch = true
                mailyCliSender(req, res)
            }

            // try {
            //     existsOrError(body.codigo_cnae,  'Código CNAE não informado')
            //     existsOrError(body.orgao,  'Nome não informado')

            //     if (body.cnpj) {
            //         const dataFromDB = await app.db(tabelaDomain)
            //             .where({ cnpj: body.cnpj })
            //             .andWhere(app.db.raw(body.id ? (`id != '${body.id}'`) : '1=1'))
            //             .first()
            //         notExistsOrError(dataFromDB, 'CNPJ já cadastrado')
            //     }
            // } catch (error) {
            //     return res.status(400).send(error)
            // }


            if (body.id) {
                // Variáveis da edição de um registro
                // registrar o evento na tabela de eventos
                const { createEventUpd } = app.api.sisEvents
                const evento = await createEventUpd({
                    "notTo": ['created_at', 'evento', ],
                    "last": await app.db(tabelaDomain).where({ id: body.id }).first(),
                    "next": body,
                    "request": req,
                    "evento": {
                        "evento": `Alteração de cadastro`,
                        "tabela_bd": tabela,
                    }
                })

                body.evento = evento
                body.updated_at = new Date()
                delete body.user
                await app.db(tabelaDomain)
                    .update(body)
                    .where({ id: body.id, cnpj: body.cnpj })
                    .then((ret) => {
                        batchResult.push({ id: body.id, orgao: body.orgao })
                        pkToUpdate += `'${body.cnpj}',`;
                        batchDone++
                    })
                    .catch(error => {
                        app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                        batchResult.push({ cnpj: body.cnpj, result: 'Erro: ' + error })
                        const mail = {
                            "from": "suporte@mgcash.app.br",
                            "to": "suporte@mgcash.app.br",
                            "subject": "Erro saveByBatch",
                            "message": `${error}`
                        }
                        req.body.mail = mail
                        req.batch = true
                        mailyCliSender(req, res)
                    })
            } else {
                // Criação de um novo registro
                const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()

                body.evento = nextEventID.count + 1
                    // Variáveis da criação de um novo registro
                body.status = STATUS_ACTIVE
                body.dominio = domain
                body.created_at = new Date()
                delete body.user

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
                                "evento": `Novo registro`,
                                "tabela_bd": tabela,
                            }
                        })
                        batchResult.push({ id: body.id, orgao: body.orgao })
                        pkToUpdate += `'${body.cnpj}',`;
                        batchDone++
                    })
                    .catch(error => {
                        app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                        batchResult.push({ cnpj: body.cnpj, result: 'Erro: ' + error })
                    })
            }
        }
        pkToUpdate = pkToUpdate.substring(0, pkToUpdate.length - 1)
        const result = {
            'done': batchDone,
            'batchResult': batchResult,
        }
        return res.status(200).send(result)
    }

    const get = async(req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && (uParams.cad_orgap >= 1 || uParams.gestor == 1 || uParams.admin >= 1), `${noAccessMsg} "Exibição de registros do orgão"`)
        } catch (error) {
            return res.status(401).send(error)
        }

        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const ret = app.db(`${tabelaDomain}`).first()
            .then(body => {
                return res.json(body)
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    return { save, saveByBatch, get }
}