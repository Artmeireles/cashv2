const mysql = require('mysql');
const orignSchema = 'wwmgca_cliente_ativos';
const newSchema = 'mgcash_tapera_ativos';

// Configurações de conexão com o banco de dados
const connection = mysql.createConnection({
    host: '192.168.255.107',
    port: 3306,
    database: orignSchema,
    collation: 'utf8mb4_general_ci',
    charset: 'utf8mb4',
    user: 'root',
    password: ''
});

// Função para obter os nomes das tabelas no schema wwmgca_cliente_ativos
function getTableNames(callback) {
    connection.query(`SHOW TABLES IN ${orignSchema}`, (err, results) => {
        if (err) {
            console.error('Erro ao obter nomes das tabelas:', err);
            return callback(err, null);
        }
        const tables = results.map(row => row[`Tables_in_${orignSchema}`]);
        callback(null, tables);
    });
}

// Função para obter o CREATE TABLE de uma tabela específica
function getCreateTable(tableName, callback) {
    connection.query(`SHOW CREATE TABLE ${orignSchema}.${tableName}`, (err, results) => {
        if (err) {
            console.error(`Erro ao obter CREATE TABLE de ${tableName}:`, err);
            return callback(err, null);
        }
        let createTableSql = results[0]['Create Table'];
        createTableSql = createTableSql
            .replace('CREATE TABLE', 'CREATE TABLE IF NOT EXISTS')
            .replace(/\n/g, ' ')
            .replace(new RegExp(orignSchema, 'g'), newSchema); // Remove as quebras de linha e substitui o schema de origem pelo novo schema
        callback(null, createTableSql);
    });
}

// Função para criar um novo schema e as tabelas correspondentes
function criarNovoSchema(schemaName, tables, callback) {
    connection.query(`CREATE DATABASE IF NOT EXISTS \`${schemaName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`, err => {
        if (err) {
            console.error('Erro ao criar novo schema:', err);
            return callback(err);
        }
        console.log(`Schema ${schemaName} criado ou já existe.`);

        // Mudar para o novo schema
        connection.query(`USE \`${schemaName}\``, err => {
            if (err) {
                console.error(`Erro ao mudar para o schema ${schemaName}:`, err);
                return callback(err);
            }
            console.log(`Usando schema ${schemaName}.`);

            // Desativar checagens de chave estrangeira
            connection.query('SET FOREIGN_KEY_CHECKS = 0', err => {
                if (err) {
                    console.error('Erro ao desativar checagens de chave estrangeira:', err);
                    return callback(err);
                }

                // Itera sobre as tabelas, obtém o CREATE TABLE, remove se existir e cria no novo schema
                let completedTables = 0;
                tables.forEach(tableName => {
                    getCreateTable(tableName, (err, createTableSql) => {
                        if (err) {
                            console.error(`Erro ao obter CREATE TABLE de ${tableName}:`, err);
                            return callback(err);
                        }

                        const dropTableSql = `DROP TABLE IF EXISTS \`${tableName}\``;
                        connection.query(dropTableSql, err => {
                            if (err) {
                                console.error(`Erro ao remover tabela ${tableName}:`, err);
                                return callback(err);
                            }
                            console.log(`Tabela ${tableName} removida (se existia).`);

                            connection.query(createTableSql, err => {
                                if (err) {
                                    console.error(`Erro ao criar tabela ${tableName} no novo schema:`, err);
                                    return callback(err);
                                }
                                console.log(`Tabela ${tableName} criada no novo schema.`);

                                completedTables++;
                                if (completedTables === tables.length) {
                                    // Reativar checagens de chave estrangeira
                                    connection.query('SET FOREIGN_KEY_CHECKS = 1', err => {
                                        if (err) {
                                            console.error('Erro ao reativar checagens de chave estrangeira:', err);
                                            connection.end(); // Fecha a conexão com o banco de dados
                                            return callback(err);
                                        }
                                        callback(null);
                                    });
                                }
                            });
                        });
                    });
                });
            });
        });
    });
}

// Exemplo de uso
getTableNames((err, tables) => {
    if (err) {
        console.error('Erro ao obter nomes das tabelas:', err);
        return;
    }
    criarNovoSchema(newSchema, tables, err => {
        if (err) {
            console.error('Erro ao criar novo schema e tabelas:', err);
            process.exit(1); // Encerra a aplicação com erro
        }
        console.log('Novo schema e tabelas criados com sucesso!');
        process.exit(0); // Encerra a aplicação com sucesso
    });
});
