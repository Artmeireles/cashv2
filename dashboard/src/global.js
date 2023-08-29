export const userKey = '__cash_user';
export const glKey = '__gl_user';
export const appName = 'Cash';
export const softwareHouse = 'Mega Assessoria';
export const dbPrefix = 'wwmgca';
export const noPermissAccess = 'Ops!!! Parece que seu perfil não dá acesso a essa operação';

export function isValidEmail(email) {
    const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegexp.test(email);
}

export function highlight(value, markTxt) {
    let target = value;
    let targetMark = markTxt.toString().trim().replace(/\s\s+/g, ' ').split(' ');
    targetMark.forEach((elementMark) => {
        if (!['m', 'M'].includes(elementMark.toString().substring(0))) target = target.replaceAll(elementMark, `<mark class="foundMark">${elementMark}</mark>`);
    });
    return target;
}

export function removeMark(text) {
    return text.toString().replaceAll('<mark class="foundMark">', '').replaceAll('</mark>', '');
}

export function downloadFile(linkSource, fileName) {
    const linkUrl = linkSource.replaceAll(' ', '%20');
    const file = fileName.replaceAll(' ', '%20');
    const downloadLink = document.createElement('a');
    downloadLink.href = linkUrl;
    downloadLink.download = file;
    downloadLink.click();
}

export function setValidCep(cep) {
    const res = {
        cepClass: undefined,
        isCep: false
    };
    if (cep && cep.length > 0) {
        if (cep.length == 8) {
            res.cepClass = 'is-valid';
            res.isCep = true;
        } else {
            res.cepClass = 'is-invalid';
            res.isCep = false;
        }
    } else {
        res.cepClass = undefined;
        res.isCep = false;
    }
    return res;
}

export function capitalizeFirst(value) {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

export function titleCase(str) {
    if (str) {
        let splitStr = str.toLowerCase().split(' ');
        const pular = ['de', 'da', 'do', 'e'];
        for (var i = 0; i < splitStr.length; i++) {
            if (!pular.includes(splitStr[i])) splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
        }
        return splitStr.join(' ');
    } else return str;
}

// TODO: criar uma função que converta de string "0" ou "1" para booleano
export function stringToBoolean(string) {
    switch (string.toLowerCase().trim()) {
        case '1':
            return true;
        case '0':
            return false;
        default:
            return undefined;
    }
}

// Um array com todos os estados do Brasil
export const UFS = [
    { value: 'AC', label: 'Acre' },
    { value: 'AL', label: 'Alagoas' },
    { value: 'AP', label: 'Amapá' },
    { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' },
    { value: 'CE', label: 'Ceará' },
    { value: 'DF', label: 'Distrito Federal' },
    { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' },
    { value: 'AC', label: 'Acre-AC' },
    { value: 'AL', label: 'Alagoas-AL' },
    { value: 'AM', label: 'Amazonas-AM' },
    { value: 'AP', label: 'Amapa-AP' },
    { value: 'BA', label: 'Bahia-BA' },
    { value: 'CE', label: 'Ceara-CE' },
    { value: 'DF', label: 'Distrito Federal-DF' },
    { value: 'ES', label: 'Espirito Santo-ES' },
    { value: 'GO', label: 'Goias-GO' },
    { value: 'MA', label: 'Maranhao-MA' },
    { value: 'MG', label: 'Minas Gerais-MG' },
    { value: 'MS', label: 'Mato Grosso do Sul-MS' },
    { value: 'MT', label: 'Mato Grosso-MT' },
    { value: 'PA', label: 'Para-PA' },
    { value: 'PB', label: 'Paraiba-PB' },
    { value: 'PE', label: 'Pernambuco-PE' },
    { value: 'PI', label: 'Piaui-PI' },
    { value: 'PR', label: 'Parana-PR' },
    { value: 'RJ', label: 'Rio de Janeiro-RJ' },
    { value: 'RN', label: 'Rio Grande do Norte-RN' },
    { value: 'RO', label: 'Rondonia-RO' },
    { value: 'RR', label: 'Roraima-RR' },
    { value: 'RS', label: 'Rio Grande do Sul-RS' },
    { value: 'SC', label: 'Santa Catarina-SC' },
    { value: 'SE', label: 'Sergipe-SE' },
    { value: 'SP', label: 'Sao Paulo-SP' },
    { value: 'TO', label: 'Tocantins-TO' }
];

/**
 * Tipos possívels de status de usuários
 */
export const STATUS_INACTIVE = 0;
export const STATUS_WAITING = 1;
export const STATUS_SUSPENDED_BY_TKN = 8;
export const STATUS_SUSPENDED = 9;
export const STATUS_ACTIVE = 10;
export const STATUS_PASS_EXPIRED = 19;
export const STATUS_DELETE = 99;
export const MINIMUM_KEYS_BEFORE_CHANGE = 3; // Não pode repetiar a últimas X senhas
export const TOKEN_VALIDE_MINUTES = 10; // 10 minutos de validade

export default {
    userKey,
    glKey,
    appName,
    dbPrefix,
    noPermissAccess,
    isValidEmail,
    highlight,
    removeMark,
    downloadFile,
    setValidCep,
    titleCase,
    stringToBoolean,
    STATUS_INACTIVE,
    STATUS_WAITING,
    STATUS_SUSPENDED_BY_TKN,
    STATUS_SUSPENDED,
    STATUS_ACTIVE,
    STATUS_PASS_EXPIRED,
    STATUS_DELETE,
    MINIMUM_KEYS_BEFORE_CHANGE,
    TOKEN_VALIDE_MINUTES,
    UFS
};
