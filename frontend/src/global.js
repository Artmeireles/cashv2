import Vue from 'vue'
import StringMask from "string-mask";

const path = require('path')

export const userKey = '__cash_user'
export const appName = 'Cash'
export const dbPrefix = 'wwmgca'
export const noPermissAccess = 'Ops!!! Parece que seu perfil não dá acesso a essa operação'
export const assets = path.join(__dirname, "../public/assets/")

export function showError(e) {
  if (e && e.response && e.response.data) {
    Vue.toasted.global.defaultError({ msg: e.response.data })
  } else if (typeof e === 'string') {
    Vue.toasted.global.defaultError({ msg: e })
  } else {
    Vue.toasted.global.defaultError()
  }
}

export function emailOrError(valueA) {
  const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegexp.test(valueA)
}

export function highlight(value, markTxt) {
  let target = value;
  let targetMark = markTxt
    .toString()
    .trim()
    .replace(/\s\s+/g, " ")
    .split(" ");
  targetMark.forEach((elementMark) => {
    if (!["m", "M"].includes(elementMark.toString().substring(0)))
      target = target.replaceAll(
        elementMark,
        `<mark class="foundMark">${elementMark}</mark>`
      );
  });
  return target;
}

export function removeMark(text) {
  return text
    .toString()
    .replaceAll('<mark class="foundMark">', "")
    .replaceAll("</mark>", "");
}

export function downloadFile(linkSource, fileName) {
  const linkUrl = linkSource.replaceAll(' ', '%20')
  const file = fileName.replaceAll(' ', '%20')
  // console.log(linkUrl, file);
  const downloadLink = document.createElement("a");
  downloadLink.href = linkUrl;
  downloadLink.download = file;
  downloadLink.click();
}

export function setValidCep(cep) {
  const res = {
    cepClass: undefined,
    isCep: false
  }
  if (cep && cep.length > 0) {
    if (cep.length == 8) {
      res.cepClass = "is-valid";
      res.isCep = true;
    } else {
      res.cepClass = "is-invalid";
      res.isCep = false;
    }
  } else {
    res.cepClass = undefined;
    res.isCep = false;
  }
  return res
}

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
  userKey, appName, dbPrefix, noPermissAccess,
  emailOrError, highlight, showError, removeMark,
  downloadFile, setValidCep, monthsList, titleCase,
  getDecimalFormater, formatSize, capitalizeFirst,
  emailOrError, isNumber
}