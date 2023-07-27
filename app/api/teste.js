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

// function resolveAfter2Seconds() {
//     return new Promise(resolve => {
//       setTimeout(() => {
//         resolve('resolved');
//       }, 2000);
//     });
//   }

//   async function asyncCall() {
//     console.log('calling');
//     const result = await resolveAfter2Seconds();
//     console.log('resolving');
//     console.log(result);
//     // Expected output: "resolved"
//   }

//   asyncCall();

// function eSocial() {

//     const body = `cpfcnpjtransmissor=12261228000114\n\rcpfcnpjempregador=12261228000114\n\ridgrupoeventos=3\n\rversaomanual=S.01.00.00\n\rambiente=1\n\rINCLUIRS1200\n\rindRetif_4=2\n\rnrRecibo_5=1.1.0000000016909337468\n\rindApuracao_6=1\n\rperApur_7=2022-08\n\rtpAmb_8=1\n\rprocEmi_9=1\n\rverProc_10=S-1.0\n\rtpInsc_12=1\n\rnrInsc_13=12261228\n\rcpfTrab_15=58329021491\n\rindMV_18= \n\rINCLUIRREMUNOUTREMPR_150\n\rtpInsc_109= \n\rnrInsc_110=              \n\rcodCateg_22=   \n\rvlrRemunOE_23=\n\rSALVARREMUNOUTREMPR_150\n\rINCLUIRDMDEV_153\n\rideDmDev_35=08/2022\n\rcodCateg_112=302 \n\rSALVARDMDEV_153\n\rINCLUIRIDEESTABLOT_154\n\rtpInsc_113=1\n\rnrInsc_114=12261228000114\n\rcodLotacao_41=12261228\n\rSALVARIDEESTABLOT_154\n\rINCLUIRREMUNPERAPUR_155\n\rmatricula_44=00000001\n\rindSimples_45=\n\rgrauExp_64=1\n\rSALVARREMUNPERAPUR_155\n\rINCLUIRITENSREMUN_156\n\rcodRubr_47=105\n\rideTabRubr_48=105\n\rqtdRubr_49=\n\rfatorRubr_50=\n\rvrRubr_52=480\n\rindApurIR_115=1\n\rSALVARITENSREMUN_156\n\rINCLUIRITENSREMUN_156\n\rcodRubr_47=999\n\rideTabRubr_48=999\n\rqtdRubr_49=\n\rfatorRubr_50=15.00\n\rvrRubr_52=77.2\n\rindApurIR_115=1\n\rSALVARITENSREMUN_156\n\rINCLUIRITENSREMUN_156\n\rcodRubr_47=001\n\rideTabRubr_48=001\n\rqtdRubr_49=\n\rfatorRubr_50=31\n\rvrRubr_52=2400\n\rindApurIR_115=1\n\rSALVARITENSREMUN_156\n\rINCLUIRDMDEV_153\n\rideDmDev_35=08/2022\n\rcodCateg_112=305 \n\rSALVARDMDEV_153\n\rINCLUIRIDEESTABLOT_154\n\rtpInsc_113=1\n\rnrInsc_114=12261228000114\n\rcodLotacao_41=12261228\n\rSALVARIDEESTABLOT_154\n\rINCLUIRREMUNPERAPUR_155\n\rmatricula_44=00000000\n\rindSimples_45=\n\rgrauExp_64=1\n\rSALVARREMUNPERAPUR_155\n\rINCLUIRITENSREMUN_156\n\rcodRubr_47=105\n\rideTabRubr_48=105\n\rqtdRubr_49=\n\rfatorRubr_50=\n\rvrRubr_52=480\n\rindApurIR_115=1\n\rSALVARITENSREMUN_156\n\rINCLUIRITENSREMUN_156\n\rcodRubr_47=999\n\rideTabRubr_48=999\n\rqtdRubr_49=\n\rfatorRubr_50=15.00\n\rvrRubr_52=77.2\n\rindApurIR_115=1\n\rSALVARITENSREMUN_156\n\rINCLUIRITENSREMUN_156\n\rcodRubr_47=001\n\rideTabRubr_48=001\n\rqtdRubr_49=\n\rfatorRubr_50=31\n\rvrRubr_52=2400\n\rindApurIR_115=1\n\rSALVARITENSREMUN_156\n\rSALVARS1200\n\r`;

//     const root = [];
//     let perApur = null;
//     let cpfTrab = null;
//     let codCateg = null;
//     let matricula = null;
//     let grauExp = null
//     let codRubr = null;
//     let ideTabRubr = null;
//     let qtdRubr = null;
//     let fatorRubr = null;
//     let vrRubr = null;
//     let indApurIR = null;

//     const lines = body.split('\n\r');
//     for (const line of lines) {
//         if (line.startsWith('perApur')) {
//             perApur = line.split('=')[1];
//         } else if (line.startsWith('cpfTrab_')) {
//             cpfTrab = line.split('=')[1];
//         } else if (line.startsWith('codCateg_')) {
//             codCateg = line.split('=')[1];
//         } else if (line.startsWith('matricula_')) {
//             matricula = line.split('=')[1];
//             // Executar update em serv_vinculos
//         } else if (line.startsWith('grauExp_')) {
//             grauExp = line.split('=')[1];
//         } else if (line.startsWith('codRubr_')) {
//             codRubr = line.split('=')[1];
//         } else if (line.startsWith('ideTabRubr_')) {
//             ideTabRubr = line.split('=')[1];
//         } else if (line.startsWith('qtdRubr_')) {
//             qtdRubr = line.split('=')[1];
//         } else if (line.startsWith('fatorRubr_')) {
//             fatorRubr = line.split('=')[1];
//         } else if (line.startsWith('vrRubr_')) {
//             vrRubr = line.split('=')[1];
//         } else if (line.startsWith('indApurIR_')) {
//             indApurIR = line.split('=')[1];
//             currentGroup = {
//                 id_serv_vinc: matricula.trim(),
//                 id_remun_param: perApur.trim(),
//                 id_rubrica: ideTabRubr.trim(),
//                 qtd_rubr: qtdRubr.trim(),
//                 fator_rubr: fatorRubr.trim(),
//                 valor_rubr: vrRubr.trim(),
//                 ind_apur_ir: indApurIR.trim(),
//                 prazo_i: '1',
//                 prazo_f: '1'
//             }
//             root.push(currentGroup);
//         }
//     }

//     console.log({
//         'perApur': perApur,
//         'cpfTrab': cpfTrab,
//         'codCateg': codCateg,
//         root
//     });
// }

// eSocial();