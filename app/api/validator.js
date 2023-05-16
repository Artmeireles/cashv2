const moment = require('moment')
const { dbPrefix } = require("../.env")

module.exports = app => {

    const tabelaContratos = 'con_contratos'
    const tabelaServidores = 'cad_servidores'
    const tabelaOrgao = 'orgao'
    const STATUS_NONACTIVE = 9
    const STATUS_ACTIVE = 10
    const STATUS_FINISHED = 20
    const STATUS_DELETE = 99

    const getByFunction = async(req, res) => {
        const func = req.params.func
        switch (func) {
            case 'gvc': // validar contrato de consignação
                valContract(req, res)
                break;
            case 'cch': // validar contracheque
                valCCheque(req, res)
                break;
            default:
                res.status(404).send('Validação inexitente')
                break;
        }
    }


    const valContract = async(req, res) => {
        let uParams = {}
        if (req.params.tk) {
            const tk = Buffer.from(req.params.tk, 'base64').toString('ascii').split("_")
            req.params.id = tk[1]
            uParams = {
                cliente: tk[3],
                dominio: tk[4],
            }
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabelaContratos}`
        const tabelaServidores = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.cad_servidores`
        const tabelaConEventos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.con_eventos`
        const tabelaEventos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.fin_eventos`
        const tabelaConsignatarios = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.consignatarios`
        const tabelaBancos = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.cad_bancos`
        let ret = app.db({ tb1: `${tabelaDomain}` })
            .select('tb1.*', `fe.id_evento`, `fe.evento_nome`,
                app.db.raw(`(SELECT COALESCE(MAX(prazo), 0) FROM ${dbPrefix}_${uParams.cliente}_${uParams.dominio}.fin_rubricas fr WHERE fr.id_con_contratos = tb1.id) as parcelasQuitadas`),
                app.db.raw(`${dbPrefix}_api.getStatusLabel(tb1.status) as status_label`))
            .leftJoin({ ce: `${tabelaConEventos}` }, `ce.id`, `=`, `tb1.id_con_eventos`)
            .leftJoin({ fe: `${tabelaEventos}` }, `fe.id`, `=`, `ce.id_fin_eventos`)
            .leftJoin({ co: `${tabelaConsignatarios}` }, `co.id`, `=`, `tb1.id_consignatario`)
            .leftJoin({ cs: `${tabelaServidores}` }, `cs.id`, `=`, `tb1.id_cad_servidores`)
            .leftJoin({ cb: `${tabelaBancos}` }, `cb.id`, `=`, `co.id_cad_bancos`)
            .whereIn('tb1.status', [STATUS_NONACTIVE, STATUS_ACTIVE, STATUS_FINISHED])
        if (req.query && req.query.tkn) {
            ret.where(app.db.raw(`tb1.token = '${req.query.tkn}'`))
        } else
            ret.where(app.db.raw('tb1.id = ?', [req.params.id]))
        ret.first()
        ret.then((body) => {
                const validationTerms = {
                    type: "Contrato",
                    pageTitle: "Validação de Contrato",
                    pageSubTitle: "Contrato validado com suceso",
                    panelTitle: "Confirmação de averbação de contrato",
                    panelSubTitle: `Contrato: ${body.contrato}`,
                    panelText: 'O presente contrato foi averbado <strong>' +
                        getLabel(meioAverbacao, body.averbado_online) + '</strong>, em ' + setDataPt(body.data_averbacao) +
                        ' e foi firmado com parcelas iguais no valor de ' +
                        body.valor_parcela.toLocaleString("pt-br", { style: "currency", currency: "BRL", }) +
                        ', sendo quitado num total de ' + body.parcelas +
                        ' parcelas. O valor total (bruto) contratado foi de ' +
                        body.valor_total.toLocaleString("pt-br", { style: "currency", currency: "BRL", }) +
                        ', sendo que o valor liquido total consignado foi de ' +
                        body.valor_liquido.toLocaleString("pt-br", { style: "currency", currency: "BRL", }) + '.'
                }
                return res.json({ data: {...body, ...validationTerms } })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    const valCCheque = async(req, res) => {
        const { titleCase } = app.api.facilities
        let uParams = {}
        let id_cad_servidor
        let valorLiquido
        let uid
        if (req.params.tk) {
            const tk = Buffer.from(req.params.tk, 'base64').toString('ascii').split("_")
            id_cad_servidor = tk[1]
            uParams = {
                cliente: tk[3],
                dominio: tk[4],
                ano: tk[6],
                mes: tk[7],
            }
            valorLiquido = tk[5]
            uid = Buffer.from(`${id_cad_servidor}_${valorLiquido}`).toString("base64")
        }
        const tabelaDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabelaServidores}`
        const tabelaOrgaoDomain = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}.${tabelaOrgao}`
        const orgao = await app.db({ o: tabelaOrgaoDomain }).first()
        let ret = app.db({ tb1: `${tabelaDomain}` })
            .select('tb1.*')
            .where({ 'tb1.id': id_cad_servidor })
            .first()
        const primNomeOrgao = orgao.orgao.split(" ")
        let pronomeOrgao
        switch (primNomeOrgao[0].toLowerCase()) {
            case 'prefeitura':
                pronomeOrgao = 'pela'
                break;
            case 'instituto':
                pronomeOrgao = 'pelo'
                break;
            default:
                pronomeOrgao = 'por'
                break;
        }
        ret.then((body) => {
                const validationTerms = {
                    type: "Contracheque",
                    pageTitle: "Validação de Contracheque",
                    pageSubTitle: "Contracheque validado com suceso",
                    panelTitle: "Confirmação de Contracheque",
                    panelSubTitle: `O presente contracheque é VÁLIDO!`,
                    panelText: `<p>Refere-se à folha de pagamento de ${uParams.mes}/${uParams.ano}(MM/AAAA)</p>` +
                        `<p>O <strong>UID</strong> localizado abaixo do QR Code é <strong>${uid.substring(0,13)}</strong></p>` +
                        '<p>O valor líquido dele é RS ' +
                        valorLiquido.toLocaleString("pt-br", { style: "currency", currency: "BRL", }) + '.</p>' +
                        `<p>Este contracheque foi emitido ${pronomeOrgao} <strong>` +
                        orgao.orgao + '</strong> a favor de <strong>' + titleCase(body.nome) + '</strong></p>'
                }
                return res.json({ data: {...body, ...validationTerms } })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                return res.status(500).send(error)
            })
    }

    function getLabel(array, key) {
        const item = array.filter((it) => it.value == key);
        return item && item[0] && item[0].text ? item[0].text : "";
    }

    function setDataPt(data) {
        return moment(data, "YYYY-MM-DD").format("DD/MM/YYYY");
    }

    const meioAverbacao = [
        { value: "-1", text: "Selecione" },
        { value: "0", text: "online - por meio de senha do cliente" },
        { value: "1", text: "de forma presencial - por meio de assinatura do cliente" },
    ]


    return { getByFunction }
}