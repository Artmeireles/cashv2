const moment = require('moment')
const randomstring = require("randomstring")
const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, booleanOrError, notExistsOrError, equalsOrError, emailOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const { mailyCliSender } = app.api.mailerCli
    const tabela = 'fin_sfuncional'
    const tabelaCadServidores = 'cad_servidores'
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99

    const save = async(req, res) => {
        let user = req.user
        const uParams = await app.db('users').where({ id: user.id }).first();
        const body = {...req.body }
        if (req.params.id) body.id = req.params.id
        try {
            // Alçada para edição
            if (body.id)
                isMatchOrError(uParams && uParams.cad_servidores >= 3, `${noAccessMsg} "Edição de registro funcional"`)
                // Alçada para inclusão
            else isMatchOrError(uParams && uParams.cad_servidores >= 2, `${noAccessMsg} "Inclusão de registro funcional"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${user.cliente}_${user.dominio}.${tabela}`

        try {
            existsOrError(body.id_cad_servidores, 'Servidor não informado')
            existsOrError(body.ano, 'Ano da folha não informado')
            existsOrError(body.mes, 'Mês da folha não informado')
            existsOrError(body.complementar, 'Complementar da folha não informado')
            existsOrError(body.situacao, 'Situacao da folha não informada')
            existsOrError(body.situacaofuncional, 'Situacao funcional não informada')
            existsOrError(body.id_cad_cargos, 'Cargo não informado')
            existsOrError(body.id_cad_centros, 'Centro de custo não informado')
            existsOrError(body.id_cad_departamentos, 'Departamento não informado')
            existsOrError(body.id_pccs, 'Pcc não informado')
            existsOrError(body.desconta_irrf, 'Desconta IR não informado')
            existsOrError(body.tp_previdencia, 'Tipo de previdencia (GRPS ou RPPS) não informada')
            booleanOrError(body.desconta_sindicato, 'Se desconta sindicato não informado')
            existsOrError(body.enio, 'Tipo de enio não informado')
            existsOrError(body.categoria_receita, 'Categoria mediante a receita não informada')
            existsOrError(body.id_local_trabalho, 'Local de trabalho não informado')
            existsOrError(body.id_cad_principal, 'Cadastro principal não informado')
            existsOrError(body.escolaridaderais, 'Grau de escolaridade para RAIS não informado')
            existsOrError(body.rais, 'Se informa RAIS não informado')
            existsOrError(body.dirf, 'Se informa DIRF não informado')
            booleanOrError(body.sefip, 'Se informa SEFIP não informado')
            existsOrError(body.sicap, 'Se informa SICAP não informado')
            booleanOrError(body.insalubridade, 'Se sofre de insalubridade não informado')
            existsOrError(body.decimo, 'Se paga décimo não informado')
            existsOrError(body.id_vinculo, 'Vínculo funcional não informado')
            existsOrError(body.manad_tiponomeacao, 'Tipo de nomeação manad não informado')
            existsOrError(body.manad_numeronomeacao, 'Numero da nomeação manad não informado')
            existsOrError(body.d_admissao, 'Data de admissao não informada')
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
                    "evento": `Alteração de cadastro funcional`,
                    "tabela_bd": tabela,
                }
            })

            body.evento = evento
            body.updated_at = new Date()
            
            const rowsUpdated = await app.db(tabelaDomain)
                .update(body)
                .where({ id: body.id })
                .then((ret) => {
                    return res.status(200).send(body)
                })
                .catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                    return res.status(500).send(error)
                })
            existsOrError(rowsUpdated, 'Funcional não foi encontrado')
        } else {
            // Criação de um novo registro
            const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()

            body.evento = nextEventID.count + 1
                // Variáveis da criação de um novo registro
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
                            "evento": `Novo registro funcional`,
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
            isMatchOrError(uParams && uParams.cad_servidores >= 3, `${noAccessMsg} "Edição de registro funcional em bloco"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const batch = {...req.body.funcional }
        const client = req.body.client
        const domain = req.body.domain
        let batchSize = 0
        let batchDone = 0
        let batchResult = []
        let pkToUpdate = ''
        const tabelaDomain = `${dbPrefix}_${client}_${domain}.${tabela}`
        const tabelaCadastrosDomain = `${dbPrefix}_${client}_${domain}.cad_servidores`
        const tabelaCentrosDomain = `${dbPrefix}_${client}_${domain}.cad_centros`
        const tabelaCargosDomain = `${dbPrefix}_${client}_${domain}.cad_cargos`
        const tabelaDepartamentosDomain = `${dbPrefix}_${client}_${domain}.cad_departamentos`
        const tabelaLocalTrabalhoDomain = `${dbPrefix}_${client}_${domain}.cad_localtrabalho`
        for (let obj in batch) {
            ++batchSize
            const body = batch[obj];

            const bodyId = await app.db({ cf: tabelaDomain })
                .select({ id: 'cf.id', id_cad_servidores: 'cs.id' })
                .leftJoin({ cs: tabelaCadastrosDomain }, 'cs.id', '=', 'cf.id_cad_servidores')
                .where({ ano: body.ano, mes: body.mes, complementar: body.complementar, 'cs.matricula': body.matricula })
                .first()
            body.id = bodyId && bodyId.id ? bodyId.id : null
            body.id_cad_servidores = bodyId && bodyId.id_cad_servidores ? bodyId.id_cad_servidores : null

            let bodyIdCadServidor = { id: null }
            if (!body.id_cad_servidores) {
                bodyIdCadServidor = await app.db({ cs: tabelaCadastrosDomain })
                    .where({ matricula: body.matricula })
                    .first()
                body.id_cad_servidores = (bodyIdCadServidor && bodyIdCadServidor.id ? bodyIdCadServidor.id : null) || undefined
            }

            const bodyIdCadPrincipal = await app.db({ cs: tabelaCadastrosDomain })
                .where({ matricula: body.id_cad_principal })
                .first()
            body.id_cad_principal = (bodyIdCadPrincipal && bodyIdCadPrincipal.id ? bodyIdCadPrincipal.id : null) ||
                (bodyIdCadServidor && bodyIdCadServidor.id ? bodyIdCadServidor.id : null) || undefined

            const bodyIdCadCentro = await app.db({ cc: tabelaCentrosDomain })
                .where({ cod_centro: body.id_cad_centros })
                .first()
            body.id_cad_centros = (bodyIdCadCentro && bodyIdCadCentro.id ? bodyIdCadCentro.id : null) || undefined

            const bodyIdDepartamento = await app.db({ cc: tabelaDepartamentosDomain })
                .where({ id_departamento: body.id_cad_departamentos })
                .first()
            body.id_cad_departamentos = (bodyIdDepartamento && bodyIdDepartamento.id ? bodyIdDepartamento.id : null) || undefined

            if (body.id_local_trabalho) {
                const bodyIdLocalTrabalho = await app.db({ cc: tabelaLocalTrabalhoDomain })
                    .where({ id_local_trabalho: body.id_local_trabalho })
                    .first()
                body.id_local_trabalho = (bodyIdLocalTrabalho && bodyIdLocalTrabalho.id ? bodyIdLocalTrabalho.id : null) || undefined
            }

            const bodyIdCargo = await app.db({ cc: tabelaCargosDomain })
                .where({ id_cargo: body.id_cad_cargos })
                .first()
            body.id_cad_cargos = (bodyIdCargo && bodyIdCargo.id ? bodyIdCargo.id : null) || undefined

            const bodyValidation = []
            if (!body.id_cad_servidores) bodyValidation.push('Servidor não informado')
            if (!body.ano) bodyValidation.push('Ano da folha não informado')
            if (!body.mes) bodyValidation.push('Mês da folha não informado')
            if (!body.complementar) bodyValidation.push('Complementar da folha não informado')
            if (!body.situacao) bodyValidation.push('Situacao da folha não informada')
            if (!body.situacaofuncional) bodyValidation.push('Situacao funcional não informada')
            if (!body.id_cad_cargos) bodyValidation.push('Cargo não informado')
            if (!body.id_cad_centros) bodyValidation.push('Centro de custo não informado')
            if (!body.id_cad_departamentos) bodyValidation.push('Departamento não informado')
            if (!body.id_pccs) bodyValidation.push('Pcc não informado')
            if (!body.desconta_irrf) bodyValidation.push('Desconta IR não informado')
            if (!body.tp_previdencia) bodyValidation.push('Tipo de previdencia (GRPS ou RPPS) não informada')
            if (!body.desconta_sindicato) bodyValidation.push('Se desconta sindicato não informado')
            if (!['0', '1', '3', '5', '10'].includes(body.enio) || body.enio.isNaN) bodyValidation.push('Tipo de enio não informado')
            if (!body.categoria_receita) bodyValidation.push('Categoria mediante a receita não informada')
            if (!body.id_local_trabalho) bodyValidation.push('Local de trabalho não informado')
            if (!body.id_cad_principal) bodyValidation.push('Cadastro principal não informado')
            if (!body.escolaridaderais) bodyValidation.push('Grau de escolaridade para RAIS não informado')
            if (!body.rais) bodyValidation.push('Se informa RAIS não informado')
            if (!body.dirf) bodyValidation.push('Se informa DIRF não informado')
            if (!body.sefip) bodyValidation.push('Se informa SEFIP não informado')
            if (!body.sicap) bodyValidation.push('Se informa SICAP não informado')
            if (!body.insalubridade) bodyValidation.push('Grau de insalubridade não informado')
            if (!body.decimo) bodyValidation.push('Se paga décimo não informado')
            if (!body.id_vinculo) bodyValidation.push('Vínculo funcional não informado')
            if (!body.manad_tiponomeacao) bodyValidation.push('Tipo de nomeação manad não informado')
            if (!body.manad_numeronomeacao) bodyValidation.push('Numero da nomeação manad não informado')
            if (!body.d_admissao) bodyValidation.push('Data de admissao não informada')
            if (bodyValidation.length > 0) batchResult.push({ matricula: body.matricula, result: JSON.stringify(bodyValidation) })

            if (bodyValidation.length > 0) {
                const mail = {
                    "from": "suporte@mgcash.app.br",
                    "to": "suporte@mgcash.app.br",
                    "subject": "Erro finSFuncional saveByBatch",
                    "message": `${JSON.stringify({ cliente: client, dominio: domain, matricula: body.matricula, result: JSON.stringify(bodyValidation) })}`
                }
                req.mail = mail
                req.batch = true
                mailyCliSender(req, res)
            }

            delete body.origin
            const matricula = body.matricula
            delete body.matricula
            delete body.retorno

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
                        "evento": `Alteração de cadastro funcional`,
                        "tabela_bd": tabela,
                    }
                })

                body.evento = evento
                body.updated_at = new Date()
                await app.db(tabelaDomain)
                    .update(body)
                    .where({ id: body.id })
                    .then((ret) => {
                        batchResult.push({ id: body.id, ano: body.ano, mes: body.mes, complementar: body.complementar, id_cad_servidores: body.id_cad_servidores })
                        pkToUpdate += `'${matricula}',`;
                    })
                    .catch(error => {
                        batchResult.push({ matricula: matricula, result: 'Erro: ' + error })
                        app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    })
            } else {
                // Criação de um novo registro
                const nextEventID = await app.db('sis_events').select(app.db.raw('count(*) as count')).first()

                body.evento = nextEventID.count + 1
                    // Variáveis da criação de um novo registro
                body.status = STATUS_ACTIVE
                body.dominio = domain
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
                                "evento": `Novo registro funcional`,
                                "tabela_bd": tabela,
                            }
                        })
                        batchResult.push({ id: body.id, nome: body.nome })
                        pkToUpdate += `'${matricula}',`;
                        batchDone++
                    })
                    .catch(error => {
                        batchResult.push({ matricula: matricula, result: 'Erro: ' + error })
                        app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                    })
            }
        }
        pkToUpdate = pkToUpdate.substring(0, pkToUpdate.length - 1)
        const result = {
            'done': batchDone,
            'batchResult': batchResult,
            'sqlUpdate': ''
        }
        return res.status(200).send(result)
    }

    const getCurrent = async(req, res) => {
        let user = req.user
        const idCadS = req.params.idCadS || undefined
        try {
            existsOrError(idCadS, 'Servidor não informado')
        } catch (error) {
            return res.status(400).send(error)
        }

        const uParams = await app.db('users').where({ id: user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.cad_servidores >= 1, `${noAccessMsg} "Exibição de dados funcionais de servidor"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaCadServidoresDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.cad_servidores`

        const ret = app.db({ ff: tabelaDomain })
            .where({ 'ff.status': STATUS_ACTIVE, 'ff.id_cad_servidores': idCadS })
            .where({ 'ff.ano': uParams.f_ano, 'ff.mes': uParams.f_mes, 'ff.complementar': uParams.f_complementar })
            .first()
            .then(body => {
                return res.json({ data: body })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    return { save, saveByBatch, getCurrent }
}