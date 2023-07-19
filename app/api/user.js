
const randomstring = require("randomstring")
const { baseFrontendUrl, emailAdmin, appName } = require("../config/params")
const { dbPrefix, jasperServerU, jasperServerK } = require("../.env")
const { STATUS_INACTIVE, STATUS_WAITING, STATUS_PASS_EXPIRED, STATUS_SUSPENDED, STATUS_SUSPENDED_BY_TKN, STATUS_ACTIVE,
    STATUS_DELETE, MINIMUM_KEYS_BEFORE_CHANGE, TOKEN_VALIDE_MINUTES } = require("../config/userStatus")
const axios = require('axios')
const moment = require('moment')
const welcomeUserMessages = require('../config/ia-models/welcomeUserMessages.js')
const newUserMessages = require('../config/ia-models/newUserMessages.js')
const concludeRegistrationMessages = require('../config/ia-models/concludeRegistrationMessages.js')
const noRepeatMessages = require('../config/ia-models/noRepeatMessages.js')
const incorrectKeyPassMsgs = require('../config/ia-models/incorrectKeyPassMsgs.js')
const noUserFoundMessages = require('../config/ia-models/noUserFoundMessages.js')

module.exports = app => {
    const { existsOrError, notExistsOrError, equalsOrError, isValidEmail, isEmailOrError, isCelPhoneOrError, cpfOrError, isValue, isBooleanOrError, booleanOrError } = app.api.validation
    const { titleCase, encryptPassword, comparePassword } = app.api.facilities
    const { transporter } = app.api.mailer
    const tabela = `users`
    const tabelaKeys = 'users_keys'
    const tabelaParams = 'params'
    const tabelaRemunParams = 'remun_params'

    /** 
     * Esta função vai tratar as seguintes situações de signup
     * 
     * #1 - Se o solicitante já tem perfil, então deve redirecionar para a tela de login
     * #2 - Se não tem perfil tenta localizar nos schemas dos clientes e se localizado:
     *      I - Se não tem um telefone válido deve informar que deve corrigir isso antes de prosseguir
     *      II - Se tiver um telefone válido informado
     *          a) Deve localizar entre os schemas dos clientes e devolver os dados para então prosseguir com a criação da senha
     *          b) Se não tem um email válido deve sugerir a inclusão. Isso deve ocorrer no frontend
     * #3 - Se não tem perfil e não é localizado nos schemas dos clientes todos os dados tornam-se obrigatórios exceto o id
     */
    const signup = async (req, res) => {
        const body = { ...req.body }
        let registered = false;
        try {
            existsOrError(body.cpf, 'CPF não informado')
            body.cpf = body.cpf.replace(/([^\d])+/gim, "")
            cpfOrError(body.cpf, 'CPF inválido')
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            return res.status(400).send({ msg: error })
        }

        /**
         * Se o e-mail for informado vazio exclui do body
        */
        if (!(!!body.email)) delete body.email

        /**
         * Tenta localizar o usuário a partir do cpf informado
        */
        const userFromDB = await app.db(tabela)
            .select('id', 'email', 'name', 'cpf', 'status')
            .where({ cpf: body.cpf }).first()
        const isStatusActive = (userFromDB && userFromDB.status == STATUS_ACTIVE) || false

        /**
         * #1 - Se o solicitante já tem perfil:
         *      a) Se é um usuário ativo então deve redirecionar para a tela de login
         *      b) Se ainda necessita confirmar o token de acesso deve ser informado
         */
        if (userFromDB && userFromDB.id) {
            registered = true
            let msg = `O CPF informado já se encontra registrado. `
            if (isStatusActive)
                msg += `Por favor prossiga para o login ou se esqueceu sua senha então poderá recuperá-la.`
            else
                msg += `Mas o sistema ainda não recebeu o seu token de confirmação.`
            return res.status(200).send({
                registered: registered,
                isStatusActive: isStatusActive,
                msg: msg,
                data: userFromDB
            })
        }

        /**
         * Se for informado um e-mail, faz a validação e 
         * bloqueia a duplicidade de e-mails
         */
        if (body.email) {
            try {
                isEmailOrError(body.email, 'E-mail informado está num formato inválido')
                const userEmail = await app.db(tabela).where({ email: body.email }).first()
                if (userEmail && !isStatusActive) notExistsOrError(userEmail.email, 'E-mail já registrado')
            } catch (error) {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(400).send({ msg: error })
            }
        }
        /**
         * #2 - Se não tem perfil e já informou os dados necessários para a criação do perfil:
        */
        if ((body.isNewUser || (body.client && body.domain)) && body.celular && body.cpf) {
            delete body.isNewUser
            /**
             * Se body.id NÃO for informado então não é servidor. Nesse caso body.email torna-se obrigatório
             */
            if (!(!!(body.id || body.email))) {
                try {
                    existsOrError(body.email, 'E-mail obrigatório não informado')
                } catch (error) {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    return res.status(400).send({ msg: error })
                }
            } else {
                /**
                 * Bloqueia a duplicidade de celulares
                 */
                if (body.celular)
                    try {
                        isCelPhoneOrError(body.celular, 'Número de celular informado é inválido')
                        const userCelPhone = await app.db(tabela).select('telefone').where({ telefone: body.celular }).first()
                        if (userCelPhone) notExistsOrError(userCelPhone.telefone, 'Celular já registrado')
                    } catch (error) {
                        app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                        return res.status(400).send({ msg: error })
                    }

                try {
                    existsOrError(body.name, 'Nome não informado')
                    existsOrError(body.password, 'Senha não informada')
                    existsOrError(body.confirmPassword, 'Confirmação de Senha inválida')
                    equalsOrError(body.password, body.confirmPassword, 'Senhas não conferem')
                } catch (error) {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    return res.status(400).send({ msg: error })
                }


                // Dados necessários agrupados
                // Criação de um novo registro
                const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()

                // Variáveis da criação de um novo registro
                body.evento = nextEventID.count + 1
                const now = Math.floor(Date.now() / 1000)
                body.password_reset_token = randomstring.generate(8).toUpperCase() + '_' + Number(now + TOKEN_VALIDE_MINUTES * 60)
                body.status = STATUS_WAITING
                body.created_at = new Date()
                body.f_ano = body.created_at.getFullYear()
                body.f_mes = body.created_at.getMonth().toString().padStart(2, "0")
                body.f_complementar = '000'
                body.id_cadas = body.id
                body.telefone = body.celular
                body.cliente = body.client
                body.dominio = body.domain

                try {
                    if (typeof isValidPassword(body.password) === 'string') throw isValidPassword(body.password)
                } catch (error) {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    return res.status(400).send({
                        isInvalidPassword: true,
                        msg: error
                    })
                }

                const password = encryptPassword(body.password)

                delete body.id
                delete body.nome
                delete body.celular
                delete body.client
                delete body.domain
                delete body.clientName
                delete body.confirmPassword
                delete body.password

                app.db(tabela)
                    .insert(body)
                    .then(async (ret) => {
                        mailyToken(body)
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

                        // Criação do registro da senha
                        const userKey = {}
                        const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()
                        userKey.evento = nextEventID.count + 1
                        userKey.password = password
                        userKey.status = STATUS_ACTIVE
                        app.db(tabelaKeys)
                            .insert({
                                created_at: new Date(),
                                evento: userKey.evento,
                                status: userKey.status,
                                password: userKey.password,
                                id_users: body.id
                            })
                            .then(() => {
                                const { createEventIns } = app.api.sisEvents
                                createEventIns({
                                    "notTo": ['created_at', 'password', 'evento'],
                                    "next": userKey,
                                    "request": req,
                                    "evento": {
                                        "evento": `Registro de senha de usuário`,
                                        "tabela_bd": "user_keys",
                                    }
                                })
                            })
                            .catch(error => {
                                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                                return res.status(500).send({ msg: error })
                            })

                        app.api.logger.logInfo({ log: { line: `Novo de perfil de usuário! Usuário: ${body.name}`, sConsole: true } })
                        return res.json({
                            data: body,
                            msg: [
                                `Olá ${body.name.split(' ')[0]}!`,
                                `Estamos confirmando sua inscrição ✔`,
                                `Para liberar seu acesso, informe dentro dos próximos ${TOKEN_VALIDE_MINUTES} minutos o token que enviamos em seu email ou SMS`
                            ]
                        })
                    })
                    .catch(error => {
                        app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                        return res.status(500).send({ msg: error })
                    })
            }
        }
        /**
         * #2 - Se não tem perfil e não informou os dados necessários para a criação do perfil:
         *      a) vai para a localização dos dados nos schemas dos clientes
        */
        else {
            const cad_servidor = {
                data: {}
            }
            const clientServidor = {}
            const dbSchemas = await app.db.raw(`WITH RECURSIVE bd_schemas AS (
                            SELECT p.status, p.dominio, p.value, p.label
                            FROM params p
                            WHERE p.dominio = 'root' AND p.meta = 'clientName' AND p.status = 10 AND p.value != 'root'
                            UNION ALL
                            SELECT f.status, f.dominio, f.value, f.label
                            FROM params f
                            INNER JOIN bd_schemas d ON f.dominio = d.value
                            WHERE f.meta = 'domainName' AND f.status = 10 AND f.value != 'root'
                        )
                        SELECT r.dominio cliente, r.value dominio, r.label clienteName
                        FROM bd_schemas r WHERE r.dominio != 'root'`)

            for (let index = 0; index < dbSchemas[0].length; index++) {
                const element = dbSchemas[0][index];
                const client = element.cliente
                const domain = element.dominio
                const clienteName = element.clienteName
                const tabelaCadServidoresDomain = `${dbPrefix}_${client}_${domain}.cad_servidores`
                const tabelaFinSFuncionalDomain = `${dbPrefix}_${client}_${domain}.fin_sfuncional`
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
                clientServidor.client = client
                clientServidor.domain = domain
                clientServidor.clientName = clienteName

                if (cad_servidores) {
                    cad_servidor.data = { ...cad_servidores, ...clientServidor }
                    break
                }
            }
            // Se localizou um resgitro em um dos clientes...
            if (cad_servidor.data.id) {
                if (cad_servidor.data.celular.replace(/([^\d])+/gim, "").length == 11)
                    return res.json({
                        isCelularValid: true,
                        ...cad_servidor.data
                    })
                else
                    // Se o celular está num formato inválido...
                    return res.json({
                        isCelularValid: false,
                        msg: `O servidor ${titleCase(cad_servidor.data.nome)} foi localizado nos registro do município de ${clientServidor.clientName}, 
                        mas não tem um telefone celular válido registrado${cad_servidor.data.celular ? ' (' + cad_servidor.data.celular + ')' : ''}. 
                        Antes de prosseguir com o registro será necessário procurar o RH/DP de ${clientServidor.clientName.split("-")[0]} 
                        para regularizar seu registro`
                    })
            } else {
                /**
                 * #3 - Se não tem perfil e não é localizado nos schemas dos clientes todos os dados tornam-se obrigatórios exceto o id
                */
                return res.json({ isNewUser: true, msg: await showNewUserMessage() || "Não encontramos as informações que você forneceu. Por favor, complete os campos com os dados necessários para criar seu perfil de usuário" })
            }
        }
    }

    /**
     * Gera e envia um token e uma URL (apenas no email registrado) para criação de uma nova senha
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    const requestPasswordReset = async (req, res) => {
        let user = { ...req.body }
        try {
            existsOrError(user.cpf, 'CPF não informado')
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            return res.status(200).send(error)
        }
        const thisUser = await app.db(tabela)
            .where({ cpf: user.cpf.replace(/([^\d])+/gim, "") })
            .orWhere({ email: user.cpf })
            .first()
        try {
            existsOrError(thisUser, await showRandomMessage())
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            return res.status(200).send(error)
        }

        let password_reset_token = undefined
        const now = Math.floor(Date.now() / 1000)
        let validate = 0
        if (thisUser.password_reset_token && thisUser.password_reset_token.split('_').length > 0) validate = thisUser.password_reset_token.split('_')[1]
        if (validate > (now - 60)) {
            // Se o token estiver dentro da validade menos um minuto então não gera outro
            return res.status(200).send({
                id: thisUser.id,
                msg: `Verifique seu email${thisUser.email ? (' (' + thisUser.email + ')') : ''} ou SMS no celular (${thisUser.telefone}) para concluir a operação!`,
                token: thisUser.password_reset_token
            })
        } else {
            // Editar perfil de um usuário inserindo um token de renovação e um time
            // registrar o evento na tabela de eventos
            const { createEvent } = app.api.sisEvents
            const evento = await createEvent({
                "request": req,
                "evento": {
                    "id_user": thisUser.id,
                    "evento": `Criação de token de troca de senha de usuário`,
                    "classevento": `requestPasswordReset`,
                    "id_registro": null
                }
            })

            thisUser.evento = evento
            password_reset_token = randomstring.generate(8).toUpperCase() + '_' + Number(now + TOKEN_VALIDE_MINUTES * 60)
            // try {
            app.db(tabela)
                .update({
                    evento: evento,
                    updated_at: new Date(),
                    password_reset_token: password_reset_token,
                })
                .where({ cpf: thisUser.cpf })
                .then(_ => {
                    req.body = thisUser
                    smsToken(req)
                    mailyPasswordReset(thisUser)
                    return res.status(200).send({
                        id: thisUser.id,
                        msg: `Verifique seu email${thisUser.email ? (' (' + thisUser.email + ')') : ''} ou SMS no celular (${thisUser.telefone}) para concluir a operação!`,
                        token: password_reset_token
                    })
                })
                .catch(msg => {
                    res.status(200).send(error)
                })
        }
    }

    /**
     * Operações de troca de senha
     */
    const passwordReset = async (req, res) => {
        let user = { ...req.body }
        try {
            existsOrError(user.password, 'Senha não informada')
            existsOrError(user.confirmPassword, 'Confirmação de Senha não informada')
            if (user.password != user.confirmPassword) throw 'Senhas não conferem'
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            return res.status(400).send(error)
        }
        if (!(req.query.tkn || (req.body && req.body.token)))
            return res.status(400).send(await showRandomMessage() || 'Token ausente, inválido ou não corresponde a nenhuma conta em nosso sistema')
        const token = req.query.tkn || req.body.token
        const userFromDB = await app.db(tabela)
            .select('id', 'status', 'email', 'password_reset_token', 'name')
            .where({ id: req.params.id })
            .where(function () {
                this.where(app.db.raw(`SUBSTRING_INDEX(password_reset_token,'_',1) = '${token}'`))
                    .andWhere({ id: req.params.id })
            }).first()
        if (!(userFromDB))
            return res.status(400).send(await showRandomMessage() || 'Token informado é inválido ou não correspondem a nenhuma conta em nosso sistema')

        // verifica se o token é válido em relação ao tempo de criação
        const now = Math.floor(Date.now() / 1000)
        if (userFromDB.password_reset_token.split('_')[1] < now)
            return res.status(400).send('Token expirado!')

        // Localiza as últimas 
        const lastUserKeys = await app.db({ ut: tabelaKeys })
            .select('password')
            .where({ 'id_users': userFromDB.id })
            .orderBy('created_at', 'desc')
            .limit(MINIMUM_KEYS_BEFORE_CHANGE)

        let isMatch = false
        for (const element of lastUserKeys) {
            isMatch = comparePassword(user.password, element.password)
            if (isMatch) {
                return res.status(400).send(await showRandomNoRepeatMessage() || 'Por favor, selecione uma nova senha que não tenha sido usada nas últimas vezes')
            }
        };

        const passTest = user.password
        try {
            if (typeof isValidPassword(passTest) === 'string') throw isValidPassword(passTest)
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            return res.status(200).send({
                isValidPassword: false,
                msg: error
            })
        }

        user.password = encryptPassword(user.password)
        delete user.confirmPassword

        // registrar o evento na tabela de eventos
        const { createEvent } = app.api.sisEvents
        const evento = await createEvent({
            "request": req,
            "evento": {
                "id_user": userFromDB.id,
                "evento": `Nova de senha do usuário ${userFromDB.id} ${userFromDB.email}`,
                "classevento": `password-reset`,
                "id_registro": userFromDB.id,
                "tabela_bd": "users_keys"
            }
        })

        await app.db(tabela)
            .update({
                status: STATUS_ACTIVE,
                updated_at: new Date(),
                password_reset_token: null
            })
            .where({ id: userFromDB.id })
        delete user.password_reset_token

        user.evento = evento
        user.status = STATUS_ACTIVE
        app.db(tabelaKeys)
            .insert({
                created_at: new Date(),
                evento: user.evento,
                status: user.status,
                password: user.password,
                id_users: userFromDB.id
            })
            .then(_ => {
                return res.status(200).send({
                    msg: 'Senha criada/alterada com sucesso!'
                })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send({ msg: error })
            })
    }

    /**
     * Função para o desbloqueio de usuário por link de email/SMS ou token SMS
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    const unlock = async (req, res) => {
        if (!(req.query.tkn || (req.body && req.body.token)))
            return res.status(400).send(await showRandomMessage() || 'Token ausente, inválido ou não corresponde a nenhuma conta em nosso sistema')
        const token = req.query.tkn || req.body.token
        const userFromDB = await app.db(tabela)
            .select('id', 'status', 'email', 'password_reset_token', 'name')
            .where(function () {
                this.where(app.db.raw(`SUBSTRING_INDEX(password_reset_token,'_',1) = '${token}'`))
                    .andWhere({ id: req.params.id })
            }).first()

        if (!(userFromDB))
            return res.status(400).send({
                msg: await showRandomMessage() || 'Token informado é inválido ou não correspondem a nenhuma conta em nosso sistema'
            })

        const now = Math.floor(Date.now() / 1000)
        let expirationTimOk = false
        if (userFromDB.password_reset_token) expirationTimOk = Number(userFromDB.password_reset_token.split('_')[1]) > now

        if (!expirationTimOk)
            return res.status(200).send({
                msg: 'O token informado é inválido ou já foi utilizado'
            })

        const user = userFromDB

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
        user.password_reset_token = null
        user.tipoUsuario = user.id_cadas ? 0 : 1
        app.db(tabela)
            .update(user)
            .where({ id: user.id })
            .then(_ => {
                if (userFromDB.email)
                    mailyUnlocked(userFromDB)
                app.api.logger.logInfo({ log: { line: `Usuário autorizado a usar o sistema! Usuário: ${userFromDB.name}`, sConsole: true } })
                return res.status(200).send({ msg: 'Usuário autorizado a usar o sistema! Obrigado por sua confirmação' })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send({ msg: error })
            })
    }

    /**
     * Função utilizada para envio/reenvio do token por SMS
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    const smsToken = async (req, res) => {
        const body = { ...req.body }
        const now = Math.floor(Date.now() / 1000)

        const userFromDB = await app.db('users')
            .where(function () {
                if (body.id) this.where({ id: body.id })
                else this.orWhere({ email: body.email })
                    .orWhere({ cpf: body.email })
            }).first()
        if (!(userFromDB))
            return res.status(400).send(await showRandomMessage() || 'Os dados informados não correspondem a nenhuma conta em nosso sistema')
        const expired = !userFromDB.password_reset_token || userFromDB.password_reset_token.split('_')[1] < now

        if (!expired) body.password_reset_token = userFromDB.password_reset_token
        else {
            body.password_reset_token = randomstring.generate(8).toUpperCase() + '_' + Number(now + TOKEN_VALIDE_MINUTES * 60)
            if (![STATUS_WAITING, STATUS_PASS_EXPIRED].includes(userFromDB.status)) body.status = STATUS_SUSPENDED_BY_TKN
            // Registra o token no BD
            await app.db(tabela).update({
                password_reset_token: body.password_reset_token,
                status: body.status
            })
                .where(function () {
                    if (body.id) this.where({ id: body.id })
                    else this.orWhere({ email: body.email })
                        .orWhere({ cpf: body.email })
                })
        }
        token = body.password_reset_token.split('_')[0]
        try {
            const url = "https://sms.comtele.com.br/api/v2/send"
            moment().locale('pt-br')
            const data = {
                "Sender": "MGCash.app.br",
                "Receivers": userFromDB.telefone,
                "Content": `Para liberar seu acesso ao mgcash.app.br, utilize o código: ${token}${userFromDB.email ? ' ou o link que também foi enviado para o email de registro' : ''}`
            }
            const config = {
                headers: {
                    'content-type': 'application/json',
                    'auth-key': '7bc83b13-030f-4700-b56a-7352590d5a8c'
                },
            }
            const response = await axios.post(url, data, config)
            // const responseData = response.data;
            if (expired) {
                const bodyRes = userFromDB
                bodyRes.password_reset_token = body.password_reset_token
                const { createEventUpd } = app.api.sisEvents
                const evento = await createEventUpd({
                    "notTo": ['created_at'],
                    "last": userFromDB,
                    "next": bodyRes,
                    "request": req,
                    "evento": {
                        "classevento": "smsToken",
                        "evento": `Geração e envio de token SMS`,
                        "tabela_bd": "user",
                    }
                })
                bodyRes.evento = evento
                app.db('users').update(bodyRes).where({ id: bodyRes.id }).then()
            }
            if (req.method === 'PATCH') res.send({ msg: `SMS enviado com sucesso para o celular ${userFromDB.telefone}` })
            else return token
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            return res.status(500).send({ msg: error })
        }
    }

    /**
     * Função utilizada para envio/reenvio do token por email
     * @param {*} req 
     * @param {*} res 
     */
    const mailyToken = async (req, res) => {
        const body = req.method && req.method === 'PATCH' ? { ...req.body } : req
        try {
            const userFromDB = await app.db(tabela)
                .where(function () {
                    if (body.id) this.where({ id: body.id })
                    else this.orWhere({ email: body.email })
                        .orWhere({ cpf: body.email })
                }).first()
            existsOrError(userFromDB, await showRandomMessage())
            const now = Math.floor(Date.now() / 1000)
            const password_reset_token = randomstring.generate(8).toUpperCase() + '_' + Number(now + TOKEN_VALIDE_MINUTES * 60)
            if (![STATUS_WAITING, STATUS_PASS_EXPIRED].includes(userFromDB.status)) body.status = STATUS_SUSPENDED_BY_TKN
            // Registra o token no BD
            await app.db(tabela).update({
                password_reset_token: password_reset_token,
                status: body.status
            }).where(function () {
                if (body.id) this.where({ id: body.id })
                else this.orWhere({ email: body.email })
                    .orWhere({ cpf: body.email })
            })

            if (userFromDB.email) {
                let expirationTimOk = userFromDB.password_reset_token ? Number(userFromDB.password_reset_token.split('_')[1]) > now : false
                await transporter.sendMail({
                    from: `"${appName}" <contato@mgcash.app.br>`, // sender address
                    to: `${userFromDB.email}`, // list of receivers
                    subject: `Bem-vindo ao ${appName}`, // Subject line
                    text: `Olá ${userFromDB.name}!\n
                Estamos confirmando sua inscrição✔
                Para liberar seu acesso, por favor acesse o link abaixo${expirationTimOk ? ` ou utilize o código ${password_reset_token.split('_')[0]} na tela de login` : ''}.\n
                ${baseFrontendUrl}/user-unlock/${userFromDB.id}?tkn=${password_reset_token}\n
                Atenciosamente,\nTime ${appName}`,
                    html: `<p><b>Olá ${userFromDB.name}!</b></p>
                <p>Estamos confirmando sua inscrição✔</p>
                <p>Para liberar seu acesso utilize uma das seguinte opções:</p>
                <ul>
                <li>Clique <a href="${baseFrontendUrl}/user-unlock/${userFromDB.id}?tkn=${password_reset_token}">aqui</a></li>
                <li>Acesse o link ${baseFrontendUrl}/user-unlock/${userFromDB.id}?tkn=${password_reset_token}</li>
                ${expirationTimOk ? `<li>Ou utilize o código <strong><code>${password_reset_token.split('_')[0]}</code></strong> na tela de login</li>` : ''}
                </ul>
                <p>Atenciosamente,</p>
                <p><b>Time ${appName}</b></p>`,
                }).then(_ => {
                })
            }
            transporter.sendMail({
                from: `"${appName}" <contato@mgcash.app.br>`, // sender address
                to: `${emailAdmin}`, // list of receivers
                subject: `Novo usuário ${appName}`, // Subject line
                text: `Estamos confirmando a inscrição de um novo usuário\n
                ${userFromDB.name}: ${userFromDB.email ? userFromDB.email : 'Não informado'}✔\n
                Atenciosamente,\n
                Time ${appName}`,
                html: `<p>Estamos confirmando a inscrição de um novo usuário</p>
                <p>${userFromDB.name}✔</p>
                <p>Atenciosamente,</p>
                <p><b>Time ${appName}</b></p>`,
            }).then(_ => {
                if (req.method === 'PATCH') res.send(`E-mail enviado com sucesso para ${userFromDB.email}! Por favor verifique sua caixa de entrada`)
                else return userFromDB.password_reset_token
            })
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            return res.status(500).send({ msg: error })
        }
    }

    /**
     * Função utilizada para envio de email de atualização de senha
     * @param {*} req 
     * @param {*} res 
     */
    const mailyPasswordReset = async (req, res) => {
        try {
            const user = await app.db(tabela)
                .where({ email: req.email }).first()
            existsOrError(user, await showRandomMessage())
            await transporter.sendMail({
                from: `"${appName}" <contato@mgcash.app.br>`, // sender address
                to: `${user.email}`, // list of receivers
                subject: `Alteração de senha ${appName}`, // Subject line
                text: `Olá ${user.name}!\n
                Para atualizar/criar sua senha, por favor acesse o link abaixo.\n
                Lembre-se de que esse link tem validade de ${TOKEN_VALIDE_MINUTES} minutos.\n
                ${baseFrontendUrl}/password-reset/${user.id}?tkn=${user.password_reset_token}\n
                Atenciosamente,\nTime ${appName}`,
                html: `<p><b>Olá ${user.name}!</b></p>
                <p>Para atualizar/criar sua senha, por favor acesse o link abaixo.</p>
                <p>Lembre-se de que esse link tem validade de ${TOKEN_VALIDE_MINUTES} minutos.</p>
                ${user.password_reset_token ? `<p>Você necessitará informar o token a seguir para liberar sua nova senha: <strong>${user.password_reset_token.split('_')[0]}</strong></p>` : ''}
                <a href="${baseFrontendUrl}/password-reset/${user.id}?tkn=${user.password_reset_token}">${baseFrontendUrl}/password-reset/${user.id}?tkn=${user.password_reset_token}</a>
                <p>Atenciosamente,</p>
                <p><b>Time ${appName}</b></p>`,
            }).then(_ => {
            })
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            res.status(400).send(error)
        }
    }

    /**
     * Função utilizada para enviar email de confirmação de novo usuário
     * @param {*} req 
     * @param {*} res 
     */
    const mailyUnlocked = async (req, res) => {
        try {
            const user = await app.db(tabela)
                .where({ email: req.email }).first()
            existsOrError(user, await showRandomMessage())
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
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            res.status(400).send(error)
        }
    }

    function isValidPassword(params) {
        const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+={[}\]|:;"'<,>.?/\\])(?!.*['"`])(?!.*[\s])(?!.*[_-]{2})[A-Za-z\d!@#$%^&*()_+={[}\]|:;"'<,>.?/\\]{8,}$/
        const teste = regex.test(params)
        if (!teste) {
            const msgs = "A senha informada não atende aos requisitos mínimos de segurança. Necessita conter ao menos oito caracteres e ter ao menos uma letra maiúscula, "
                + "uma letra minúscula, um dígito numérico, um dos seguintes caracteres especiais !@#$%^&*()_+=, não pode conter aspas simples ou duplas e "
                + "não pode conter espaços em branco"
            return msgs
        }
        return teste
    }

    const save = async (req, res) => {
        let user = { ...req.body }

        user.cpf = user.cpf.replace(/([^\d])+/gim, "")

        if (req.params.id) user.id = req.params.id

        if (!req.originalUrl.startsWith('/users')) user.gestor = false

        const sql = app.db(tabela)
        if (user.cpf)

            try {
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
                    notExistsOrError(userFromDB, 'E-mail ou CPF já registrado')
                }
            } catch (error) {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(400).send(error)
            }

        // Apenas gestores e admins podem selecionar alçadas de usuários
        if (!(user.id && (user.gestor >= 1 || user.admin >= 1))) {
            delete user.admin
            delete user.gestor
            delete user.multiCliente
            delete user.consignatario
            delete user.tipoUsuario
            delete user.averbaOnline
            delete user.cad_servidores
            delete user.financeiro
            delete user.con_contratos
            delete user.cad_orgao
        }

        if (user.email && user.email.trim.length == 0)
            delete user.email

        if (user.email && !isValidEmail(user.email))
            return res.status(400).send('E-mail inválido')

        if (user.password && user.confirmPassword)
            user.password = encryptPassword(user.password)

        delete user.idCadas
        delete user.clientName
        delete user.confirmPassword
        delete user.j_user
        delete user.j_paswd
        // Apenas admins podem selecionar outros admins, gestores ou multiCliente
        if (!(user.admin >= 1)) {
            delete user.admin
            delete user.gestor
            delete user.multiCliente
        }

        const f_folha = new Date()

        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
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

        const tabelaRemunParamsDomain = `${dbPrefix}_${user.cliente}_${user.dominio}.${tabelaRemunParams}`
        let mesAtual = f_folha.getMonth() + 1
        mesAtual = mesAtual.toString().padStart(2, "0")
        let isMonth = await app.db(tabelaRemunParamsDomain).where({ ano: user.f_ano, mes: user.f_mes }).first()
        if (!isMonth)
            isMonth = await app.db(tabelaRemunParamsDomain).where({ ano: user.f_ano, mes: mesAtual }).first()
        if (!isMonth)
            isMonth = await app.db(tabelaRemunParamsDomain).where({ ano: user.f_ano }).orderBy('mes', 'complementar').first()

        if (isMonth && isMonth.mes) isMonth.mes
        else isMonth = { mes: mesAtual }

        let isComplementary = await app.db(tabelaRemunParamsDomain).where({ ano: user.f_ano, mes: isMonth.mes, complementar: user.f_complementar }).first()
        if (!isComplementary)
            isComplementary = await app.db(tabelaRemunParamsDomain).where({ ano: user.f_ano, mes: isMonth.mes, complementar: '000' }).first()
        if (!isComplementary)
            isComplementary = await app.db(tabelaRemunParamsDomain).where({ ano: user.f_ano, mes: isMonth.mes }).orderBy('complementar').first()

        if (isComplementary && isComplementary.complementar) isComplementary.complementar
        else isComplementary = { complementar: '000' }

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
                return res.status(500).send({ msg: error })
            })
        existsOrError(rowsUpdated, 'Usuário não foi encontrado')
    }

    const limit = 20 // usado para paginação
    const get = async (req, res) => {
        let user = req.user
        const page = req.query.page || 1
        const key = req.query.key ? req.query.key : undefined
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;

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
                return res.status(500).send({ msg: error })
            })
    }

    const getById = async (req, res) => {
        let user = req.user
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').select('u.*', 'e.cliente', 'e.dominio').where({ 'u.id': user.id }).first();;
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
                return res.status(500).send({ msg: error })
            })
    }

    const getByCpf = async (req, res) => {
        let user = req.user
        try {
            cpfOrError()
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
        }
        app.db(tabela)
            .select('dominio', 'cliente', 'email', 'telefone', 'name', 'cpf')
            .where({ cpf: req.params.cpf, status: STATUS_ACTIVE })
            .first()
            .then(users => {
                return res.json(users)
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send({ msg: error })
            })
    }

    const getByToken = async (req, res) => {
        if (!req.params.token) return res.status(401).send('Unauthorized')
        const sql = app.db(tabela)
            .select('users.id', app.db.raw('REPLACE(users.name, " de", "") as name'), app.db.raw('substring(users.password_reset_token, 1, 8) as password_reset_token'))
            .where(app.db.raw(`users.password_reset_token = '${req.params.token}'`))
            .first()
        sql.then(user => {
            const username = user.name.split(" ")
            user.name = `${username[0]}${username[1] ? ` ${username[1]}` : ''}`
            return res.json(user)
        })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send({ msg: error })
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
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            res.status(400).send(error)
        }
    }

    /**
     * Função utilizadao para identificar os usuários do istema desk MGFolha
     * @param {*} req 
     * @param {*} res 
     */
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
                return res.status(500).send({ msg: error })
            })
    }

    const locateServidorOnClient = async (req, res) => {
        const clientName = req.user.cliente
        try {
            existsOrError(req.body.cpf, 'CPF não informado')
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
            return res.status(400).send(error)
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
            case 'gtt':
                getTokenTime(req, res)
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

    const getTokenTime = async (req, res) => {
        const userFromDB = await app.db(tabela)
            .select('status', 'password_reset_token')
            .where({ id: req.query.q }).first()
        let tokenCreationTime = 0
        if (userFromDB && userFromDB.password_reset_token) {
            tokenCreationTime = Number(userFromDB.password_reset_token.split('_')[1])
        }

        const now = Math.floor(Date.now() / 1000)
        let expirationTimOk = false
        if (userFromDB && userFromDB.password_reset_token) {
            if (userFromDB.password_reset_token) expirationTimOk = Number(userFromDB.password_reset_token.split('_')[1]) > now
            if (!expirationTimOk) {
                return res.status(200).send({
                    isTokenValid: false,
                    gtt: 0,
                    msg: 'O token informado ultrapassou o tempo máximo para ser utilizado'
                })
            }
            else {
                const totalTimeRelase = tokenCreationTime - now
                return res.send({ isTokenValid: true, gtt: totalTimeRelase })
            }
        } else if (userFromDB && userFromDB.status == STATUS_ACTIVE) {
            return res.status(400).send({
                isToken: false,
                msg: 'Este usuário já foi validado. Prossiga para o login'
            })
        } else
            return res.status(400).send({
                isTokenValid: false,
                gtt: 0,
                msg: 'Não há um token válido para este usuário'
            })
    }

    let unshownMessages = noUserFoundMessages.slice(); // create a copy of the messages array

    const showRandomMessage = async () => {
        if (unshownMessages.length > 0) {
            const randomIndex = Math.floor(Math.random() * unshownMessages.length);
            const message = unshownMessages.splice(randomIndex, 1)[0];
            return message
        } else {
            unshownMessages = noUserFoundMessages.slice()
            await showRandomMessage()
        }
    }

    let unshownKeyMessages = incorrectKeyPassMsgs.slice(); // create a copy of the messages array

    const showRandomKeyPassMessage = async () => {
        if (unshownKeyMessages.length > 0) {
            const randomIndex = Math.floor(Math.random() * unshownKeyMessages.length);
            const message = unshownKeyMessages.splice(randomIndex, 1)[0];
            return message
        } else {
            unshownKeyMessages = incorrectKeyPassMsgs.slice()
            await showRandomKeyPassMessage()
        }
    }

    let unshownRepeatMessages = noRepeatMessages.slice(); // create a copy of the messages array

    const showRandomNoRepeatMessage = async () => {
        if (unshownRepeatMessages.length > 0) {
            const randomIndex = Math.floor(Math.random() * unshownRepeatMessages.length);
            const message = unshownRepeatMessages.splice(randomIndex, 1)[0];
            return message
        } else {
            unshownRepeatMessages = noRepeatMessages.slice()
            await showRandomNoRepeatMessage()
        }
    }

    let unconcludeRegistrationMessages = concludeRegistrationMessages.slice(); // create a copy of the messages array

    const showUnconcludedRegistrationMessage = async () => {
        if (unconcludeRegistrationMessages.length > 0) {
            const randomIndex = Math.floor(Math.random() * unconcludeRegistrationMessages.length);
            const message = unconcludeRegistrationMessages.splice(randomIndex, 1)[0];
            return message
        } else {
            unconcludeRegistrationMessages = concludeRegistrationMessages.slice()
            await showUnconcludedRegistrationMessage()
        }
    }

    let unnewUserMessages = newUserMessages.slice(); // create a copy of the messages array

    const showNewUserMessage = async () => {
        if (unnewUserMessages.length > 0) {
            const randomIndex = Math.floor(Math.random() * unnewUserMessages.length);
            const message = unnewUserMessages.splice(randomIndex, 1)[0];
            return message
        } else {
            unnewUserMessages = newUserMessages.slice()
            await showNewUserMessage()
        }
    }

    let unwelcomeUserMessages = welcomeUserMessages.slice(); // create a copy of the messages array

    const showWelcomeUserMessage = async (uName) => {
        if (unwelcomeUserMessages.length > 0) {
            const randomIndex = Math.floor(Math.random() * unwelcomeUserMessages.length);
            const message = unwelcomeUserMessages.splice(randomIndex, 1)[0].replace('####', uName);
            return message
        } else {
            unwelcomeUserMessages = welcomeUserMessages.slice()
            await showWelcomeUserMessage()
        }
    }

    return {
        signup, requestPasswordReset, passwordReset, TOKEN_VALIDE_MINUTES, showRandomMessage, showRandomKeyPassMessage,
        showUnconcludedRegistrationMessage, save, get, getById, getByCpf, getByToken, smsToken, mailyToken, remove, getByFunction,
        unlock, getDeskUser, locateServidorOnClient, showWelcomeUserMessage
    }
}