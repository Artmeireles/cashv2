const moment = require('moment')
const randomstring = require("randomstring")
const { dbPrefix } = require("../.env")

module.exports = app => {
    const { existsOrError, notExistsOrError, isMatchOrError, noAccessMsg } = app.api.validation
    const tabela = 'con_eventos'
    const STATUS_ACTIVE = 10
    const STATUS_DELETE = 99

    const getEventosConsignados = async(req, res) => {
        const uParams = await app.db('users').where({ id: req.user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams.con_contratos >= 1, `${noAccessMsg} "Exibição de eventos consignados"`)
        } catch (error) {
            return res.status(401).send(error)
        }

        const id_cad_servidores = req.query.id_cad_servidores // apenas os que o servidor não tem ativos
        const id_con_eventos = req.query.id_con_eventos || 0 // evento atual que deve sr listado
        const id_consignatario = req.params.id_consignatario
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabela}`
        const tabelaFinEventos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.fin_eventos`
        const tabelaConContratos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_contratos`
        const tabelaConsignatarios = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.consignatarios`
        const tabelaCadBancos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.cad_bancos`

        const eventosAtivos = await app.db({ ce: `${tabelaDomain}` })
            .select(`ce.id`)
            .join({ cc: `${tabelaConContratos}` }, `cc.id_con_eventos`, `=`, `ce.id`)
            .where(app.db.raw(`cc.id_cad_servidores = ${id_cad_servidores}`))
            .where(app.db.raw(`cc.id_consignatario = ${id_consignatario}`))
            .where(app.db.raw(`cc.status = ${STATUS_ACTIVE}`))
        let con_eventos = []
        eventosAtivos.forEach(element => {
            con_eventos.push(element.id)
        });
        let ret = app.db({ ce: `${tabelaDomain}` })
            .select(`ce.id`, `fe.id_evento`, `fe.evento_nome`)
            .join({ fe: `${tabelaFinEventos}` }, `fe.id`, `=`, `ce.id_fin_eventos`)
            .join({ co: `${tabelaConsignatarios}` }, `co.id`, `=`, `ce.id_consignatario`)
            .join({ cb: `${tabelaCadBancos}` }, `cb.id`, `=`, `co.id_cad_bancos`)
            .where(app.db.raw(`ce.id_consignatario = ${id_consignatario}`))
            .whereNotIn('ce.id', con_eventos).orWhereIn('ce.id', [id_con_eventos])
            .orderBy(app.db.raw(`CAST(fe.id_evento AS UNSIGNED)`))
        ret.then(body => {
                return res.json({ data: body })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    return { getEventosConsignados }
}