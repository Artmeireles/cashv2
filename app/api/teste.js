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
