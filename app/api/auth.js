const { authSecret } = require('../.env')
const jwt = require('jwt-simple')
const { STATUS_ACTIVE, STATUS_PASS_EXPIRED, STATUS_SUSPENDED_BY_TKN, MINIMUM_KEYS_BEFORE_CHANGE, STATUS_INACTIVE, STATUS_WAITING } = require("../config/userStatus")

module.exports = app => {
    const tabela = 'users'
    const tabelaKeys = 'users_keys'
    const { existsOrError } = app.api.validation
    const { diffInDays, comparePassword } = app.api.facilities
    const { showRandomMessage, showRandomKeyPassMessage, showUnconcludedRegistrationMessage, showWelcomeUserMessage } = app.api.user

    /**
     * Operações de SignIn
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    const signin = async (req, res) => {
        const email = req.body.email || req.body.cpf || undefined
        let password = req.body.password || undefined
        const ip = req.body.ip

        try {
            existsOrError(email, 'E-mail, nome ou CPF precisam ser informados')
        } catch (error) {
            return res.status(400).send(error)
        }

        let user = await app.db({ 'u': tabela })
            .select('u.id', 'u.name', 'u.cpf', 'u.telefone', 'u.email', 'u.id', 'u.time_to_pas_expires', 'u.status', 'u.cliente', 'u.dominio')
            .orWhere({ 'u.email': email })
            .orWhere({ 'u.name': email })
            .orWhere({ 'u.cpf': email.replace(/([^\d])+/gim, "") })
            .first()
        /**
         * Se não foi localizado um usuário com o dados informados, retorna a mensagem
         */
        if (!user) {
            return res.status(200).send({ msg: await showRandomMessage() || 'Não conseguimos localizar um usuário com os dados informados' })
        }

        /**
         * Prazo de expiração da senha
         */
        const days = user.time_to_pas_expires;

        /**
         * Verificar se o usuário foi desativado
         */
        if (user && user.status == STATUS_INACTIVE) {
            return res.status(200).send({
                'status': STATUS_INACTIVE,
                'msg': `Seu acesso ao sistema foi suspenso pelo seu administrador. Por favor, entre em contato com o suporte`
            })
        }
        /**
         * Verificar se o usuário ainda não ativou seu perfil
         */
        if (user && user.status == STATUS_WAITING) {
            return res.status(200).send({
                id: user.id,
                'status': STATUS_WAITING,
                'msg': await showUnconcludedRegistrationMessage() || "Confira o token recebido por SMS para ativar seu perfil de usuário"
            })
        }

        /**
         * Verificar se a senha expirou
         */
        if (user && user.status == STATUS_PASS_EXPIRED) {
            return res.status(200).send({
                'status': STATUS_PASS_EXPIRED,
                'msg': `Sua senha expirou. As senhas devem ser alteradas a cada ${days} dias. Por favor altere agora sua senha. Ela não pode ser igual às últimas ${MINIMUM_KEYS_BEFORE_CHANGE} senhas utilizadas`
            })
        }

        /**
         * Verificar se foi solicitada a troca de senha
        */
        if (user && user.status == STATUS_SUSPENDED_BY_TKN) {
            return res.status(200).send({
                'status': STATUS_SUSPENDED_BY_TKN,
                'id': user.id,
                'msg': `Foi solicitado um token de senha. Por favor, verifique seu email ou SMS no celular. 
                Para sua segurança sugerimos que altere sua senha de tempos em tempos e nunca a forneça a ninguém. 
                A nova senha não pode ser igual às últimas ${MINIMUM_KEYS_BEFORE_CHANGE} senhas utilizadas`
            })
        }

        /**
         * Se o usuário está no primeiro estágio da operação ele apenas coloca o e-mail, cpf ou nome de usuário
         * e o sistema retorna o email confirmando que pode seguir para a autenticação por senha
         */
        if (user && !password) {
            return res.status(200).send(user)
        }

        /**
         * Por fim, se o usuário foi encontrado e uma senha foi informada então segue para o teste e posterior login ou mensagem de erro de senha
         */

        let isMatch = false
        if (user && password) {
            let userKeyPass = await app.db({ 'ut': tabelaKeys })
                .where({ id_users: user.id })
                .orderBy('ut.created_at', 'desc')
                .first()
            isMatch = comparePassword(password, userKeyPass.password)

            if (isMatch) {
                const dateStr = userKeyPass.created_at;
                /**
                 * Verifica se o usuário tem controle de tempo de expiração de senha
                 */
                if (days > 0) {
                    /**
                     * Verifica o tempo da senha
                    */
                    if (diffInDays(dateStr, days)) {
                        const passTime = diffInDays(dateStr) - 1
                        const msg = `Se passaram ${passTime} dias desde que criou sua senha. Ela deve ser alterada a cada ${days} dias. Por favor altere agora sua senha. Ela não pode ser igual às últimas ${MINIMUM_KEYS_BEFORE_CHANGE} senhas utilizadas`
                        app.api.logger.logInfo({ log: { line: `${user.name}: ${msg}`, sConsole: true } })
                        await app.db(tabela)
                            .update({ status: STATUS_PASS_EXPIRED })
                            .where({ id: user.id })
                        await app.db(tabelaKeys)
                            .update({ status: STATUS_PASS_EXPIRED })
                            .where({ id_users: user.id })
                        return res.status(200).send({
                            'status': STATUS_PASS_EXPIRED,
                            'msg': msg
                        })
                    }
                }
                const now = Math.floor(Date.now() / 1000)
                const uParams = await app.db('users').where({ id: user.id }).first();
                const expirationTime = now + (60 * (uParams.admin >= 1 ? (60 * 8) : 60)) // 60 minutos de validade ou oito horas caso seja adm
                const payload = {
                    id: user.id,
                    status: user.status,
                    cpf: user.cpf,
                    name: user.name,
                    telefone: user.telefone,
                    cliente: user.cliente,
                    dominio: user.dominio,
                    ip: ip,
                    ipSignin: ip,
                    iat: now,
                    exp: expirationTime
                }

                app.api.logger.logInfo({ log: { line: `Login bem sucedido: ${user.name}`, sConsole: true } })

                // registrar o evento na tabela de eventos
                const { createEvent } = app.api.sisEvents
                createEvent({
                    "request": req,
                    "evento": {
                        "id_user": user.id,
                        "evento": `Login no sistema`,
                        "classevento": `signin`,
                        "id_registro": null
                    }
                })
                const msg = await showWelcomeUserMessage(user.name) || `Seja bem-vindo(a), ${user.name}! Estamos felizes em recebê-lo(a) em nossa plataforma`
                res.json({
                    msg,
                    isMatch,
                    ...payload,
                    token: jwt.encode(payload, authSecret)
                })
            }
            /**
             * Se a senha digitada for errada
             */
            else {
                const body = {
                    ...user,
                    isMatch,
                    msg: await showRandomKeyPassMessage() || 'A senha não está correta. Por favor tente novamente ou se não lembra, tente resetá-la'
                }
                return res.send(body)
            }
        }
    }

    const validateToken = async (req, res) => {
        const userData = req.body || null
        try {
            if (userData) {
                const token = jwt.decode(userData.token, authSecret)
                if (new Date(token.exp * 1000) > new Date() && userData.ipSignin == userData.ip) {
                    return res.send(true)
                }
            }
        } catch (error) { }

        res.send(false)
    }

    return { signin, validateToken }
}