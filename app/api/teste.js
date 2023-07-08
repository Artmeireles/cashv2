// const variavel = ''

// if (!variavel) {
//   console.log('Variável não possui valor');
// } else {
//   console.log('Variável possui valor');
// }

// if (!!variavel) {
//   console.log('Variável é truthy');
// } else {
//   console.log('Variável é falsy');
// }

// function diffInDays(dateStr, days) {
//   // Converte a string em uma instância de Date
//   const date = new Date(dateStr);

//   // Obtem a diferença de tempo em milissegundos entre as duas datas
//   const diffTime = Math.abs(Date.now() - date.getTime());

//   // Converte a diferença de tempo em dias
//   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

//   // Retorna `true` se a diferença em dias for maior ou igual a `days`
//   return diffDays >= days;
// }

// const dateStr = '2023-05-05 11:30:00';
// const days = 7;

// if (diffInDays(dateStr, days)) {
//   console.log(`${days} dias já se passaram desde ${dateStr}`);
// } else {
//   console.log(`${days} dias ainda não se passaram desde ${dateStr}`);
// }

// const now = new Date() / 1000
// console.log(now);

// console.log(Math.floor(now));
// console.log(Math.ceil(now));

// Preciso de uma função que recebe um sql tipo "INSERT INTO `wwmgca_api`.`params` (`id`, `status`, `evento`, `created_at`, `updated_at`, `dominio`, `meta`, `value`, `label`) values (0,10,1,now(),null,'root','codIncCP','00','Não é base de cálculo'), ..." 
// e converta em um array de objetos json que mais tarde utilizarei para fazer um batchinsert com knex.js

// function convertSQLToJSON(sql) {
//     const regexValues = /\((.*?)\)/g; // Expressão regular para extrair os valores entre parênteses
//     const regexNumber = /\b\d+\b/g; // Expressão regular para encontrar números inteiros
  
//     const matches = sql.match(regexValues); // Encontrar todos os conjuntos de valores
//     if (!matches) return []; // Retornar um array vazio se não houver correspondência
  
//     const jsonArray = matches.map((match) => {
//       const values = match.match(regexNumber); // Encontrar os valores numéricos
  
//       return {
//         id: parseInt(values[0]),
//         status: parseInt(values[1]),
//         evento: parseInt(values[2]),
//         created_at: new Date(),
//         updated_at: null,
//         dominio: values[5],
//         meta: values[6],
//         value: values[7],
//         label: values[8],
//       };
//     });
  
//     return JSON.stringify(jsonArray);
//   }
  

//   const sql = "(0,10,1,now(),null,'root','codIncCP','00','Não é base de cálculo'),(0,10,1,now(),null,'root','codIncCP','00','Não é base de cálculo'),(0,10,1,now(),null,'root','codIncCP','00','Não é base de cálculo'),(0,10,1,now(),null,'root','codIncCP','00','Não é base de cálculo'),";

//   const jsonArray = convertSQLToJSON(sql);
//   console.log(jsonArray);
  