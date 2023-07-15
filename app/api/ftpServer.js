const client = require("basic-ftp")
const { ftp } = require('../.env')

module.exports = app => {
    // create reusable ftp client object using the default FTP params
    const ftpClient = new client.Client()
    ftpClient.ftp.verbose = false
    const workingRoot = '/docs/uploads'

    const example = async(req, res) => {
        try {
            await ftpClient.access(ftp)
            const list = await ftpClient.list()
            list.forEach(element => {});
            // const workingDir = './teste/testesubdir'
            // await ftpClient.ensureDir(workingDir)
            // await ftpClient.cd('/teste/testesubdir')
            // await ftpClient.uploadFrom(".env", "README_FTP.md")
            // await ftpClient.downloadTo("README_COPY.md", "README_FTP.md")
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
        }
        ftpClient.close()
    }

    // example()

    const ftpWDList = async(req, res) => {
        const body = {...req.body }
        const wd = body && body.workingDir ? body.workingDir : ""
        await ftpClient.access(ftp)
        await ftpClient.ensureDir(`./${workingRoot}/${uParams.dominio}/${wd}`)
        await ftpClient.cd(`/${workingRoot}/${uParams.dominio}/${wd}`)
            // await ftpClient.uploadFrom(".env", "README_FTP.md")
            // await ftpClient.downloadTo("README_COPY.md", "README_FTP.md")
        const pwd = await ftpClient.pwd()
        await ftpClient.list()
            .then(list => {
                let foldersCount = 0
                let filesCount = 0
                list.forEach(element => {
                    if (element.type == 1) filesCount++
                        if (element.type == 2) foldersCount++
                });
                return res.json({ list, pwd, filesCount, foldersCount })
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename}.${__function} ${error}`, sConsole: true } })
                    return res.status(500).send(error)
            })
    }

    return { ftpClient, ftpWDList }
}