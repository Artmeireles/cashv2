const moment = require('moment')
const randomstring = require("randomstring")
const { dbPrefix } = require("../.env")
const sharp = require('sharp');


module.exports = app => {
    const { existsOrError, notExistsOrError, cpfOrError, lengthOrError, emailOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const { mailyCliSender } = app.api.mailerCli
    const tabela = 'cad_servidores'
    const tabelaFinSFuncional = 'fin_sfuncional'
    const tabelaFinParametros = 'fin_parametros'
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99

    const save = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        const body = { ...req.body }
        try {
            // Alçada para edição
            if (body.id)
                isMatchOrError(uParams && uParams.cad_servidores >= 3, `${noAccessMsg} "Edição de cadastro"`)
            // Alçada para inclusão
            else isMatchOrError(uParams && uParams.cad_servidores >= 2, `${noAccessMsg} "Inclusão de cadastro"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        if (req.params.id) body.id = req.params.id

        const origin = body.origin;
        try {
            existsOrError(body.matricula, 'Matrícula não informada')
            existsOrError(body.nome, 'Nome não informado')
            existsOrError(body.cpf, 'CPF Não informado')
            existsOrError(body.rg, 'RG não informado')
            if (!origin) {
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
                existsOrError([0, 1].includes(body.sexo), 'Sexo não informado')
                existsOrError(body.raca, 'Raça não informada')
                existsOrError(body.estado_civil, 'Estado civil não informado')
                existsOrError(body.d_admissao, 'Data de admissão não informada')
            }

            if (!body.id && body.matricula) {
                const dataFromDB = await app.db(tabelaDomain)
                    .where({ matricula: body.matricula, dominio: uParams.dominio })
                    .first()
                notExistsOrError(dataFromDB, 'Matrícula já cadastrada')
            }
            if (body.cpf && (body.id || body.matricula)) {
                const dataFromDB = await app.db(tabelaDomain)
                    .where({ cpf: body.cpf, matricula: body.matricula, dominio: uParams.dominio })
                    .andWhere(app.db.raw(body.id ? (`id != '${body.id}'`) : '1=1'))
                    .first()
                notExistsOrError(dataFromDB, 'Combinação de CPF e matrícula já cadastrada')
            }
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            return res.status(400).send(error)
        }

        delete body.vinculo
        delete body.id_vinculo
        delete body.cpfMasked
        delete body.password
        delete body.complementar
        delete body.mes
        delete body.ano
        delete body.origin
        delete body.id_cadas

        if (body.id) {
            // Variáveis da edição de um registro
            // registrar o evento na tabela de eventos
            const { createEventUpd } = app.api.sisEvents
            const evento = await createEventUpd({
                "notTo": ['created_at', 'evento', 'updated_at'],
                "last": await app.db(tabelaDomain).where({ id: body.id }).first(),
                "next": body,
                "request": req,
                "evento": {
                    "evento": `Alteração de cadastro`,
                    "tabela_bd": tabela,
                }
            })

            body.evento = evento
            body.updated_at = new Date().toString()
            let rowsUpdated = app.db(tabelaDomain)
                .update(body)
                .where({ id: body.id, cpf: body.cpf })
            rowsUpdated.then(async (ret) => {
                if (ret > 0) {
                    let userPanel = await app.db('users').where({ 'cpf': body.cpf }).first()
                    if (userPanel) {
                        userPanel = { ...userPanel, telefone: body.celular }
                        delete userPanel[0].id
                        await app.db('users').update(userPanel).where({ 'cpf': body.cpf })
                    }
                    res.status(200).send({ id: body.id, nome: body.nome })
                }
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
            body.status = STATUS_ACTIVE
            body.dominio = uParams.dominio
            body.created_at = new Date().toString()

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

    const saveByBatch = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError((uParams && (uParams.cad_servidores >= 3)), `${noAccessMsg} "Edição de dados de servidor em lote"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const batch = { ...req.body.cadastros }
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
            const origin = body.origin;

            if (origin == 'desktop') {
                const bodyId = await app.db(tabelaDomain)
                    .where({ cpf: body.cpf, matricula: body.matricula })
                    .first()
                body.id = bodyId && bodyId.id ? bodyId.id : bodyId;
            }

            const bodyValidation = []
            if (!body.logradouro) bodyValidation.push('Logradouro não informado')
            if (!body.numero) bodyValidation.push('Número não informado')
            if (!body.bairro) bodyValidation.push('Bairro não informado')
            if (!body.cidade) bodyValidation.push('Cidade não informada')
            if (!body.uf) bodyValidation.push('UF não informada')
            if (!body.d_admissao) bodyValidation.push('Data de admissão não informada')
            if (!body.rg) bodyValidation.push('RG não informado')
            if (!body.cpf) bodyValidation.push('CPF não informado')
            if (!body.nacionalidade || body.nacionalidade.isNaN) bodyValidation.push('Nacionalidade não informada')
            if (body.sexo && body.sexo.isNaN || ![0, 1].includes(Number(body.sexo))) bodyValidation.push('Sexo não informado')
            if (body.raca && body.raca.isNaN || ![1, 2, 3, 4, 5, 9].includes(Number(body.raca))) bodyValidation.push('Raça não informada')
            if (bodyValidation.length > 0) batchResult.push({ matricula: body.matricula, result: JSON.stringify(bodyValidation) })


            if (bodyValidation.length > 0) {
                const mail = {
                    "from": "suporte@mgcash.app.br",
                    "to": "suporte@mgcash.app.br",
                    "subject": "Erro cadastros saveByBatch",
                    "message": `${JSON.stringify({ cliente: client, dominio: domain, matricula: body.matricula, result: JSON.stringify(bodyValidation) })}`
                }
                req.mail = mail
                req.batch = true
                mailyCliSender(req, res)
            }
            try {
                existsOrError(body.matricula, 'Matrícula não informada')
                existsOrError(body.nome, 'Nome não informado')

                if (body.cpf && body.matricula) {
                    const dataFromDB = await app.db(tabelaDomain)
                        .where({ cpf: body.cpf, matricula: body.matricula, dominio: domain })
                        .andWhere(app.db.raw(body.id ? (`id != '${body.id}'`) : '1=1'))
                        .first()
                    notExistsOrError(dataFromDB, `CPF ${body.cpf} já cadastrado. Erro em (${body.matricula})`)
                }
            } catch (error) {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(400).send(error)
            }

            delete body.origin
            if (body.id) {
                // Variáveis da edição de um registro
                // registrar o evento na tabela de eventos
                const { createEventUpd } = app.api.sisEvents
                const evento = await createEventUpd({
                    "notTo": ['created_at', 'evento', 'updated_at'],
                    "last": await app.db(tabelaDomain).where({ id: body.id }).first(),
                    "next": body,
                    "request": req,
                    "evento": {
                        "evento": `Alteração de cadastro`,
                        "tabela_bd": tabela,
                    }
                })

                body.evento = evento
                body.updated_at = new Date().toString()
                await app.db(tabelaDomain)
                    .update(body)
                    .where({ id: body.id, cpf: body.cpf, matricula: body.matricula })
                    .then(async (ret) => {

                        let userPanel = await app.db('users').where({ 'id_cadas': body.id }).first()
                        userPanel = { ...userPanel, telefone: body.celular }
                        await app.db('users').update(userPanel).where({ 'id_cadas': body.id })

                        batchResult.push({ id: body.id, nome: body.nome })
                        pkToUpdate += `'${body.matricula}',`;
                        batchDone++
                    })
                    .catch(error => {
                        batchResult.push({ matricula: body.matricula, result: 'Erro: ' + error })
                        app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    })
            } else {
                // Criação de um novo registro
                const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()

                body.evento = nextEventID.count + 1
                // Variáveis da criação de um novo registro
                body.status = STATUS_ACTIVE
                body.dominio = domain
                body.created_at = new Date().toString()

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
                        batchResult.push({ id: body.id, nome: body.nome })
                        pkToUpdate += `'${body.matricula}',`;
                        batchDone++
                    })
                    .catch(error => {
                        batchResult.push({ matricula: body.matricula, result: 'Erro: ' + error })
                        app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    })
            }
        }
        pkToUpdate = pkToUpdate.substring(0, pkToUpdate.length - 1)
        const result = {
            'done': batchDone,
            'batchResult': batchResult,
            'sqlUpdate': pkToUpdate.length > 0 ? `update servidores set updated_at = (select replace(datediff(second, timestamp '1/1/1970 00:00:00', current_timestamp),'.','') from rdb$database) where idservidor in(${pkToUpdate})` : ''
        }
        return res.status(200).send(result)
    }

    const limit = 20 // usado para paginação
    const get = async (req, res) => {
        let user = req.user
        let keyCpf = req.query.keyCpf ? req.query.keyCpf : undefined
        let keyMat = req.query.keyMat ? req.query.keyMat : undefined
        let keyName = req.query.keyName ? req.query.keyName : undefined
        if (req.query.key) {
            const key = req.query.key.trim()
            keyCpf = (key.replace(/([^\d])+/gim, "").length <= 11) ? key.replace(/([^\d])+/gim, "") : undefined
            keyMat = key.replace(/([^\d])+/gim, "")
            keyMat = (keyMat.length >= 0 && keyMat.length <= 8) ? keyMat.replace(/([^\d])+/gim, "").padStart(8, '0') : undefined
            keyName = key
        }
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError((uParams.cad_servidores && uParams.cad_servidores >= 1) ||
                (uParams.tipoUsuario == 1 || uParams.gestor == 1 || uParams.admin >= 1 || keyCpf == user.cpf), `${noAccessMsg} "Exibição de cadastro de servidor"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaFuncionalDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.fin_sfuncional`
        const page = req.query.page || 1
        let sql = app.db({ cs: tabelaDomain }).select(app.db.raw('id, count(*) as count'))
        if (keyCpf || keyMat || keyName) {
            if (keyMat) sql.where({ matricula: app.db.raw(`LPAD('${keyMat.toLowerCase()}',8,0)`) })
            if (keyMat && keyCpf) sql.orWhere(app.db.raw(`cs.cpf like '%${keyCpf.replace(/([^\d])+/gim, "")}%'`))
            else sql.andWhere(app.db.raw(`cs.cpf like '%${keyCpf.replace(/([^\d])+/gim, "")}%'`))
            if (keyMat || keyCpf) sql.orWhere(app.db.raw(`cs.nome regexp('${keyName.toString().replace(' ', '.+')}')`))
            else sql.andWhere(app.db.raw(`cs.nome regexp('${keyName.toString().replace(' ', '.+')}')`))
        }
        const result = await app.db.raw(sql.toString())
        const count = result[0][0] ? parseInt(result[0][0].count) : 0

        const ret = app.db({ cs: tabelaDomain })
            .select(app.db.raw(`cs.*,(SELECT id_vinculo FROM ${tabelaFuncionalDomain} WHERE id_cad_servidores = cs.id AND complementar = 000 ORDER BY ano DESC, mes DESC LIMIT 1) as id_vinculo`))
        if (keyCpf || keyMat || keyName) {
            if (keyMat) ret.where({ matricula: app.db.raw(`LPAD('${keyMat.toLowerCase()}',8,0)`) })
            if (keyMat && keyCpf) ret.orWhere(app.db.raw(`cs.cpf like '%${keyCpf.replace(/([^\d])+/gim, "")}%'`))
            else ret.andWhere(app.db.raw(`cs.cpf like '%${keyCpf.replace(/([^\d])+/gim, "")}%'`))
            if (keyMat || keyCpf) ret.orWhere(app.db.raw(`cs.nome regexp('${keyName.toString().replace(' ', '.+')}')`))
            else ret.andWhere(app.db.raw(`cs.nome regexp('${keyName.toString().replace(' ', '.+')}')`))
        }
        ret.groupBy('cs.id')
            .orderBy('nome')
            .limit(limit).offset(page * limit - limit)
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
            isMatchOrError((uParams.cad_servidores && uParams.cad_servidores >= 1) ||
                (uParams.tipoUsuario == 1 || uParams.gestor == 1 || uParams.admin >= 1), `${noAccessMsg} "Exibição de cadastro de servidor"`)
        } catch (error) {
            return res.status(401).send(error)
        }

        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const ret = app.db(`${tabelaDomain}`)
            .where({ id: req.params.id })
            .andWhere(app.db.raw(`${tabelaDomain}.dominio = '${uParams.dominio}'`)).first()

        ret.then(body => {
            return res.json({ data: body })
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getByCpfMat = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError((uParams.cad_servidores && uParams.cad_servidores >= 1) ||
                (uParams.tipoUsuario == 1 || uParams.gestor == 1 || uParams.admin >= 1), `${noAccessMsg} "Exibição de cadastro de servidor"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        try {
            cpfOrError(req.params.cpf, 'CPF informado é inválido')
            // cpfOrError(req.params.matricula, 'Matrícula informada é inválida')
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            return res.status(400).send(error)
        }

        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const ret = app.db(`${tabelaDomain}`)
            .where({ cpf: req.params.cpf, matricula: req.params.matricula })
            .andWhere(app.db.raw(`${tabelaDomain}.dominio = '${uParams.dominio}'`)).first()

        ret.then(body => {
            return res.json({ data: body })
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getByToken = async (req, res) => {
        const body = { ...req.body }

        const tokenCreate = Buffer.from(`${body.getToken.email}_${body.getToken.tkn_api}`).toString('base64')
        let getToken = Buffer.from(tokenCreate, 'base64').toString('ascii')
        getToken = getToken.split("_")
        // return res.send(getToken)

        const uParams = await app.db('users').where({ email: getToken[0], tkn_api: getToken[1] }).first();
        try {
            // Alçada para exibição
            isMatchOrError((uParams.cad_servidores && uParams.cad_servidores >= 1) ||
                (uParams.tipoUsuario == 1 || uParams.gestor == 1 || uParams.admin >= 1), `${noAccessMsg} "Exibição de cadastro de servidor"`)
        } catch (error) {
            return res.status(401).send(error)
        }

        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaFinFuncional = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.fin_sfuncional`
        const tabelaCargos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.cad_cargos`
        const tabelaDepartamentos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.cad_departamentos`
        const ret = app.db({ cs: tabelaDomain })
            .select('cs.cpf', 'cs.matricula', 'cs.nome', 'cs.nascimento_d', 'cs.d_admissao', 'cs.celular', 'cs.sexo', 'ff.carga_horaria',
                app.db.raw(`${dbPrefix}_api.getVinculoLabel(ff.id_vinculo) AS vinculo`), { cargo: 'cc.nome' }, 'cd.departamento', 'ff.situacaofuncional')
            .join({ ff: tabelaFinFuncional }, 'cs.id', '=', 'ff.id_cad_servidores')
            .join({ cc: tabelaCargos }, 'cc.id', '=', 'ff.id_cad_cargos')
            .join({ cd: tabelaDepartamentos }, 'cd.id', '=', 'ff.id_cad_departamentos')
        if ([11, 14].includes(req.params.id.length)) ret.where({ cpf: req.params.id })
        else ret.where({ id: req.params.id })
        ret.where({ 'ff.ano': uParams.f_ano, 'ff.mes': uParams.f_mes, 'ff.complementar': uParams.f_complementar, 'ff.situacaofuncional': 1 })
            .first()
        ret.then(body => {
            if (body.situacaofuncional == 1) body.situacaofuncional = 'Ativo'
            switch (body.sexo) {
                case 0:
                    body.sexo = 'Masculino';
                    break;
                case 1:
                    body.sexo = 'Feminino';
                    break;
                default:
                    body.sexo = 'Não declarado';
            }
            return res.json(body)
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getBatchByToken = async (req, res) => {
        const body = { ...req.body }

        const tokenCreate = Buffer.from(`${body.getToken.email}_${body.getToken.tkn_api}`).toString('base64')
        let getToken = Buffer.from(tokenCreate, 'base64').toString('ascii')
        getToken = getToken.split("_")
        // return res.send(getToken)

        const uParams = await app.db('users').where({ email: getToken[0], tkn_api: getToken[1] }).first();
        try {
            // Alçada para exibição
            isMatchOrError((uParams.cad_servidores && uParams.cad_servidores >= 1) ||
                (uParams.tipoUsuario == 1 || uParams.gestor == 1 || uParams.admin >= 1), `${noAccessMsg} "Pesquisa de cadastro de servidor por token"`)
        } catch (error) {
            return res.status(401).send(error)
        }

        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaFinFuncional = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.fin_sfuncional`
        const tabelaCargos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.cad_cargos`
        const tabelaDepartamentos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.cad_departamentos`
        const ret = app.db({ cs: tabelaDomain })
            .select('cs.cpf', 'cs.matricula', 'cs.nome', 'cs.nascimento_d', 'cs.d_admissao', 'cs.celular', 'cs.sexo', 'ff.carga_horaria',
                app.db.raw(`${dbPrefix}_api.getVinculoLabel(ff.id_vinculo) AS vinculo`), { cargo: 'cc.nome' }, 'cd.departamento', 'ff.situacaofuncional')
            .join({ ff: tabelaFinFuncional }, 'cs.id', '=', 'ff.id_cad_servidores')
            .join({ cc: tabelaCargos }, 'cc.id', '=', 'ff.id_cad_cargos')
            .join({ cd: tabelaDepartamentos }, 'cd.id', '=', 'ff.id_cad_departamentos')
            .where({ 'ff.ano': uParams.f_ano, 'ff.mes': uParams.f_mes, 'ff.complementar': uParams.f_complementar, 'ff.situacaofuncional': 1 })
            .then(body => {
                body.forEach(element => {
                    if (element.situacaofuncional == 1) element.situacaofuncional = 'Ativo'
                    switch (element.sexo) {
                        case 0:
                            element.sexo = 'Masculino';
                            break;
                        case 1:
                            element.sexo = 'Feminino';
                            break;
                        default:
                            element.sexo = 'Não declarado';
                    }
                });
                return res.json(body)
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getBykeySearch = async (req, res) => {
        let user = req.user
        const key = req.query.key ? req.query.key : undefined
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError((uParams.cad_servidores && uParams.cad_servidores >= 1) ||
                (uParams.tipoUsuario >= 1 || uParams.gestor == 1 || uParams.admin >= 1 || user.cpf == key), `${noAccessMsg} "Pesquisa de cadastro de servidor"`)
        } catch (error) {
            return res.status(401).send(error)
        }

        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaFinSFuncionalDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabelaFinSFuncional}`
        const tabelaFinParametrosDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabelaFinParametros}`
        const sql = app.db({ cs: `${tabelaDomain}` })
            .select(app.db.raw(`ff.id_vinculo, ff.ano, ff.mes, ff.complementar, ff.id_vinculo, 
            getVinculoLabel(ff.id_vinculo) AS vinculo, users.id_cadas, users.password, cs.*`))
            .join({ ff: `${tabelaFinSFuncionalDomain}` }, function () {
                this.on(`ff.id_cad_servidores`, `=`, `cs.id`)
            })
            .join({ fp: `${tabelaFinParametrosDomain}` }, function () {
                this.on(`fp.ano`, `=`, `ff.ano`)
                this.on(`fp.mes`, `=`, `ff.mes`)
                this.on(`fp.complementar`, `=`, `ff.complementar`)
            })
            .leftJoin('users', 'users.id_cadas', '=', `cs.id`)
            .where(function () {
                this.where(app.db.raw(`cs.cpf = '${key.replace(/([^\d])+/gim, "")}'`))
                    .orWhere(app.db.raw(`cs.matricula = '${key}'`))
            })
            .where({ 'fp.situacao': '0', 'fp.complementar': '000' })
            .andWhere('ff.mes', '<', '13')
            .first()
            .orderBy('ff.ano', 'desc')
            .orderBy('ff.mes', 'desc')
            .limit(1)
        sql.then(body => {
            return res.json({ data: body, count: 1 })
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } });
                return res.status(500).send(error)
            })
    }

    const getByField = async (req, res) => {
        let user = req.user
        const forceDominio = req.query.dominio
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.cad_servidores >= 1, `${noAccessMsg} "Exibição de lista de servidores"`)
        } catch (error) {
            return res.status(401).send(error)
        }

        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${forceDominio && forceDominio.length > 0 ? forceDominio : uParams.dominio}.${tabela}`
        const field = req.params.field
        const filter = req.params.filter
        let sql = app.db(tabelaDomain)
            .where({
                [field]: filter
            })
            .orderBy('nome', 'matricula')
        sql.then(body => {
            return res.json({ data: body })
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getListaServidores = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.cad_servidores >= 1, `${noAccessMsg} "Exibição de lista de servidores"`)
        } catch (error) {
            return res.status(401).send(error)
        }

        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        let sql = app.db(tabelaDomain)
            .select('id', 'matricula', 'nome').orderBy('nome', 'matricula')
            .then(body => {
                return res.json({ data: body })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const remove = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError((uParams.cad_servidores && uParams.cad_servidores >= 4), `${noAccessMsg} "Exclusão de cadastro de servidor"`)
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
                "next": registro,
                "request": req,
                "evento": {
                    "classevento": "Remove",
                    "evento": `Exclusão de cadastro de servidor`,
                    "tabela_bd": tabela,
                }
            })
            const rowsUpdated = await app.db(tabelaDomain)
                .update({
                    status: STATUS_DELETE,
                    evento: evento
                })
                .where({ id: req.params.id })
            existsOrError(rowsUpdated, 'Registro não foi encontrado')

            res.status(204).send()
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            res.status(400).send(error)
        }
    }

    const getListaCidades = async (req, res) => {
        // Teste

        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && (uParams.cad_servidores >= 1 ||
                uParams.tipoUsuario >= 0 || uParams.gestor == 1 || uParams.admin >= 1), `${noAccessMsg} "Exibição de cadastro de servidor"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const uf = req.params.uf

        let sql = app.db({ c: 'cidades' })
            .select('id', 'municipio')
            .where({ uf: uf }).orderBy('municipio')
        sql.then(body => {
            return res.json({ data: body })
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getListaMatriculasCpf = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.cad_servidores >= 1, `${noAccessMsg} "Exibição de lista de matrículas do CPF de servidor"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${user.cliente}_${user.dominio}.${tabela}`
        const cpf = req.query.cpf.replace(/([^\d])+/gim, "")

        try {
            existsOrError(cpf, 'Cpf não informado')
            lengthOrError(cpf, 11, 'Cpf inválido')
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            return res.status(400).send(error)
        }

        const ret = app.db({ cs: tabelaDomain })
            .select('id', 'matricula')
            .where({ cpf: cpf }).orderBy('matricula')
            .then(body => {
                return res.json({ data: body })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    return { save, saveByBatch, get, getById, getByCpfMat, getByField, remove, getBykeySearch, getByToken, getListaServidores, getBatchByToken, getListaCidades, getListaMatriculasCpf }
}