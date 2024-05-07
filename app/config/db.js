const config = require('../knexfile.js')
const knex = require('knex')(config)
const fs = require('fs');
const path = require('path');

const sqlFolderPath = './migrations/RawSql'; // Caminho da pasta com os arquivos RawSql
const sqlDoneFolderPath = './migrations/RawSqlDone'; // Caminho da pasta com os arquivos RawSqlDone
const jsonFolderPath = './migrations/Json'; // Caminho da pasta com os arquivos Json
const jsonDoneFolderPath = './migrations/JsonDone'; // Caminho da pasta com os arquivos JsonDone

executeSqlFile(sqlFolderPath, sqlDoneFolderPath);
executeJsontoSql(jsonFolderPath, jsonDoneFolderPath);

/**
 * Função responsável por executar os arquivos SQL e lançar no banco de dados
 * @param {*} sqlFolderPath 
 * @param {*} sqlDoneFolderPath 
 */
function executeSqlFile(sqlFolderPath, sqlDoneFolderPath) {
    fs.readdir(sqlFolderPath, (err, files) => {
        if (err) {
            console.error('Erro ao ler a pasta:', err);
            return;
        }

        files.forEach(async (file) => {
            const sqlFilePath = path.join(sqlFolderPath, file);
            const sql = fs.readFileSync(sqlFilePath).toString();
            const sqlStatements = sql.split(';').filter(statement => statement.trim() !== '');
            let success = true;

            sqlStatements.forEach(async (statement) => {
                // Executar com transaction
                await knex.transaction((trx) => {
                    trx.raw(statement)
                        .then(() => {
                            console.log(`Instrução executada com sucesso do arquivo ${file}: ${statement}`);
                        })
                        .catch((error) => {
                            console.error(`Erro ao executar uma instrução do arquivo ${file}: ${statement}`, error);
                            success = false;
                        });
                });
            })
                .then(async () => {
                    await knex.raw('SET FOREIGN_KEY_CHECKS = 1')
                        .then(() => {
                            console.log(`Instrução executada com sucesso do arquivo ${file}: SET FOREIGN_KEY_CHECKS = 1`);
                        })
                        .catch((error) => {
                            console.error(`Erro ao executar uma instrução do arquivo ${file}: SET FOREIGN_KEY_CHECKS = 1`, error);
                            success = false;
                        });
                });
            if (!success) {
                return;
            }
            fs.mkdirSync(sqlDoneFolderPath, { recursive: true });
            fs.rename(sqlFilePath, path.join(sqlDoneFolderPath, file), (err) => {
                if (err) {
                    console.error(`Erro ao renomear o arquivo ${file}:`, err);
                } else {
                    console.log(`Arquivo ${file} movido para ${sqlDoneFolderPath}`);
                }
            });
        });
    });
}


/**
 * Função responsável por executar os arquivos JSON e lançar no banco de dados
 * @param {*} jsonFolderPath 
 * @param {*} jsonDoneFolderPath 
 */
function executeJsontoSql(jsonFolderPath, jsonDoneFolderPath) {
    fs.readdir(jsonFolderPath, (err, files) => {
        if (err) {
            console.error('Erro ao ler a pasta:', err);
            return;
        }

        files.forEach((file) => {
            const jsonFilePath = path.join(jsonFolderPath, file);
            const json = fs.readFileSync(jsonFilePath).toString();

            knex.raw(convertToBatchInsertSQL(json))
                .then(() => {
                    fs.mkdirSync(jsonDoneFolderPath, { recursive: true });
                    fs.rename(sqlFilePath, path.join(jsonDoneFolderPath, file), (err) => {
                        if (err) {
                            console.error(err);
                        }
                    });
                    console.log(`Arquivo ${file} executado com sucesso e renomeado para ${jsonDoneFolderPath}`);
                })
                .catch((error) => {
                    console.error(`Erro ao executar o arquivo ${file}:`, error);
                });
        });
    });
}

// Esta função é capaz de converter um JSON em um SQL de insert em batch
function convertToBatchInsertSQL(data) {
    if (!data.tabela || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
        return '';
    }

    const tableName = data.tabela;
    const dataArray = data.data;

    const columns = Object.keys(dataArray[0]);
    const values = dataArray.map((obj) =>
        Object.values(obj).map((value) => {
            if (typeof value === 'string') {
                return `'${value}'`;
            }
            return value;
        })
    );

    const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES \n`;

    const rows = values
        .map((row) => `(${row.join(', ')})`)
        .join(',\n');

    return `${insertSQL}${rows};`;
}

knex.migrate.latest([config])
module.exports = knex