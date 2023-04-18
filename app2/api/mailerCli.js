const { appName } = require("../config/params")

module.exports = app => {
    const { existsOrError, emailOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const { transporter } = app.api.mailer
    const mailyCliSender = async(req, res) => {
        let mailBody = req.mail
        const batch = req.batch || false
        if (!mailBody) mailBody = req.body

        try {
            existsOrError(mailBody.from, 'Remetente não informado')
            emailOrError(mailBody.from, 'Remetente inválido')
            existsOrError(mailBody.to, 'Destinatário não informado')
            emailOrError(mailBody.to, 'Destinatário inválido')
            existsOrError(mailBody.subject, 'Assunto não informado')
            existsOrError(mailBody.message, 'Mensagem não informada')
        } catch (error) {
            return res.status(400).send(error)
        }

        let user = req.user
        let userBody = undefined
        if (user) {
            const uParams = await app.db('users').where({ id: user.id }).first();
            delete uParams.password
            delete uParams.password_reset_token
            delete uParams.cpf
            userBody = JSON.stringify(uParams).toString()
        }

        const appVer = mailBody.appVer ? mailBody.appVer : appName

        let userPresentation = ``
        let userPresentationHtml = ``
        if (userBody) {
            userPresentation = `User: ${userBody.replace(/,+/g, ", ")}`
            userPresentationHtml = `<p>User: ${userBody.replace(/,+/gim, ", ")}</p>`
        }
        try {
            const mailWork = transporter.sendMail({
                from: `"${mailBody.from}" <contato@mgcash.app.br>`, // sender address
                to: `${mailBody.to}`, // list of receivers
                cc: `${mailBody.ccSender ? mailBody.from : ''}`, // list of copied receivers
                subject: `${mailBody.subject}`, // Subject line
                text: `${userPresentation}
                \n\nMensagem: ${mailBody.message}
                \n\nAppVer: ${appVer}`,
                html: `${userPresentationHtml}
                    <p>Mensagem: ${mailBody.message}<p>
                    <p>AppVer: ${appVer}<p>`,
            })
            if (batch)
                mailWork.then()
            else
                mailWork.then(res.status(200).send('Email enviado.'))
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } });
            res.status(400).send(error)
        }
    }
    return { mailyCliSender }
}