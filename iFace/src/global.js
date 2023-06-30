
export const userKey = '__cash_user'
export const appName = 'Cash'
export const dbPrefix = 'wwmgca'
export const noPermissAccess = 'Ops!!! Parece que seu perfil não dá acesso a essa operação'

export function isValidEmail(email) {
  const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegexp.test(email)
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

export function capitalizeFirst(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value
}

export function titleCase(str) {
  let splitStr = str.toLowerCase().split(' ');
  const pular = ['de', 'da', '']
  for (var i = 0; i < splitStr.length; i++) {
    if (!(pular.includes(splitStr[i])))
      splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  return splitStr.join(' ');
}


/**
 * Tipos possívels de status de usuários
 */
export const STATUS_INACTIVE = 0
export const STATUS_WAITING = 1
export const STATUS_SUSPENDED_BY_TKN = 8
export const STATUS_SUSPENDED = 9
export const STATUS_ACTIVE = 10
export const STATUS_PASS_EXPIRED = 19
export const STATUS_DELETE = 99
export const MINIMUM_KEYS_BEFORE_CHANGE = 3 // Não pode repetiar a últimas X senhas
export const TOKEN_VALIDE_MINUTES = 10 // 10 minutos de validade

export default {
  userKey, appName, dbPrefix, noPermissAccess,
  isValidEmail, highlight, removeMark, downloadFile,
  setValidCep, titleCase, STATUS_INACTIVE, STATUS_WAITING,
  STATUS_SUSPENDED_BY_TKN, STATUS_SUSPENDED, STATUS_ACTIVE,
  STATUS_PASS_EXPIRED, STATUS_DELETE, MINIMUM_KEYS_BEFORE_CHANGE,
  TOKEN_VALIDE_MINUTES
}