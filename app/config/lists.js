/**
 * Algumas listas úteis
 */

module.exports = {

    /**
     * Retorna um label para um código de afastamento
     */
    afastamentosDef: (value) => {
        let ret = undefined;
        switch (value) {
            case 'H':
                ret = 'Rescisão, com justa causa, por iniciativa do empregador';
                break;
            case 'I1':
                ret = 'Rescisão sem justa causa, por iniciativa do empregador, inclusive rescisão antecipada do contrato a termo';
                break;
            case 'I2':
                ret = 'Rescisão por culpa recíproca ou força maior';
                break;
            case 'I3':
                ret = 'Rescisão por término do contrato a termo';
                break;
            case 'I4':
                ret = 'Rescisão sem justa causa do contrato de trabalho do empregado doméstico, por iniciativa do empregador';
                break;
            case 'J':
                ret = 'Rescisão do contrato de trabalho por iniciativa do empregado';
                break;
            case 'K':
                ret = 'Rescisão a pedido do empregado ou por iniciativa do empregador, com justa causa, no caso de empregado não optante, com menos de um ano de serviço';
                break;
            case 'L':
                ret = 'Outros motivos de rescisão do contrato de trabalho';
                break;
            case 'S2':
                ret = 'Falecimento';
                break;
            case 'S3':
                ret = 'Falecimento motivado por acidente de trabalho';
                break;
            case 'U1':
                ret = 'Aposentadoria';
                break;
            case 'U3':
                ret = 'Aposentadoria por invalidez';
                break;
            default:
                ret
                break;
        }
        return ret;
    }
}