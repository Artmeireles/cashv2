const { authSecret } = require('../.env')
const jwt = require('jwt-simple')
const bcrypt = require('bcrypt-nodejs')
const { dbPrefix, jasperServerUrl, jasperServerU, jasperServerK } = require("../.env")

module.exports = app => {
    const tabela = 'users'
    const { existsOrError } = app.api.validation
    const tabelaParams = 'params'
    const signin = async (req, res) => {
        const email = req.body.email || req.body.cpf
        try{
            existsOrError(email, 'E-mail ou CPF precisam ser informados')
        } catch (error) {
            return res.status(400).send(error)
        }
        const cad_servidor = {
            data: {}
        }


        let user = await app.db(tabela)
            .select('users.*')
            .orWhere({ email: email })
            .orWhere({ name: email })
            .orWhere({ cpf: email.replace(/([^\d])+/gim, "") })
            .first()
        if (user && !req.body.password) {
            return res.status(200).send(user)
        // } else {
        //     return res.status(200).send('E-mail ou CPF não localizado!')
        }

        if (!(email && req.body.password)) {
            return res.status(400).send('Informe usuário e senha!')
        }

        if (!user) {
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
                    // const cad_servidores = await app.db({ cs: tabelaCadServidoresDomain })
                    //     .select(app.db.raw('cs.*'))
                    //     .join({ ff: `${tabelaFinSFuncionalDomain}` }, function () {
                    //         this.on(`ff.id_cad_servidores`, `=`, `cs.id`)
                    //     })
                    //     .where({ 'cs.cpf': email.replace(/([^\d])+/gim, "") })
                    //     .andWhere(app.db.raw(`ff.situacaofuncional is not null and ff.situacaofuncional > 0 and ff.mes < 13`))
                    //     .first()
                    //     .orderBy('ff.ano', 'desc')
                    //     .orderBy('ff.mes', 'desc')
                    //     .limit(1)
                    // const clientServidor = {
                    //     cliente: clientName,
                    //     dominio: domainName,
                    //     clientName: domainNames[domain].label,
                    // }
                    // if (cad_servidores) {
                    //     cad_servidor.data = { ...cad_servidores, ...clientServidor }
                    // }
                }
            }
        }
        const servidor = cad_servidor.data

        if (!(req.body.reload && req.body.reload === true)) { //typeof servidor.cpf === 'string'
            if (!(user || (servidor && servidor.cpf))) return res.status(400).send('Servidor ou usuário não encontrado!')
            if (user && user.status === 0) return res.status(201).send({ user: user, msg: 'Usuário aguardando liberação!' })
            if (user && !req.body.password) return res.status(200).send({ id: user.id, cpf: user.cpf, email: user.email, name: user.name, status: user.status })
            if (servidor && !req.body.password) {
                // Signup de servidor
                let newUser = {
                    idCadas: servidor.id,
                    id_cadas: servidor.id,
                    telefone: servidor.celular,
                    name: servidor.nome,
                    dominio: servidor.dominio,
                    cliente: servidor.cliente,
                    clientName: servidor.clientName,
                    cpf: servidor.cpf,
                    telefone: servidor.celular,
                    status: 0,
                    tipoUsuario: 0,
                    averbaOnline: 1
                }
                if (servidor.email && servidor.email.trim.length != 0)
                    newUser = { ...newUser, email: servidor.email }
                return res.status(200).send(newUser)
            }
            let isMatch = false
            if (user) {
                isMatch = bcrypt.compareSync(req.body.password, user.password)
                // Ao acessar o sistema, o exercício liberado para o usuário tipo 0 ou 1 retorna ao último exercício fechado
                if (isMatch && [0, 1].includes(user.tipoUsuario)) {
                    const { dbPrefix } = require("../.env")
                    const tabelaFinParametrosDomain = `${dbPrefix}_${user.cliente}_${user.dominio}.fin_parametros`
                    lastFinParams = await app.db({ 'fp': tabelaFinParametrosDomain }).select('ano', 'mes')
                        .where({ 'situacao': '0', 'complementar': '000' })
                        .orderBy([
                            { column: 'ano', order: 'desc' },
                            { column: 'mes', order: 'desc' }
                        ])
                        .limit(1)
                    app.db('users').update({
                        f_ano: lastFinParams[0].ano,
                        f_mes: lastFinParams[0].mes
                    }).where({ id: user.id }).then()
                    user.f_mes = lastFinParams[0].mes
                    user.f_ano = lastFinParams[0].ano
                }
            }
            if (!isMatch) return res.status(400).send('Dados inválidos!')
        }

        const now = Math.floor(Date.now() / 1000)
        const uParams = await app.db('users').where({ id: user.id }).first();
        const expirationTime = now + (60 * (uParams.admin >= 1 ? (60 * 8) : 60)) // 60 minutos de validade ou oito horas caso seja
        const payload = {
            id: user.id,
            status: user.status,
            name: user.name,
            cpf: user.cpf,
            idCadas: user.idCadas,
            email: user.email,
            telefone: user.telefone,
            admin: user.admin,
            gestor: user.gestor,
            multiCliente: user.multiCliente,
            tipoUsuario: user.tipoUsuario,
            consignatario: user.consignatario,
            averbaOnline: user.averbaOnline,
            cliente: user.cliente,
            dominio: user.dominio,
            j_user: jasperServerU,
            j_paswd: jasperServerK,
            f_ano: user.f_ano,
            f_mes: user.f_mes,
            f_complementar: user.f_complementar,
            tkn_api: user.tkn_api,
            iat: now,
            exp: expirationTime
        }

        res.json({
            ...payload,
            token: jwt.encode(payload, authSecret)
        })

        app.api.logger.logInfo({ log: { line: `Login bem sucedido: ${user.name}`, sConsole: true } })

        // registrar o evento na tabela de eventos
        const { createEvent } = app.api.sisEvents
        createEvent({
            "request": req,
            "evento": {
                "ip": req.ip,
                "id_user": user.id,
                "evento": `Login no sistema`,
                "classevento": `signin`,
                "id_registro": null
            }
        })
    }

    const validateToken = async (req, res) => {
        const userData = req.body || null
        try {
            if (userData) {
                const token = jwt.decode(userData.token, authSecret)
                if (new Date(token.exp * 1000) > new Date()) {
                    return res.send(true)
                }
                app.api.logger.logInfo({ log: { line: `Token validado com sucesso`, sConsole: true } })
            }
        } catch (e) {
            // problema com o token
        }

        res.send(false)
    }

    return { signin, validateToken }
}