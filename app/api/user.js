
const randomstring = require("randomstring")
const { baseFrontendUrl, emailAdmin, appName } = require("../config/params")
const { dbPrefix, jasperServerU, jasperServerK } = require("../.env")
const { STATUS_INACTIVE, STATUS_SUSPENDED, STATUS_SUSPENDED_BY_TKN, STATUS_ACTIVE, STATUS_DELETE, MINIMUM_KEYS_BEFORE_CHANGE, TOKEN_VALIDE_MINUTES } = require("../config/userStatus")
const axios = require('axios')
const moment = require('moment')

module.exports = app => {
    const { existsOrError, notExistsOrError, equalsOrError, isValidEmail, isEmailOrError, isCelPhoneOrError, cpfOrError, isValue, isBooleanOrError, booleanOrError } = app.api.validation
    const { titleCase, encryptPassword, comparePassword } = app.api.facilities
    const { transporter } = app.api.mailer
    const tabela = `users`
    const tabelaKeys = 'users_keys'
    const tabelaParams = 'params'
    const tabelaFinParametros = 'fin_parametros'

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
        console.log('0',body);
        let registered = false;
        try {
            existsOrError(body.cpf, 'CPF não informado')
            body.cpf = body.cpf.replace(/([^\d])+/gim, "")
            cpfOrError(body.cpf, 'CPF inválido')
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            return res.status(400).send(error)
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

        console.log('1',body);
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

        console.log('2',body);
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
                return res.status(400).send(error)
            }
        }
        /**
         * #2 - Se não tem perfil e já informou os dados necessários para a criação do perfil:
        */
        if ((body.isNewUser || (body.client && body.domain)) && body.celular && body.cpf) {
            delete body.isNewUser
            console.log('3',body);
            /**
             * Se body.id NÃO for informado então não é servidor. Nesse caso body.email torna-se obrigatório
             */
            if (!(!!(body.id || body.email))) {
                try {
                    existsOrError(body.email, 'E-mail obrigatório não informado')
                } catch (error) {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    return res.status(400).send(error)
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
                        return res.status(400).send(error)
                    }

                try {
                    existsOrError(body.nome, 'Nome não informado')
                    existsOrError(body.password, 'Senha não informada')
                    existsOrError(body.confirmPassword, 'Confirmação de Senha inválida')
                    equalsOrError(body.password, body.confirmPassword, 'Senhas não conferem')
                } catch (error) {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    return res.status(400).send(error)
                }


                // Dados necessários agrupados
                // Criação de um novo registro
                const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()

                // Variáveis da criação de um novo registro
                body.evento = nextEventID.count + 1
                const now = Math.floor(Date.now() / 1000)
                body.password_reset_token = randomstring.generate(27) + '_' + Number(now + TOKEN_VALIDE_MINUTES * 60)
                body.sms_token = randomstring.generate(8) + '_' + Number(now + TOKEN_VALIDE_MINUTES * 60)
                body.status = STATUS_WAITING
                body.created_at = new Date()
                body.f_ano = body.created_at.getFullYear()
                body.f_mes = body.created_at.getMonth().toString().padStart(2, "0")
                body.f_complementar = '000'
                body.id_cadas = body.id
                body.name = body.nome
                body.telefone = body.celular
                body.cliente = body.client
                body.dominio = body.domain

                try {
                    if (typeof isValidPassword(body.password) === 'string') throw isValidPassword(body.password)
                } catch (error) {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    return res.status(200).send({
                        isValidPassword: false,
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
                                return res.status(500).send(error)
                            })

                        app.api.logger.logInfo({ log: { line: `Novo de perfil de usuário! Usuário: ${body.name}`, sConsole: true } })
                        return res.json(body)
                    })
                    .catch(error => {
                        app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                        return res.status(500).send(error)
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
                        return res.json({ msg: `O servidor ${titleCase(cad_servidor.data.nome)} foi localizado nos registro do município de ${clientServidor.clientName}, mas não tem um telefone celular válido registrado. Antes de prosseguir com o registro será necessário procurar o RH/DP de sua fonte pagadora para regularizar seu registro` })
                } else {
                    /**
                     * #3 - Se não tem perfil e não é localizado nos schemas dos clientes todos os dados tornam-se obrigatórios exceto o id
                    */
                    return res.json({ isNewUser: true, msg: await showNewUserMessage() || "Não encontramos as informações que você forneceu. Por favor, complete os campos abaixo com os dados necessários para criar seu perfil de usuário" })
                }
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
            return res.status(400).send(error)
        }
        const thisUser = await app.db(tabela).where({ cpf: user.cpf.replace(/([^\d])+/gim, "") }).first()
        try {
            existsOrError(thisUser, await showRandomMessage())
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            return res.status(400).send(error)
        }

        const now = Math.floor(Date.now() / 1000)
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
        const password_reset_token = randomstring.generate(27) + '_' + Number(now + TOKEN_VALIDE_MINUTES * 60)
        const sms_token = randomstring.generate(8) + '_' + Number(now + TOKEN_VALIDE_MINUTES * 60)
        // try {
        app.db(tabela)
            .update({
                status: STATUS_SUSPENDED_BY_TKN,
                evento: evento,
                updated_at: new Date(),
                password_reset_token: password_reset_token,
                sms_token: sms_token
            })
            .where({ cpf: thisUser.cpf })
            .then(_ => {
                req.body = thisUser
                smsToken(req)
                mailyPasswordReset(thisUser)
                return res.status(200).send({
                    msg: `Verifique seu email${thisUser.email ? (' (' + thisUser.email + ')') : ''} ou SMS no celular (${thisUser.telefone}) para concluir a operação! Sua conta foi temporariamente desativada até que a nova senha seja criada`,
                    token: password_reset_token
                })
            })
            .catch(msg => {
                res.status(400).send(error)
            })
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
            .select('id', 'status', 'email', 'sms_token', 'password_reset_token', 'name')
            .where({ id: req.params.id })
            .where(function () {
                this.where({ password_reset_token: token })
                    .orWhere(app.db.raw(`sms_token like "${token}%"`))
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
            if (!booleanOrError(isValidPassword(passTest))) throw isValidPassword(passTest)
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
                password_reset_token: null,
                sms_token: null
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
                return res.status(200).send('Senha criada/alterada com sucesso!')
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
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
            .select('id', 'status', 'email', 'sms_token', 'password_reset_token', 'name')
            .where({ id: req.params.id })
            .where(function () {
                this.where({ password_reset_token: token })
                    .orWhere(app.db.raw(`sms_token like "${token}%"`))
            }).first()

        if (!(userFromDB))
            return res.status(400).send(await showRandomMessage() || 'Token informado é inválido ou não correspondem a nenhuma conta em nosso sistema')

        const now = Math.floor(Date.now() / 1000)
        let expirationTimOk = false
        if (userFromDB.sms_token) expirationTimOk = Number(userFromDB.sms_token.split('_')[1]) > now
        if (userFromDB.password_reset_token) expirationTimOk = Number(userFromDB.password_reset_token.split('_')[1]) > now

        if (!expirationTimOk)
            return res.status(200).send('O token informado é inválido ou já foi utilizado')

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
        user.sms_token = null
        user.tipoUsuario = user.id_cadas ? 0 : 1
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
            return res.status(400).send(await showRandomMessage() || 'Dados informados não correspondem a nenhuma conta em nosso sistema')
        const expired = !userFromDB.sms_token || userFromDB.sms_token.split('_')[1] < now

        if (!expired) body.sms_token = userFromDB.sms_token
        else {
            body.sms_token = randomstring.generate(8) + '_' + Number(now + TOKEN_VALIDE_MINUTES * 60)
            // Registra o token no BD
            await app.db(tabela).update({
                sms_token: body.sms_token,
                status: STATUS_SUSPENDED_BY_TKN
            })
                .where(function () {
                    if (body.id) this.where({ id: body.id })
                    else this.orWhere({ email: body.email })
                        .orWhere({ cpf: body.email })
                })
        }
        token = body.sms_token.split('_')[0]
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
                bodyRes.sms_token = body.sms_token
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
            if (req.method === 'PATCH') res.send(`SMS enviado com sucesso para o celular ${userFromDB.telefone}`)
            else return token
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
            return res.status(500).send(error)
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
            const password_reset_token = randomstring.generate(27) + '_' + Number(now + TOKEN_VALIDE_MINUTES * 60)
            // Registra o token no BD
            await app.db(tabela).update({
                password_reset_token: password_reset_token,
                status: STATUS_SUSPENDED_BY_TKN
            }).where(function () {
                if (body.id) this.where({ id: body.id })
                else this.orWhere({ email: body.email })
                    .orWhere({ cpf: body.email })
            })

            if (userFromDB.email) {
                let expirationTimOk = userFromDB.sms_token ? Number(userFromDB.sms_token.split('_')[1]) > now : false
                await transporter.sendMail({
                    from: `"${appName}" <contato@mgcash.app.br>`, // sender address
                    to: `${userFromDB.email}`, // list of receivers
                    subject: `Bem-vindo ao ${appName}`, // Subject line
                    text: `Olá ${userFromDB.name}!\n
                Estamos confirmando sua inscrição✔
                Para liberar seu acesso, por favor acesse o link abaixo${expirationTimOk ? ` ou utilize o código ${userFromDB.sms_token.split('_')[0]} na tela de login` : ''}.\n
                ${baseFrontendUrl}/user-unlock/${userFromDB.id}?tkn=${password_reset_token}\n
                Atenciosamente,\nTime ${appName}`,
                    html: `<p><b>Olá ${userFromDB.name}!</b></p>
                <p>Estamos confirmando sua inscrição✔</p>
                <p>Para liberar seu acesso utilize uma das seguinte opções:</p>
                <ul>
                <li>Clique <a href="${baseFrontendUrl}/user-unlock/${userFromDB.id}?tkn=${password_reset_token}">aqui</a></li>
                <li>Acesse o link ${baseFrontendUrl}/user-unlock/${userFromDB.id}?tkn=${password_reset_token}</li>
                ${expirationTimOk ? `<li>Ou utilize o código <strong><code>${userFromDB.sms_token.split('_')[0]}</code></strong> na tela de login</li>` : ''}
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
            return res.status(500).send(error)
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
                ${user.sms_token ? `<p>Você necessitará informar o token a seguir para liberar sua nova senha: <strong>${user.sms_token.split('_')[0]}</strong></p>` : ''}
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
                    notExistsOrError(userFromDB, 'E-mail ou CPF já registrado')
                }
            } catch (error) {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(400).send(error)
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

        const f_folha = new Date()

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
                return res.status(500).send(error)
            })
    }

    const getByToken = async (req, res) => {
        if (!req.params.token) return res.status(401).send('Unauthorized')
        const sql = app.db(tabela)
            .select('users.id', app.db.raw('REPLACE(users.name, " de", "") as name'), app.db.raw('substring(users.sms_token, 1, 8) as sms_token'))
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
                return res.status(500).send(error)
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

    const noUserFoundMessages = [
        "Desculpe, não encontramos nenhum registro com essas informações",
        "Não conseguimos localizar as informações que você forneceu",
        "As informações que você inseriu não foram encontradas em nosso sistema",
        "Não foi possível encontrar um usuário com as informações fornecidas",
        "Lamentamos informar que as informações que você forneceu não foram encontradas",
        "Infelizmente, não conseguimos encontrar um usuário com as informações que você inseriu",
        "Desculpe, não conseguimos localizar sua conta com essas informações",
        "As informações que você forneceu não correspondem a nenhuma conta em nosso sistema",
        "Não foi possível encontrar um usuário correspondente às informações fornecidas",
        "Lamentamos, mas não conseguimos localizar nenhuma conta com as informações que você forneceu",
        "Infelizmente, não conseguimos encontrar uma conta com as informações que você inseriu",
        "Desculpe, não conseguimos encontrar nenhum registro correspondente às informações fornecidas",
        "As informações que você inseriu não correspondem a nenhuma conta existente em nosso sistema",
        "Não foi possível encontrar um usuário ou conta com as informações fornecidas",
        "Lamentamos informar que não conseguimos localizar nenhuma conta com as informações que você inseriu",
        "Infelizmente, não encontramos nenhuma conta com as informações que você forneceu",
        "Desculpe, não conseguimos encontrar nenhum usuário ou conta correspondente às informações fornecidas",
        "As informações que você forneceu não correspondem a nenhum usuário ou conta em nosso sistema",
        "Não foi possível encontrar nenhum usuário ou conta com as informações inseridas",
        "Lamentamos informar que não conseguimos localizar nenhum usuário ou conta com as informações que você forneceu"
    ]

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

    const incorrectKeyPassMsgs = [
        "Desculpe, parece que a senha que você digitou não está correta. Por favor, tente novamente",
        "Sinto muito, mas parece que a senha que você digitou está incorreta. Por favor, verifique e tente novamente",
        "Ops, a senha que você digitou não corresponde à nossa base de dados. Por favor, verifique e tente novamente",
        "Parece que a senha que você digitou não está funcionando. Por favor, tente digitá-la novamente",
        "Infelizmente, não pudemos validar a senha que você digitou. Por favor, tente novamente",
        "Parece que há um problema com a senha que você digitou. Por favor, verifique e tente novamente",
        "Desculpe, não estamos conseguindo verificar a senha que você digitou. Por favor, tente novamente ou se não lembra, tente criar uma nova",
        "A senha que você digitou não está correta. Por favor, verifique e tente novamente",
        "Não foi possível validar a senha que você digitou. Por favor, verifique e tente novamente",
        "Parece que a senha que você digitou expirou. Por favor, defina uma nova senha e tente novamente",
        "A senha que você digitou parece ter expirado. Por favor, redefina sua senha e tente novamente ou se não lembra, tente criar uma nova",
        "Sinto muito, mas a senha que você digitou não corresponde ao que temos registrado. Por favor, verifique e tente novamente",
        "Não estamos conseguindo validar a senha que você digitou. Por favor, verifique e tente novamente",
        "A senha que você digitou parece estar incorreta. Por favor, verifique e tente novamente ou se não lembra, sabia que pode criar uma nova?",
        "Desculpe, mas parece que a senha que você digitou não está funcionando. Por favor, tente digitá-la novamente",
        "A senha que você digitou não corresponde ao que temos registrado. Por favor, verifique e tente novamente",
        "Não foi possível verificar a senha que você digitou. Por favor, verifique e tente novamente ou você pode criar uma nova",
        "A senha que você digitou não parece estar correta. Por favor, verifique e tente novamente",
        "Desculpe, mas não estamos conseguindo validar a senha que você digitou. Por favor, verifique e tente novamente",
        "A senha que você digitou não está correta. Por favor, verifique e tente novamente ou tente criar uma nova"
    ]

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

    const noRepeatMessages = [
        "Por segurança, use uma senha diferente das anteriores",
        "Escolha uma senha nova que não tenha usado antes",
        "Sua nova senha precisa ser única, não pode se repetir",
        "Evite repetir senhas antigas. Escolha algo novo",
        "Por favor, selecione uma senha diferente das últimas",
        "Lembre-se de não usar senhas anteriores novamente",
        "A nova senha não pode ser igual às antigas",
        "Para segurança, crie uma senha nova e exclusiva",
        "Sua senha nova não deve ser igual às anteriores",
        "Escolha uma senha nova, que nunca tenha usado antes",
        "Por motivos de segurança, não repita senhas antigas",
        "Por favor, evite usar senhas anteriores novamente",
        "Use uma senha nova que não tenha usado antes",
        "A nova senha precisa ser diferente das anteriores",
        "Evite repetir senhas antigas. Escolha algo novo e exclusivo",
        "Crie uma senha nova, que não tenha usado anteriormente",
        "Não use senhas antigas novamente. Escolha algo novo",
        "Para proteção, evite repetir senhas antigas",
        "Por segurança, escolha uma senha nova e diferente",
        "Sua nova senha precisa ser única, não pode ser igual às anteriores"
    ]

    let unshownRepeatMessages = noRepeatMessages.slice(); // create a copy of the messages array

    const showRandomNoRepeatMessage = async () => {
        if (unshownRepeatMessages.length > 0) {
            const randomIndex = Math.floor(Math.random() * unshownRepeatMessages.length);
            const message = unshownRepeatMessages.splice(randomIndex, 1)[0];
            return message
        } else {
            unshownRepeatMessages = noRepeatMessages.slice()
            await showRandomMessage()
        }
    }

    const concludeRegistrationMessages = [
        "Seu perfil de usuário ainda não foi ativado. Por favor, verifique o token enviado via SMS",
        "Precisamos que você ative seu perfil de usuário. Confira o token que enviamos por SMS",
        "Seu perfil de usuário aguarda ativação. Verifique o token recebido via SMS",
        "Lembre-se de ativar seu perfil de usuário utilizando o token enviado por SMS",
        "O token de ativação enviado via SMS é necessário para ativar seu perfil de usuário",
        "Verifique o token recebido por SMS para ativar seu perfil de usuário",
        "Seu perfil de usuário está esperando pela ativação. Utilize o token recebido via SMS",
        "Para ativar seu perfil de usuário, utilize o token enviado por SMS",
        "Não se esqueça de inserir o token recebido via SMS para ativar seu perfil de usuário",
        "O token enviado por SMS é essencial para a ativação do seu perfil de usuário",
        "Por favor, utilize o token que enviamos via SMS para ativar seu perfil de usuário",
        "Seu perfil de usuário precisa ser ativado com o token enviado por SMS",
        "Verifique o token enviado via SMS para ativar seu perfil de usuário",
        "Não deixe de utilizar o token recebido por SMS para ativar seu perfil de usuário",
        "Ative seu perfil de usuário com o token que enviamos via SMS",
        "Utilize o token recebido por SMS para concluir a ativação do seu perfil de usuário",
        "Verifique sua caixa de mensagens e utilize o token recebido via SMS para ativar seu perfil de usuário",
        "Lembre-se de inserir o token que enviamos por SMS para ativar seu perfil de usuário",
        "Seu perfil de usuário ainda não foi ativado. Utilize o token enviado via SMS para concluir o processo",
        "O token de ativação enviado por SMS é necessário para ativar seu perfil de usuário"

    ]

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

    const newUserMessages = [
        "Desculpe, não conseguimos localizar as informações fornecidas. Por favor, preencha os campos a seguir para criar seu perfil de usuário",
        "As informações fornecidas não foram encontradas. Por favor, informe os dados necessários nos campos abaixo para criar seu perfil de usuário",
        "Não encontramos as informações que você forneceu. Por favor, preencha os campos a seguir com os dados necessários para criar seu perfil de usuário",
        "Desculpe, mas não localizamos os dados informados. Por favor, complete os campos abaixo com as informações necessárias para criar seu perfil de usuário",
        "Não foi possível encontrar os dados fornecidos. Por favor, informe os detalhes nos campos a seguir para criar seu perfil de usuário",
        "Lamentamos, mas não conseguimos localizar as informações fornecidas. Por favor, forneça os dados necessários nos campos abaixo para criar seu perfil de usuário",
        "As informações que você inseriu não foram encontradas. Por favor, preencha os campos abaixo com os dados necessários para criar seu perfil de usuário",
        "Desculpe, não conseguimos localizar os dados informados. Por favor, informe os detalhes necessários nos campos a seguir para criar seu perfil de usuário",
        "Não encontramos as informações que você forneceu. Por favor, complete os campos abaixo com os dados necessários para criar seu perfil de usuário",
        "Desculpe, mas não localizamos os dados fornecidos. Por favor, preencha os campos abaixo com as informações necessárias para criar seu perfil de usuário",
        "Não foi possível encontrar os dados fornecidos. Por favor, informe os detalhes nos campos a seguir para criar seu perfil de usuário",
        "Lamentamos, mas não conseguimos localizar as informações fornecidas. Por favor, forneça os dados necessários nos campos abaixo para criar seu perfil de usuário",
        "As informações que você inseriu não foram encontradas. Por favor, preencha os campos abaixo com os dados necessários para criar seu perfil de usuário",
        "Desculpe, não conseguimos localizar os dados informados. Por favor, informe os detalhes necessários nos campos a seguir para criar seu perfil de usuário",
        "Não encontramos as informações que você forneceu. Por favor, complete os campos abaixo com os dados necessários para criar seu perfil de usuário",
        "Desculpe, mas não localizamos os dados fornecidos. Por favor, preencha os campos abaixo com as informações necessárias para criar seu perfil de usuário",
        "Não foi possível encontrar os dados fornecidos. Por favor, informe os detalhes nos campos a seguir para criar seu perfil de usuário",
        "Lamentamos, mas não conseguimos localizar as informações fornecidas. Por favor, forneça os dados necessários nos campos abaixo para criar seu perfil de usuário",
        "As informações que você inseriu não foram encontradas. Por favor, preencha os campos abaixo com os dados necessários para criar seu perfil de usuário",
        "Desculpe, não conseguimos localizar os dados informados. Por favor, informe os detalhes necessários nos campos a seguir para criar seu perfil de usuário"

    ]

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

    return {
        signup, requestPasswordReset, passwordReset, TOKEN_VALIDE_MINUTES, showRandomMessage, showRandomKeyPassMessage,
        showUnconcludedRegistrationMessage, save, get, getById, getByCpf, getByToken, smsToken, mailyToken, remove, getByFunction,
        unlock, getDeskUser, locateServidorOnClient,
    }
}