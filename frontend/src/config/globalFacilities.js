import StringMask from "string-mask";

/**
 * Cria um array de meses de 01 a 12
 * O objetivo é ser usado em form-selects
 */
export const monthsList = [
    { value: "01", text: "01-Janeiro" },
    { value: "02", text: "02-Fevereiro" },
    { value: "03", text: "03-Março" },
    { value: "04", text: "04-Abril" },
    { value: "05", text: "05-Maio" },
    { value: "06", text: "06-Junho" },
    { value: "07", text: "07-Julho" },
    { value: "08", text: "08-Agosto" },
    { value: "09", text: "09-Setembro" },
    { value: "10", text: "10-Outubro" },
    { value: "11", text: "11-Novembro" },
    { value: "12", text: "12-Dezembro" }
]

/**
 * Capitular todas as palavras de uma String
 * @param {*} str 
 * @returns 
 */
export function titleCase(str) {
    let splitStr = str.toLowerCase().split(' ');
    const pular = ['de', 'da', '']
    for (var i = 0; i < splitStr.length; i++) {
        if (!(pular.includes(splitStr[i])))
            splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }
    return splitStr.join(' ');
}

export function getDecimalFormater(value) {
    var formatter = new StringMask("#.##0,00", { reverse: true });
    const valueF = Math.round(value * 10000) / 100;
    return formatter.apply(valueF);
}

export function formatSize(value) {
    let res = Math.floor(value / 1000);
    if (Math.floor(value / 1000) === 0) {
        res = `${value}b`;
    } else if (Math.floor(value / 1000000000) > 1) {
        res = `${Math.round((value / 1000000000) * 100) / 100}gb`;
    } else if (Math.floor(value / 1000000) > 1) {
        res = `${Math.round((value / 1000000) * 100) / 100}mb`;
    } else {
        res = `${res}kb`;
    }
    return res;
}

/**
 * Capitula a posição 0 da String
 * @param {*} value 
 * @returns 
 */
export function capitalizeFirst(value) {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value
}

export function extractContent(s) {
    var span = document.createElement("span");
    span.innerHTML = s;
    return span.textContent || span.innerText;
}

export const datePickerLocale = {
    pt: {
        labelPrevDecade: 'Década Anterior',
        labelPrevYear: 'Ano anterior',
        labelPrevMonth: 'Mês anterior',
        labelCurrentMonth: 'Mês atual',
        labelNextMonth: 'Próximo mês',
        labelNextYear: 'Próximo ano',
        labelNextDecade: 'Próxima década',
        labelToday: 'Hoje',
        labelSelected: 'Data selecionada',
        labelNoDateSelected: 'Selecione uma data',
        labelCalendar: 'Calendário',
        labelNav: 'Navegação no calendário',
        labelHelp: 'Use as setas do teclado para navegar pelo calendário'
    },
}

export function emailOrError(email) {
    const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegexp.test(email)
}
export function isNumber(input) {
    input = (input) ? input : window.event;
    var charCode = (input.which) ? input.which : input.keyCode;
    if ((charCode > 31 && (charCode < 48 || charCode > 57))) {
        input.preventDefault();
    } else {
        return true;
    }
}

export default {
    monthsList,
    titleCase,
    getDecimalFormater,
    formatSize,
    capitalizeFirst,
    extractContent,
    datePickerLocale,
    emailOrError,
    isNumber
}