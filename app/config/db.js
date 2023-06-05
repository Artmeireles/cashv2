const config = require('../knexfile.js')
const knex = require('knex')(config)
// const fs = require('fs');
// const path = require('path');

// const sqlFolderPath = './migrations/Json'; // Caminho da pasta com os arquivos SQL

// fs.readdir(sqlFolderPath, (err, files) => {
//     if (err) {
//         console.error('Erro ao ler a pasta:', err);
//         return;
//     }

//     files.forEach((file) => {
//         console.log(file);
//         const sqlFilePath = path.join(sqlFolderPath, file);
//         const sql = fs.readFileSync(sqlFilePath).toString();

//         knex.raw(sql)
//             .then(() => {
//                 console.log(`Arquivo ${file} executado com sucesso`);
//             })
//             .catch((error) => {
//                 console.error(`Erro ao executar o arquivo ${file}:`, error);
//             });
//     });
// });

// fs.readdir(sqlFolderPath, (err, files) => {
//     if (err) {
//         console.error('Erro ao ler a pasta:', err);
//         return;
//     }

//     files.forEach(async (file) => {
//         const filePath = path.join(sqlFolderPath, file);
//         let fileExt = path.extname(filePath)
//         if (fileExt) fileExt = fileExt.split('.')[1]
//         // console.log(fileExt);
//         if (fileExt == 'json') {
//             let fileName = path.basename(filePath, fileExt).split('.')[0].split('_')[1];
//             console.log(fileName);
//             if (fileName) fileName = fileName.split('_')[1]
//             // const jsonData = fs.readFileSync(filePath).toString();
//             // knex('params')
//             //     .insert(jsonData)
//             //     .then(() => {
//             //         fs.rename(filePath, novoCaminho, (err) => {
//             //             if (err) {
//             //                 console.error(err);
//             //             } else {
//             //                 console.log('Arquivo renomeado com sucesso!');
//             //             }
//             //         });

//             //         console.log(`Arquivo ${file} executado com sucesso`);
//             //     })
//             //     .catch((error) => {
//             //         console.error(`Erro ao executar o arquivo ${file}:`, error);
//             //     });
//         }
//     });
// });

knex.migrate.latest([config])
module.exports = knex