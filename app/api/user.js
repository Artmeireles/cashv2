const bcrypt = require('bcrypt-nodejs')
const randomstring = require("randomstring")
const { baseFrontendUrl, emailAdmin, appName } = require("../config/params")
const { dbPrefix, jasperServerUrl, jasperServerU, jasperServerK } = require("../.env")
const axios = require('axios')
const crypto = require('crypto')
const moment = require('moment')
const { Stats } = require('fs')

module.exports = app => {
    const { existsOrError, notExistsOrError, equalsOrError, emailOrError, isMatchOrError, noAccessMsg, cpfOrError } = app.api.validation
    const { titleCase } = app.api.facilities
    const { transporter } = app.api.mailer
    const tabela = `users`
    const tabelaParams = 'params'
    const tabelaFinParametros = 'fin_parametros'
    const STATUS_INACTIVE = 0
    const STATUS_SUSPENDED = 9
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99

    const encryptPassword = password => {
        const salt = bcrypt.genSaltSync(10)
        return bcrypt.hashSync(password, salt)
    }

    const save = async (req, res) => {
        let user = { ...req.body }

        user.cpf = user.cpf.replace(/([^\d])+/gim, "")

        if (req.params.id) user.id = req.params.id

        if (!req.originalUrl.startsWith('/users')) user.gestor = false

        const sql = app.db(tabela)
        if (user.cpf)

            try {
                // Apenas gestores podem selecionar outros admins, gestores e se o usuário pode ser multiCliente
                if (user.id && !req.user.gestor >= 1 && (user.admin >= 1 || user.gestor >= 1 || user.multiCliente >= 1)) {
                    delete user.admin
                    delete user.gestor
                    delete user.multiCliente
                }
                // Apenas gestores e admins podem selecionar alçadas de usuários
                if (user.id && !(req.user.gestor >= 1) &&
                    (
                        user.consignatario >= 1 ||
                        user.tipoUsuario >= 1 ||
                        user.cad_servidores >= 1 ||
                        user.financeiro >= 1 ||
                        user.con_contratos >= 1
                    )) return res.status(401).send('Unauthorized')
                existsOrError(user.name, 'Nome não informado')
                existsOrError(user.cpf, 'CPF não informado')
                // existsOrError(user.email, 'E-mail não informado')
                existsOrError(user.telefone, 'Telefone não informado')
                if ((user.password || user.confirmPassword) && user.password != user.confirmPassword) {
                    existsOrError(user.password, 'Senha não informada')
                    existsOrError(user.confirmPassword, 'Confirmação de Senha inválida')
                    equalsOrError(user.password, user.confirmPassword, 'Senhas não conferem')
                } else if (!user.password) {
                    delete user.password
                }

                if (!user.id) {
                    notExistsOrError(userFromDB, 'Email ou CPF já registrado')
                }
            } catch (error) {
                console.log(error);
                return res.status(400).send(error)
            }

        if (user.email && user.email.trim.length == 0)
            delete user.email

        if (user.email && !emailOrError(user.email))
            return res.status(400).send('E-mail inválido')

        if (user.password && user.confirmPassword)
            user.password = encryptPassword(user.password)

        delete user.idCadas
        delete user.clientName
        delete user.confirmPassword
        delete user.j_user
        delete user.j_paswd

        const f_folha = new Date()

        if (user.id) {
            const uParams = await app.db('users').where({ id: user.id }).first();
            // Variáveis da edição de um registro
            // registrar o evento na tabela de eventos
            const { createEventUpd } = app.api.sisEvents
            const evento = await createEventUpd({
                "notTo": ['created_at', 'password_reset_token', 'evento'],
                "last": await app.db(tabela).where({ id: user.id }).first(),
                "next": user,
                "request": req,
                "evento": {
                    "evento": `Alteração de perfil de usuário`,
                    "tabela_bd": "user",
                }
            })

            app.api.logger.logInfo({ log: { line: `Alteração de perfil de usuário! Usuário: ${user.name}`, sConsole: true } })

            const tabelaFinParamsDomain = `${dbPrefix}_${user.cliente}_${user.dominio}.${tabelaFinParametros}`
            const mesAtual = f_folha.getMonth().toString().padStart(2, "0")
            let isMonth = await app.db(tabelaFinParamsDomain).where({ ano: user.f_ano, mes: user.f_mes }).first()
            if (!isMonth)
                isMonth = await app.db(tabelaFinParamsDomain).where({ ano: user.f_ano, mes: mesAtual }).first()
            if (!isMonth)
                isMonth = await app.db(tabelaFinParamsDomain).where({ ano: user.f_ano }).orderBy('mes', 'complementar').first()

            let isComplementary = await app.db(tabelaFinParamsDomain).where({ ano: user.f_ano, mes: isMonth.mes, complementar: user.f_complementar }).first()
            if (!isComplementary)
                isComplementary = await app.db(tabelaFinParamsDomain).where({ ano: user.f_ano, mes: isMonth.mes, complementar: '000' }).first()
            if (!isComplementary)
                isComplementary = await app.db(tabelaFinParamsDomain).where({ ano: user.f_ano, mes: isMonth.mes }).orderBy('complementar').first()

            user.f_mes = isMonth.mes
            user.f_complementar = isComplementary.complementar
            user.evento = evento
            user.updated_at = new Date()
            const rowsUpdated = await app.db(tabela)
                .update(user)
                .where({ id: user.id })
                .then(_ => {
                    return res.json(user)
                })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
            existsOrError(rowsUpdated, 'Usuário não foi encontrado')
        } else {
            // Criação de um novo registro
            const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()

            user.evento = nextEventID.count + 1
            // Variáveis da criação de um novo registro
            user.status = STATUS_INACTIVE
            user.created_at = new Date()
            user.f_ano = f_folha.getFullYear()
            user.f_mes = f_folha.getMonth().toString().padStart(2, "0")
            user.f_complementar = '000'
            const expiresIn = Math.floor(Date.now() / 1000) + 300
            user.sms_token = `${crypto.randomBytes(3).toString('hex')}_${expiresIn}`
            app.db(tabela)
                .insert(user)
                .then(async (ret) => {
                    mailyNew(user)
                    user.id = ret[0]
                    req.body = user
                    smsToken(req)
                    // registrar o evento na tabela de eventos
                    const { createEventIns } = app.api.sisEvents
                    createEventIns({
                        "notTo": ['created_at', 'password', 'password_reset_token', 'evento'],
                        "next": user,
                        "request": req,
                        "evento": {
                            "evento": `Novo perfil de usuário`,
                            "tabela_bd": "user",
                        }
                    })

                    app.api.logger.logInfo({ log: { line: `Novo de perfil de usuário! Usuário: ${user.name}`, sConsole: true } })
                    return res.json(user)
                })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
        }
    }

    const signup = async (req, res) => {
        const body = { ...req.body }
        try {
            existsOrError(body.cpf, 'CPF não informado')
            cpfOrError(body.cpf, 'CPF inválido')
            if (body.email) if (!emailOrError(body.email)) throw 'Email informado está num formato inválido'
        } catch (error) {
            return res.status(400).send(error)
        }
        // Primeiro verifica se o usuário informou todos os dados obrigatórios para o registro
        if (body.client && body.domain && body.id && body.celular) {
            // Dados necessários localizados
            // Criação de um novo registro
            const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()

            body.evento = nextEventID.count + 1
            // Variáveis da criação de um novo registro
            body.status = STATUS_INACTIVE
            body.created_at = new Date()
            body.f_ano = body.created_at.getFullYear()
            body.f_mes = body.created_at.getMonth().toString().padStart(2, "0")
            body.f_complementar = '000'
            body.name = body.nome
            body.telefone = body.celular
            body.cliente = body.client
            body.dominio = body.domain
            if (!emailOrError(body.email)) delete body.email
            delete body.id
            delete body.nome
            delete body.celular
            delete body.client
            delete body.domain
            delete body.clientName
            const expiresIn = Math.floor(Date.now() / 1000) + 300
            body.sms_token = `${crypto.randomBytes(3).toString('hex')}_${expiresIn}`
            app.db(tabela)
                .insert(body)
                .then(async (ret) => {
                    mailyNew(body)
                    body.id = ret[0]
                    req.body = body
                    smsToken(req)
                    // registrar o evento na tabela de eventos
                    const { createEventIns } = app.api.sisEvents
                    createEventIns({
                        "notTo": ['created_at', 'password', 'password_reset_token', 'evento'],
                        "next": body,
                        "request": req,
                        "evento": {
                            "evento": `Novo perfil de usuário`,
                            "tabela_bd": "user",
                        }
                    })

                    app.api.logger.logInfo({ log: { line: `Novo de perfil de usuário! Usuário: ${body.name}`, sConsole: true } })
                    return res.json(body)
                })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
        } else {
            // Caso os dados obrigatórios não tenha sido dados então vai para a localização e validação
            const cad_servidor = {
                data: {}
            }
            const clientServidor = {}
            body.cpf = body.cpf.replace(/([^\d])+/gim, "")
            const userFromDB = await app.db(tabela)
                .select('id', 'email', 'name', 'cpf')
                .where({ cpf: body.cpf }).first()

            // Se o usuário já estiver registrado
            if (userFromDB && userFromDB.id) {
                return res.status(200).send({
                    registred: true, msg: `O CPF informado já se encontra registrado. Por favor prossiga para o login ou se esqueceu sua senha então poderá recuperá-la`,
                    data: userFromDB
                })
            }
            // Se o usuário não estiver registrado
            if (!userFromDB) {
                const clientNames = await app.db(tabelaParams)
                    .where({ dominio: 'root', meta: 'clientName', status: 10 })
                    .whereNot({ value: 'root' })
                for (let client = 0; client < clientNames.length; client++) {
                    const clientName = clientNames[client].value;
                    const domainNames = await app.db(tabelaParams)
                        .where({ dominio: clientName, meta: 'domainName', status: 10 })
                        .whereNot({ value: 'root' })
                    for (let domain = 0; domain < domainNames.length; domain++) {
                        const domainName = domainNames[domain].value;
                        const tabelaCadServidoresDomain = `${dbPrefix}_${clientName}_${domainName}.cad_servidores`
                        const tabelaFinSFuncionalDomain = `${dbPrefix}_${clientName}_${domainName}.fin_sfuncional`
                        const cad_servidores = await app.db({ cs: tabelaCadServidoresDomain })
                            .select('cs.id', 'cs.cpf', 'cs.nome', 'cs.email', 'cs.celular')
                            .join({ ff: `${tabelaFinSFuncionalDomain}` }, function () {
                                this.on(`ff.id_cad_servidores`, `=`, `cs.id`)
                            })
                            .where({ 'cs.cpf': body.cpf.replace(/([^\d])+/gim, "") })
                            .andWhere(app.db.raw(`ff.situacaofuncional is not null and ff.situacaofuncional > 0 and ff.mes < 13`))
                            .first()
                            .orderBy('ff.ano', 'desc')
                            .orderBy('ff.mes', 'desc')
                            .limit(1)
                        clientServidor.client = clientName
                        clientServidor.domain = domainName
                        clientServidor.clientName = domainNames[domain].label

                        if (cad_servidores) {
                            cad_servidor.data = { ...cad_servidores, ...clientServidor }
                            break
                        }
                    }
                    if (cad_servidor.data.id) {
                        if (cad_servidor.data.celular.replace(/([^\d])+/gim, "").length == 11)
                            return res.json(cad_servidor.data)
                        else
                            return res.json({ msg: `O servidor ${titleCase(cad_servidor.data.nome)} foi localizado nos registro do município de ${clientServidor.clientName}, mas não tem um telefone registrado. Antes de prosseguir com o registro será necessário procurar o RH/DP de sua fonte pagadora para regularizar seu registro` })
                    }
                }


                try {
                    existsOrError(body.name, 'Nome não informado')
                    existsOrError(body.email, 'E-mail não informado')
                    existsOrError(body.telefone, 'Telefone não informado')
                    if ((body.password || body.confirmPassword) && body.password != body.confirmPassword) {
                        existsOrError(body.password, 'Senha não informada')
                        existsOrError(body.confirmPassword, 'Confirmação de Senha inválida')
                        equalsOrError(body.password, body.confirmPassword, 'Senhas não conferem')
                    }
                } catch (error) {
                    console.log(error);
                    return res.status(400).send(error)
                }

                if (!cad_servidor.data.id) {
                    return res.json({ found: false, data: "Não foi encontrado um servidor com esse CPF em nossos registros! Por favor, informe os dados a seguir inclusive o seu email corporativo" })
                }
            }
        }
    }


    const unlock = async (req, res) => {
        const user = {}
        if (req.params.id) user.id = req.params.id

        if (user.id && req.params.token) {
            // Utilizado para autorizar o usuário
            const userFromDB = await app.db(tabela)
                .select('id', 'status', 'email', 'sms_token', 'name')
                .where({ id: req.params.id }).first()

            if (!(userFromDB))
                return res.status(400).send('Usuário não encontrado!')

            const now = Math.floor(Date.now() / 1000)
            let tknOk = (req.params.token === Buffer.from(`${userFromDB.id}_${userFromDB.status}_${userFromDB.email}`).toString('base64'))
            let smsOk = (userFromDB.sms_token && req.params.token === userFromDB.sms_token.substring(0, 6) && Number(userFromDB.sms_token.substring(7)) > now)

            if (!tknOk && !smsOk)
                return res.status(200).send('Token inválido ou já utilizado!')

            user.status = STATUS_ACTIVE
            user.multiCliente = 1
            // registrar o evento na tabela de eventos
            const { createEventUpd } = app.api.sisEvents
            const evento = await createEventUpd({
                "notTo": ['created_at', 'password', 'password_reset_token', 'evento'],
                "last": userFromDB,
                "next": user,
                "request": req,
                "evento": {
                    "evento": `Liberação de perfil de usuário`,
                    "tabela_bd": "user",
                }
            })
            user.evento = evento
            user.status = STATUS_ACTIVE
            user.updated_at = new Date()
            user.sms_token = null
            app.db(tabela)
                .update(user)
                .where({ id: user.id })
                .then(_ => {
                    if (userFromDB.email)
                        mailyUnlocked(userFromDB)
                    app.api.logger.logInfo({ log: { line: `Usuário autorizado a usar o sistema! Usuário: ${userFromDB.name}`, sConsole: true } })
                    return res.status(200).send('Usuário autorizado a usar o sistema!<br>Obrigado por sua confirmação')
                })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
        }
    }

    const passwordReset = async (req, res) => {
        if (req.params.token != null) {
            const user = { ...req.body }
            if (!user.sms_token) return res.status(400).send('Token não informado')

            const userFromDB = await app.db(tabela)
                .where(app.db.raw(`substring(sms_token, 1, 6) = '${user.sms_token}'`))
                .where({ password_reset_token: req.params.token }).first()

            if (!userFromDB) return res.status(400).send('Token inválido!')
            if (!user.password) return res.status(400).send('Senha não informada')
            if (!user.confirmPassword) return res.status(400).send('Confirmação de Senha inválida')
            if (user.password != user.confirmPassword) return res.status(400).send('Senhas não conferem')


            // verifica se é válido em relação ao tempo de criação
            const now = Math.floor(Date.now() / 1000)
            if (userFromDB.password_reset_token.substring(28, 10) < now)
                return res.status(400).send('Token expirado!')
            // return

            user.password = encryptPassword(user.password)
            delete user.confirmPassword

            // registrar o evento na tabela de eventos
            const { createEvent } = app.api.sisEvents
            const evento = await createEvent({
                "request": req,
                "evento": {
                    "ip": req.ip,
                    "id_user": !(req.user && req.user.id) ? userFromDB.id : req.user.id,
                    "evento": `Alteração de senha do usuário ${userFromDB.id} ${userFromDB.email}`,
                    "classevento": `password-reset`,
                    "id_registro": userFromDB.id,
                    "tabela_bd": "user"
                }
            })

            user.evento = evento
            user.status = STATUS_ACTIVE
            user.password_reset_token = null
            app.db(tabela)
                .update({
                    evento: user.evento,
                    status: user.status,
                    updated_at: new Date(),
                    password_reset_token: user.password_reset_token,
                    password: user.password
                })
                .where({ id: userFromDB.id })
                .then(_ => {
                    return res.status(200).send('Senha alterada com sucesso!')
                })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
        }
    }

    const requestPasswordReset = async (req, res) => {
        let user = { ...req.body }
        try {
            existsOrError(user.cpf, 'Dado não informado')
        } catch (error) {
            return res.status(400).send(error)
        }
        const thisUser = await app.db(tabela).where({ cpf: user.cpf.replace(/([^\d])+/gim, "") }).first()
        try {
            existsOrError(thisUser, 'Usuário não foi encontrado')
        } catch (error) {
            return res.status(400).send(error)
        }

        const now = Math.floor(Date.now() / 1000)
        // Editar perfil de um usuário inserindo um token de renovação e um time
        // registrar o evento na tabela de eventos
        const { createEvent } = app.api.sisEvents
        const evento = await createEvent({
            "request": req,
            "evento": {
                "ip": req.ip,
                "id_user": thisUser.id,
                "evento": `Criação de token de troca de senha de usuário`,
                "classevento": `requestPasswordReset`,
                "id_registro": null
            }
        })

        thisUser.evento = evento
        const password_reset_token = randomstring.generate(27) + '_' + Number(now + 10 * 60) // 10 minutos de validade
        // try {
        app.db(tabela)
            .update({
                status: STATUS_INACTIVE,
                evento: evento,
                updated_at: new Date(),
                password_reset_token: password_reset_token
            })
            .where({ cpf: thisUser.cpf })
            .then(_ => {
                existsOrError(thisUser, 'Usuário não foi encontrado')
                // if (thisUser.email) {
                req.body = thisUser
                smsToken(req)
                mailyPasswordReset(thisUser)
                return res.status(200).send({
                    msg: `Verifique seu email ou SMS no celular (${thisUser.telefone}) para concluir a operação!`,
                    token: password_reset_token
                })
                // }
                // else {
                //     return res.status(200).send(`Verifique o SMS no celular (${thisUser.telefone}) para concluir a operação!`)
                // }
            })
            .catch(msg => {
                res.status(400).send(error)
            })
    }

    const limit = 20 // usado para paginação
    const get = async (req, res) => {
        let user = req.user
        const page = req.query.page || 1
        const key = req.query.key ? req.query.key : undefined
        const uParams = await app.db('users').where({ id: user.id }).first();

        const sql = app.db({ us: tabela }).select(app.db.raw('count(*) as count'))
            .where(app.db.raw(`us.status = ${STATUS_ACTIVE}`))
        if (key)
            sql.where(function () {
                this.where('us.name', 'like', `%${key}%`)
            })
        if (uParams.multiCliente == 0) {
            // Não troca cliente nem domínio
            sql.where({ 'us.cliente': uParams.cliente, 'us.dominio': uParams.dominio })
        }
        if (uParams.multiCliente >= 1) {
            // Não troca cliente mas troca domínio
            sql.where({ 'us.cliente': uParams.cliente })
        }
        if (uParams.gestor < 1) {
            // Se não for gestor vÊ apenas seus registros
            sql.where({ 'us.id': req.user.id })
        }
        if (uParams.tipoUsuario == 1) {
            sql.where({ 'us.tipoUsuario': uParams.tipoUsuario })
                .where({ 'us.consignatario': uParams.consignatario })
        }
        const result = await app.db.raw(sql.toString())
        count = parseInt(result[0][0].count) || 0

        const ret = app.db({ us: tabela })
            .select("id", "status", "name", "cpf", "email", "telefone", "id_cadas",
                "cliente", "dominio", "admin", "gestor", "multiCliente", "consignatario",
                "tipoUsuario", "averbaOnline", "cad_servidores", "financeiro", "con_contratos",
                "cad_orgao", "f_ano", "f_mes", "f_complementar", "tkn_api")
            .where(app.db.raw(`us.status = ${STATUS_ACTIVE}`))
        if (key)
            ret.where(function () {
                this.where('us.name', 'like', `%${key}%`)
            })
        if (uParams.multiCliente == 0) {
            // Não troca cliente nem domínio
            ret.where({ 'us.cliente': uParams.cliente, 'us.dominio': uParams.dominio })
        }
        if (uParams.multiCliente >= 1) {
            // Não troca cliente mas troca domínio
            ret.where({ 'us.cliente': uParams.cliente })
        }
        if (uParams.gestor < 1) {
            // Se não for gestor vÊ apenas seus registros
            ret.where({ 'us.id': req.user.id })
        }
        if (uParams.tipoUsuario == 1) {
            ret.where({ 'us.tipoUsuario': uParams.tipoUsuario })
                .where({ 'us.consignatario': uParams.consignatario })
        }
        ret.limit(limit).offset(page * limit - limit).orderBy("us.name")
        ret.then(users => {
            return res.json({ data: users, count, limit })
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getById = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        if (req.user.id != req.params.id && uParams.gestor < 1) return res.status(401).send('Unauthorized')
        app.db(tabela)
            // .select('users.id', 'users.status', 'users.evento', 'users.created_at', 'users.updated_at', 'dominio', 'cliente', 'email', 'telefone',
            //     'name', 'cpf', 'admin', 'gestor', 'tipoUsuario', 'multiCliente')
            .where(app.db.raw(`users.id = ${req.params.id}`))
            .where(app.db.raw(`users.status = ${STATUS_ACTIVE}`))
            .first()
            .then(users => {
                users.j_user = jasperServerU
                users.j_paswd = jasperServerK
                delete users.password
                return res.json(users)
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getByCpf = async (req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        if (req.user.id != req.params.id && uParams.cadastros < 1) return res.status(401).send('Unauthorized')
        app.db(tabela)
            // .select('users.id', 'users.status', 'users.evento', 'users.created_at', 'users.updated_at', 'dominio', 'cliente', 'email', 'telefone',
            //     'name', 'cpf', 'admin', 'gestor', 'tipoUsuario', 'multiCliente')
            .where(app.db.raw(`users.cpf = ${req.params.cpf}`))
            .where(app.db.raw(`users.status = ${STATUS_ACTIVE}`))
            .first()
            .then(users => {
                return res.json(users)
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const getByToken = async (req, res) => {
        if (!req.params.token) return res.status(401).send('Unauthorized')
        const sql = app.db(tabela)
            .select('users.id', app.db.raw('REPLACE(users.name, " de", "") as name'), app.db.raw('substring(users.sms_token, 1,6) as sms_token'))
            .where(app.db.raw(`users.password_reset_token = '${req.params.token}'`))
            .first()
        sql.then(user => {
            const username = user.name.split(" ")
            user.name = `${username[0]}${username[1] ? ` ${username[1]}` : ''}`
            return res.json(user)
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const remove = async (req, res) => {
        const user = { status: STATUS_DELETE }
        try {
            // registrar o evento na tabela de eventos
            const last = await app.db(tabela).where({ id: req.params.id }).first()
            const { createEventUpd } = app.api.sisEvents
            const evento = await createEventUpd({
                "notTo": ['created_at', 'password', 'password_reset_token', 'evento'],
                "last": last,
                "next": user,
                "request": req,
                "evento": {
                    "classevento": "Remove",
                    "evento": `Exclusão de usuário`,
                    "tabela_bd": "user",
                }
            })
            const rowsUpdated = await app.db(tabela)
                .update({
                    status: user.status,
                    evento: evento
                })
                .where({ id: req.params.id })
            existsOrError(rowsUpdated, 'Usuário não foi encontrado')

            res.status(204).send()
        } catch (error) {
            res.status(400).send(error)
        }
    }

    const smsToken = async (req, res) => {
        const body = { ...req.body }
        const now = Math.floor(Date.now() / 1000)
        const expiresIn = now + Number(now + 10 * 60)

        const user = await app.db('users').where({ id: body.id }).first()
        const expired = !user.sms_token || Number(user.sms_token.substring(7)) < now

        if (!expired) body.sms_token = user.sms_token
        else body.sms_token = `${crypto.randomBytes(3).toString('hex')}_${expiresIn}`
        token = body.sms_token.substring(0, 6)
        try {
            const url = "https://sms.comtele.com.br/api/v2/send"
            moment().locale('pt-br')
            const data = {
                "Sender": "MGCash.app.br", "Receivers": body.celular || body.telefone,
                "Content": `Para liberar seu acesso à nossa plataforma, utilize o código: ${token}`
            }
            const config = {
                headers: {
                    'content-type': 'application/json',
                    'auth-key': '7bc83b13-030f-4700-b56a-7352590d5a8c'
                },
                // timeout: 1000,
            }
            const response = await axios.post(url, data, config)
            const responseData = response.data;
            if (expired) {
                const bodyRes = user
                bodyRes.sms_token = body.sms_token
                const { createEventUpd } = app.api.sisEvents
                const evento = await createEventUpd({
                    "notTo": ['created_at'],
                    "last": user,
                    "next": bodyRes,
                    "request": req,
                    "evento": {
                        "classevento": "smsToken",
                        "evento": `Geração e envio de token SMS`,
                        "tabela_bd": "user",
                    }
                })
                bodyRes.evento = evento
                app.db('users').update(bodyRes).where({ id: body.id }).then()
            }
            if (body.sendRes && body.sendRes == 1) res.send('SMS enviado com sucesso')
            else return token
        } catch (error) {
            console.log("Erro de execução", error);
            if (axios.isAxiosError(error)) {
                console.log("Erro axios", error);
            }
            res.status(400).send(error)
        }
    }

    const mailyNew = async (req, res) => {
        const body = { ...req.body }
        try {
            let sqlW = { cpf: body.cpf || req.cpf }
            const user = await app.db(tabela).where(sqlW).first()
            existsOrError(user, 'Usuário não foi encontrado')
            const confirmString = Buffer.from(`${user.id}_${user.status}_${user.email}`).toString('base64')
            if (user.email)
                await transporter.sendMail({
                    from: `"${appName}" <contato@mgcash.app.br>`, // sender address
                    to: `${user.email}`, // list of receivers
                    subject: `Bem-vindo ao ${appName}`, // Subject line
                    text: `Olá ${user.name}!\n
                Estamos confirmando sua inscrição✔
                Para liberar seu acesso, por favor acesse o link abaixo ou utilize o código ${user.sms_token.substring(0, 6)} na tela de login.\n
                ${baseFrontendUrl}/user-unlock/${user.id}/${confirmString}\n
                Atenciosamente,\nTime ${appName}`,
                    html: `<p><b>Olá ${user.name}!</b></p>
                <p>Estamos confirmando sua inscrição✔</p>
                <p>Para liberar seu acesso utilize uma das seguinte opções:</p>
                <ul>
                <li>Clique <a href="${baseFrontendUrl}/user-unlock/${user.id}/${confirmString}">aqui</a></li>
                <li>Acesse o link ${baseFrontendUrl}/user-unlock/${user.id}/${confirmString}</li>
                <li>Ou utilize o código <strong><code>${user.sms_token.substring(0, 6)}</code></strong> na tela de login</li>
                </ul>
                <p>Atenciosamente,</p>
                <p><b>Time ${appName}</b></p>`,
                }).then(_ => {
                })
            await transporter.sendMail({
                from: `"${appName}" <contato@mgcash.app.br>`, // sender address
                to: `${emailAdmin}`, // list of receivers
                subject: `Novo usuário ${appName}`, // Subject line
                text: `Estamos confirmando a inscrição de um novo usuário\n
                ${user.name}: ${user.email}✔\n
                Atenciosamente,\n
                Time ${appName}`,
                html: `<p>Estamos confirmando a inscrição de um novo usuário</p>
                <p>${user.name}✔</p>
                <p>Atenciosamente,</p>
                <p><b>Time ${appName}</b></p>`,
            }).then(_ => {
                if (body.sendRes && body.sendRes == 1) res.send("Email enviado com sucesso! Por favor verifique sua caixa de entrada.")
            })
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } });
            res.status(400).send(error)
        }
    }

    const mailyPasswordReset = async (req, res) => {
        try {
            const user = await app.db(tabela)
                .where({ email: req.email }).first()
            existsOrError(user, 'Usuário não foi encontrado')
            await transporter.sendMail({
                from: `"${appName}" <contato@mgcash.app.br>`, // sender address
                to: `${user.email}`, // list of receivers
                subject: `Alteração de senha ${appName}`, // Subject line
                text: `Olá ${user.name}!\n
                Para atualizar sua senha, por favor acesse o link abaixo. Você necessitará informar o token a seguir para liberar sua nova senha: ${user.sms_token.substring(0, 6)}\n
                Lembre-se de que esse link tem validade de dez minutos.\n
                ${baseFrontendUrl}/password-reset/${user.password_reset_token}\n
                Atenciosamente,\nTime ${appName}`,
                html: `<p><b>Olá ${user.name}!</b></p>
                <p>Para atualizar sua senha, por favor acesse o link abaixo.</p>
                <p>Lembre-se de que esse link tem validade de dez minutos.</p>
                <p>Você necessitará informar o token a seguir para liberar sua nova senha: <strong>${user.sms_token.substring(0, 6)}</strong></p>
                <a href="${baseFrontendUrl}/password-reset/${user.password_reset_token}">${baseFrontendUrl}/password-reset/${user.password_reset_token}</a>
                <p>Atenciosamente,</p>
                <p><b>Time ${appName}</b></p>`,
            }).then(_ => {
            })
        } catch (error) {
            res.status(400).send(error)
        }
    }

    const mailyUnlocked = async (req, res) => {
        try {
            const user = await app.db(tabela)
                .where({ email: req.email }).first()
            existsOrError(user, 'Usuário não foi encontrado')
            await transporter.sendMail({
                from: `"${appName}" <contato@mgcash.app.br>`, // sender address
                to: `${user.email}`, // list of receivers
                subject: `Usuário liberado`, // Subject line
                text: `Olá ${user.name}!\n
                Estamos felizes que conseguiu liberar seu acesso.\n
                A partir de agora poderá acessar e utilizar o sistema.\n
                Caso seja necessário, por favor, solicite ao seu administrador para liberar acesso aos dados.\n
                Atenciosamente,\nTime ${appName}`,
                html: `<p><b>Olá ${user.name}!</b></p>
                <p>Estamos felizes que conseguiu liberar seu acesso.</p>
                <p>A partir de agora poderá acessar e utilizar o sistema.</p>
                <p>Caso seja necessário, por favor, solicite ao seu administrador para liberar acesso aos dados.</p>
                <p>Atenciosamente,</p>
                <p><b>Time ${appName}</b></p>`,
            }).then(_ => {
            })
        } catch (error) {
            res.status(400).send(error)
        }
    }

    const getDeskUser = async (req, res) => {
        const sisReviews = await app.db('sis_reviews')
            .select('versao', 'lancamento', 'revisao', 'descricao')
            .orderBy('versao', 'desc')
            .orderBy('lancamento', 'desc')
            .orderBy('revisao', 'desc')
            .first()
        const cli_nome_comput = req.query.cli_nome_comput || undefined
        const cli_nome_user = req.query.cli_nome_user || undefined
        const deskUsers = app.db('desk_users')
            .select('status_desk')
        if (cli_nome_comput && cli_nome_user)
            deskUsers.where({ cli_nome_comput: req.query.cli_nome_comput, cli_nome_user: req.query.cli_nome_user })
        deskUsers.first()
            .then(ret => {
                const rev = `${sisReviews.versao}.${sisReviews.lancamento}.${sisReviews.revisao.toString().padStart(3, '0')}`
                return res.json({
                    ...ret, 'versao': rev, 'razao': sisReviews.descricao, "body": "",
                    "link": "",
                    "id_msgs": ""
                })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const locateServidorOnClient = async (req, res) => {
        const clientName = req.user.cliente
        try {
            existsOrError(req.body.cpf, 'CPF não informado')
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
            return res.status(500).send(error)
        }
        const cpf = req.body.cpf.toString().replace(/([^\d])+/gim, "")
        const domainNames = await app.db(tabelaParams)
            .where({ dominio: clientName, meta: 'domainName', status: 10 })
            .whereNot({ value: 'root' })
        let clientServidor = []
        for (let domain = 0; domain < domainNames.length; domain++) {
            const domainName = domainNames[domain].value;
            const tabelaCadServidoresDomain = `${dbPrefix}_${clientName}_${domainName}.cad_servidores`
            const tabelaFinSFuncionalDomain = `${dbPrefix}_${clientName}_${domainName}.fin_sfuncional`
            const cad_servidores = await app.db({ cs: tabelaCadServidoresDomain })
                .select('cs.id', 'cs.matricula')
                .join({ ff: `${tabelaFinSFuncionalDomain}` }, function () {
                    this.on(`ff.id_cad_servidores`, `=`, `cs.id`)
                })
                .where({ 'cs.cpf': cpf })
                .andWhere(app.db.raw(`ff.situacaofuncional is not null and ff.situacaofuncional > 0 and ff.mes < 13`))
                .groupBy('cs.id')
                .orderBy('cs.matricula')
            cad_servidores.forEach(element => {
                const registro = {
                    ...element,
                    cliente: clientName,
                    dominio: domainName,
                    clientName: domainNames[domain].label,
                }
                clientServidor.push({
                    id: element.id,
                    value: `${element.id}_${registro.cliente}_${registro.dominio}`,
                    text: `${element.matricula.toString().padStart(8, '0')} (${registro.clientName})`
                })
            });
        }
        if (clientServidor) return res.send({ data: clientServidor })
        else return res.send('Servidor não localizado')
    }

    const getByFunction = async (req, res) => {
        const func = req.params.func
        switch (func) {
            case 'gsm':
                getSisMessages(req, res)
                break;
            case 'gss':
                getSisStatus(req, res)
                break;
            default:
                res.status(404).send('Função inexitente')
                break;
        }
    }

    const getSisMessages = async (req, res) => {
        const user = req.user
        if (user.id) {
            app.db('sis_msg').where({ status: STATUS_ACTIVE, id_user: user.id })
                .then(msgs => {
                    res.send(msgs)
                })
        }
    }
    const getSisStatus = async (req, res) => {
        const user = req.user
        if (user.id) {
            app.db('sis_msg').where({ status: STATUS_ACTIVE, status_user: STATUS_SUSPENDED, id_user: user.id }).first()
                .then(msgs => {
                    let status_user = true
                    if (msgs && moment().format() >= msgs.valid_from && moment().format() <= msgs.valid_to) status_user = false
                    res.send(status_user)
                })
        }
    }

    return {
        signup, save, get, getById, getByCpf, getByToken, smsToken, mailyNew, remove, getByFunction,
        requestPasswordReset, passwordReset, unlock, getDeskUser, locateServidorOnClient
    }
}