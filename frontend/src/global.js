import Vue from 'vue'

const path = require('path')

export const userKey = '__cash_user'
export const appName = 'Cash'
export const dbPrefix = 'wwmgca'
export const noPermissAccess = 'Ops!!! Parece que seu perfil não dá acesso a essa operação'
export const assets = path.join(__dirname, "../../public_html/assets/")

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
  
  export default {
    userKey,
    appName,
    dbPrefix,
    noPermissAccess,
    emailOrError,
    highlight,
    showError,
    removeMark,
    downloadFile,
    setValidCep
  }