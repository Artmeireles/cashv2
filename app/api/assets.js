const path = require('path')
const fs = require('fs');

module.exports = app => {
    const { isMatchOrError, noAccessMsg, existsOrError } = app.api.validation

    const getAsset = async (req, res) => {
        const body = { ...req.body }
        const root = body.root || undefined
        const asset = body.asset || undefined
        const extension = body.extension || undefined
        const uParams = await app.db({ u: 'users' }).join({ e: 'empresa' }, 'u.id_emp', '=', 'e.id').where({ 'u.id': req.user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.id, `${noAccessMsg} "Exibição de arquivo do sistema"`)
            existsOrError(root, "Endereço do arquivo não informado")
            existsOrError(asset, "Nome do arquivo não informado")
            existsOrError(extension, "Extensão do arquivo não informado")
        } catch (error) {
            return res.status(401).send(error)
        }
        const mime = {
            html: 'text/html',
            pdf: 'application/pdf',
            txt: 'text/plain',
            css: 'text/css',
            gif: 'image/gif',
            jpg: 'image/jpeg',
            png: 'image/png',
            svg: 'image/svg+xml',
            js: 'application/javascript'
        };

        const dir = path.join(__dirname, "../assets")
        var file = path.join(dir, `${root}/${asset}.${extension}`);
        if (file.indexOf(dir + path.sep) !== 0) {
            return res.status(403).end('Forbidden');
        }
        var type = mime[path.extname(file).slice(1)] || 'text/plain';
        var s = fs.createReadStream(file, { encoding: 'base64' });
        s.on('open', function () {
            res.set('Content-Type', type);
            s.pipe(res);
        });
        s.on('error', function () {
            res.set('Content-Type', 'text/plain');
            res.status(404).end('File not found');
        });

    }
    return { getAsset }
}