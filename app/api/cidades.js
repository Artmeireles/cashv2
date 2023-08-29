
module.exports = app => {
    const tabela = 'cidades'

    const getListaCidades = async (req, res) => {
        const uf = req.query.uf
        if (uf && uf.length == 2) {
            let sql = app.db({ c: 'cad_cidades' })
                .select('id', 'uf_abrev', 'uf_nome', 'municipio_id', 'municipio_nome')
                .where({ uf_abrev: uf }).orderBy('municipio_nome')
                .then(body => {
                    return res.json({ data: body })
                }).catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                    return res.status(400).send(error)
                })
        } else return res.status(400).send('UF não informada ou inválida')
    }
    
    const getUFByCidade = async (req, res) => {
        const cidade = req.query.cidade
        if (cidade && cidade.length > 0) {
            let sql = app.db({ c: 'cad_cidades' })
                .select('uf_abrev', 'uf_nome')
                .where({ id: cidade }).first()
                .then(body => {
                    return res.json(body)
                }).catch(error => {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}). Error: ${error}`, sConsole: true } })
                    return res.status(400).send(error)
                })
        } else return res.status(400).send('UF não informada ou inválida')
    }

    return { getListaCidades, getUFByCidade }
}