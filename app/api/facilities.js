
const { dbPrefix } = require("../.env")

module.exports = app => {
    const bcrypt = require('bcrypt')

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function titleCase(str) {
        let splitStr = str.toLowerCase().split(' ');
        const pular = ['de', 'da', 'do', '']
        for (var i = 0; i < splitStr.length; i++) {
            if (!(pular.includes(splitStr[i])))
                splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
        }
        return splitStr.join(' ');
    }

    function numbersOrZero(value) {
        let ret = value || "0"
        ret = ret.toString().replace(/([^\d])+/gim, "")
        if (ret.length = 0) ret = "0"
        return ret
    }

    function removeAccents(value) {
        let ret = value || ""
        ret = ret.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        ret = ret.replace('/[áàãâä]/ui', 'a');
        ret = ret.replace('/[éèêë]/ui', 'e');
        ret = ret.replace('/[íìîï]/ui', 'i');
        ret = ret.replace('/[óòõôö]/ui', 'o');
        ret = ret.replace('/[úùûü]/ui', 'u');
        ret = ret.replace('/[ç]/ui', 'c');
        ret = ret.replace('/[^a-z0-9]/i', '_');
        ret = ret.replace('/_+/', '_');
        // ret = ret.replaceAll('º', 'o')
        return ret
    }

    function removeAccentsObj(key, value) {
        return key != 'email' && typeof value === 'string'
            ? Array.from(value, removeAccents).join('')
            : value
    }

    function uc(objeto) {
        return objeto >= 'a' && objeto <= 'z'
            ? String.fromCharCode(objeto.charCodeAt() - 32)
            : objeto
    }

    function changeUpperCase(key, value) {
        return key != 'email' && typeof value === 'string'
            ? Array.from(value, uc).join('')
            : value
    }

    function diffInDays(dateStr, days) {
        // Converte a string em uma instância de Date
        const date = new Date(dateStr);

        // Obtem a diferença de tempo em milissegundos entre as duas datas
        const diffTime = Math.abs(Date.now() - date.getTime());

        // Converte a diferença de tempo em dias
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Retorna `true` se a diferença em dias for maior ou igual a `days` ou apenas a diferença se days não for declarado
        if (!days) return diffDays;
        else return diffDays >= days;
    }

    function encryptPassword(password) {
        const salt = bcrypt.genSaltSync(10)
        return bcrypt.hashSync(password, salt)
    }

    function comparePassword(password, comparePassword) {
        return bcrypt.compareSync(password, comparePassword)
    }

    function convertESocialTextToJson(body) {
        const querystring = require('querystring');
        const jsonData = querystring.parse(body, '\r\n', '=');
        return JSON.parse(JSON.stringify(jsonData))
    }

    function getIdParam(meta, value) {
        const tabelaDomain = `${dbPrefix}_api.params`
        const param = app.db(tabelaDomain).select('id').where({ 'meta': meta, 'value': value }).first()
        return param.id || 0
    }

    function getIdCidade(ibge) {
        const tabelaDomain = `${dbPrefix}_api.cad_cidades`
        const param = app.db(tabelaDomain).select('id').where({ 'ibge': ibge }).first()
        return param.id || 0
    }

    function getIdCargos(nome) {
        const tabelaDomain = `${dbPrefix}_cliente_ativos.aux_cargos`
        const param = app.db(tabelaDomain).select('id').where({ 'nome': nome }).first()
        return param.id || 0
    }

    return {
        capitalizeFirstLetter, titleCase, removeAccents, removeAccentsObj,
        numbersOrZero, changeUpperCase, diffInDays, encryptPassword, comparePassword,
        convertESocialTextToJson, getIdParam, getIdCidade, getIdCargos
    }
}