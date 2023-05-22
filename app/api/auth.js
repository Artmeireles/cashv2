const { authSecret } = require('../.env')
const jwt = require('jwt-simple')
const { STATUS_PASS_EXPIRED, STATUS_SUSPENDED_BY_TKN, MINIMUM_KEYS_BEFORE_CHANGE, STATUS_INACTIVE, STATUS_WAITING } = require("../config/userStatus")

module.exports = app => {
    const tabela = 'users'
    const tabelaKeys = 'users_keys'
    const { existsOrError } = app.api.validation
    const { diffInDays, comparePassword } = app.api.facilities
    const { showRandomMessage, showRandomKeyPassMessage, showUnconcludedRegistrationMessage } = app.api.user

    /**
     * Operações de SignIn
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    const signin = async (req, res) => {
        const email = req.body.email || undefined
        let password = req.body.password || undefined
        try {
            existsOrError(email, 'E-mail, nome ou CPF precisam ser informados')
        } catch (error) {
            return res.status(400).send(error)
        }

        let user = await app.db({ 'u': tabela })
            .select('u.name', 'u.cpf', 'u.telefone', 'u.email', 'u.id', 'u.time_to_pas_expires', 'u.status')
            .orWhere({ 'u.email': email })
            .orWhere({ 'u.name': email })
            .orWhere({ 'u.cpf': email.replace(/([^\d])+/gim, "") })
            .first()
        try {
            existsOrError(user, await showRandomMessage())
        } catch (error) {
            return res.status(400).send(error)
        }

        /**
         * Prazo de expiração da senha
         */
        const days = user.time_to_pas_expires;

        /**
         * Verificar se o usuário foi desativado
         */
        if (user && user.status == STATUS_INACTIVE) {
            return res.status(400).send({
                isStatusActive: false,
                'msg': `Seu acesso ao sistema foi suspenso pelo seu administrador. Por favor, entre em contato com o suporte`
            })
        }
        /**
         * Verificar se o usuário ainda não ativou seu perfil
         */
        if (user && user.status == STATUS_WAITING) {
            return res.status(400).send({
                isStatusActive: false,
                'msg': await showUnconcludedRegistrationMessage() || "Confira o token recebido por SMS para ativar seu perfil de usuário"
            })
        }

        /**
         * Verificar se a senha expirou
         */
        if (user && user.status == STATUS_PASS_EXPIRED) {
            return res.status(400).send({
                isStatusActive: false,
                'msg': `Sua senha expirou. As senhas devem ser alteradas a cada ${days} dias. Por favor altere agora sua senha. Ela não pode ser igual às últimas ${MINIMUM_KEYS_BEFORE_CHANGE} senhas utilizadas`
            })
        }

        /**
         * Verificar se foi solicitada a troca de senha
         */
        if (user && user.status == STATUS_SUSPENDED_BY_TKN) {
            return res.status(400).send({
                isStatusActive: false,
                'msg': `Foi solicitada a troca de senha. Para sua segurança o seu acesso foi temporariamente suspenso. Por favor, verifique seu email ou SMS no ceular. Mesmo que não tenha solicitado isso, para sua segurança por favor altere agora sua senha. Ela não pode ser igual às últimas ${MINIMUM_KEYS_BEFORE_CHANGE} senhas utilizadas`
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
         * Se não foi localizado um usuário com o dados informados, retorna a mensagem
         */
        if (!user) {
            return res.status(400).send(await showRandomMessage() || 'Não conseguimos localizar um usuário com os dados informados')
        }

        /**
         * Por fim, se o usuário foi encontrado e uma senha foi informada então segue para o teste e posterior login ou mensagem de erro de senha
         */

        let isMatch = false
        if (user && password) {
            let userKeyPass = await app.db({ 'ut': tabelaKeys })
                // .select('ut.password', 'ut.id', 'ut.created_at')
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
                        msg = `Se passaram ${passTime} dias desde que criou sua senha. Ela deve ser alterada a cada ${days} dias. Por favor altere agora sua senha. Ela não pode ser igual às últimas ${MINIMUM_KEYS_BEFORE_CHANGE} senhas utilizadas`
                        app.api.logger.logInfo({ log: { line: `${user.name}: ${msg}`, sConsole: true } })
                        await app.db(tabela)
                            .update({ status: STATUS_PASS_EXPIRED })
                            .where({ id: user.id })
                        await app.db(tabelaKeys)
                            .update({ status: STATUS_PASS_EXPIRED })
                            .where({ id_users: user.id })
                        return res.status(400).send({
                            isStatusActive: false,
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
                    telefone: user.telefone,
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

                res.json({
                    ...payload,
                    token: jwt.encode(payload, authSecret)
                })
            }
            /**
             * Se a senha digitada for errada
             */
            else {
                return res.status(400).send(await showRandomKeyPassMessage() || 'A senha não está correta. Por favor tente novamente ou se não lembra, tente resetá-la')
            }
        }
    }

    const validateToken = async (req, res) => {
        const userData = req.body || null
        try {
            if (userData) {
                const token = jwt.decode(userData.token, authSecret)
                if (new Date(token.exp * 1000) > new Date()) {
                    await
                        app.api.logger.logInfo({ log: { line: `Token validado com sucesso`, sConsole: true } })
                    return res.send(true)
                }
            }
        } catch (e) {
            // problema com o token
        }

        res.send(false)
    }

    return { signin, validateToken }
}