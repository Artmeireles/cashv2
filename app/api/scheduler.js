// scheduler.js - Classe de agendamento de tarefas

// O pacote 'node-schedule' é uma biblioteca de agendamento de tarefas baseada em expressões cron para Node.js.
// Ele fornece uma API simples e expressiva para agendar tarefas em intervalos específicos.

const schedule = require('node-schedule');
const { dbPrefix } = require('../.env');
const { appName } = require("../config/params")

module.exports = app => {
    const tabelaConContratos = 'con_contratos';
    const tabelaConParcelas = 'con_parcelas';
    const { STATUS_ACTIVE, STATUS_FINISHED } = app.api.conContratos;
    const { transporter } = app.api.mailer

    /**
     * Função responsável por encerrar contratos.
     * A função é executada no primeiro segundo do primeiro dia de cada mês.
     * Ela percorre os esquemas do banco de dados, localiza as tabelas relevantes e atualiza os contratos encerrados.
     */
    const terminateContracts = async () => {
        const schemas = await app.db('information_schema.SCHEMATA')
            .select('schema_name')
            .whereRaw("SUBSTRING_INDEX(schema_name, '_', -2) <> schema_name")
            .andWhere('schema_name', 'like', `${dbPrefix}%`);

        schemas.forEach(async (element) => {
            const tabelaConContratosDomain = `${element.schema_name}.${tabelaConContratos}`;
            const tabelaConParcelasDomain = `${element.schema_name}.${tabelaConParcelas}`;

            const updated = await app.db({ cc: tabelaConContratosDomain })
                .join({ cp: tabelaConParcelasDomain }, 'cp.id_con_contratos', 'cc.id')
                .where('cc.status', STATUS_ACTIVE)
                .andWhere('cp.vencimento', '<=', app.db.raw('LAST_DAY(DATE_ADD(NOW(), INTERVAL -1 MONTH))'))
                .andWhereRaw('cc.parcelas = cp.parcela')
                .update({ 'cc.status': STATUS_FINISHED, 'data_liquidacao': new Date() });

            const confirmMsg = `Liquidação de ${updated} contratos em ${tabelaConContratosDomain}!`
            if (updated > 0) {
                app.api.logger.logInfo({
                    log: {
                        line: confirmMsg,
                        sConsole: true
                    }
                });
                try {
                    await transporter.sendMail({
                        from: `"${appName}" <contato@mgcash.app.br>`, // sender address
                        to: [`atendimento@mgcash.app.br`, `suporte@mgcash.app.br`], // list of receivers
                        subject: `Liquidação autonôma de de contratos`, // Subject line
                        text: `Estamos confirmando a ${confirmMsg.toLowerCase()}\nAtenciosamente,\nTime ${appName}`,
                        html: `<p>Estamos confirmando a ${confirmMsg.toLowerCase()}</p><p>Atenciosamente,</p><p><b>Time ${appName}</b></p>`,
                    })
                } catch (error) {
                    app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } })
                }
            }
        })
    }
    const ruleOneByMonth = '0 0 6 1 * *'

    // Agendamento da tarefa para executar no primeiro segundo do primeiro dia de cada mês
    const everyMonth = schedule.scheduleJob(ruleOneByMonth, async () => {
        await terminateContracts();
    });
};

/**
O formato cron consiste em seis campos separados por espaços, que definem um cronograma para a execução de tarefas. Cada campo representa uma unidade de tempo específica. Os campos, na ordem, são:

1. Segundos (0-59)
2. Minutos (0-59)
3. Horas (0-23)
4. Dias do mês (1-31)
5. Meses (0-11, onde 0 é janeiro e 11 é dezembro)
6. Dias da semana (0-7, onde 0 e 7 são domingo)

A maioria dos campos começa com 0, indicando o início do intervalo. Por exemplo, para representar todos os segundos de 0 a 59, você usaria `0-59` no campo de segundos. 
Isso significa que a contagem dos segundos começa em 0 e vai até 59.

No entanto, existem algumas exceções:

- Os dias do mês podem variar de 1 a 31, dependendo do mês e do ano.
- Os dias da semana podem ser representados de duas maneiras: de 0 a 7 (onde 0 e 7 representam domingo) ou de 1 a 7 (onde 1 é domingo).

Para representar intervalos, você pode usar um hífen (-). Por exemplo, `0-5` no campo de segundos representaria os segundos de 0 a 5. 
Para representar listas de valores, você pode separá-los por vírgulas. Por exemplo, `0,15,30,45` no campo de minutos representaria os minutos 0, 15, 30 e 45.

É importante lembrar que o formato cron pode variar um pouco dependendo da implementação ou biblioteca utilizada. 
Portanto, verifique a documentação específica da biblioteca que você está usando para obter informações mais precisas sobre como escrever expressões cron.
 */