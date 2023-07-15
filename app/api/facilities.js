
const { log } = require("console");
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

    const getIdParam = async (meta, value) => {
        const tabelaDomain = `${dbPrefix}_app.params`
        // console.log(meta, value);
        // console.log(app.db(tabelaDomain).select('id').where({ 'meta': meta, 'value': value }).first().toString());
        let body = { id: 0 }
        const param = await app.db(tabelaDomain).select('id').where({ 'meta': meta, 'value': value }).first()
        if (param) return param.id
        else undefined
    }

    const getIdCidade = async (ibge) => {
        const tabelaDomain = `${dbPrefix}_app.cad_cidades`
        const param = await app.db(tabelaDomain).select('id').where({ 'municipio_id': ibge }).first()
        if (param) return param.id
        else undefined
    }

    const getIdCargos = async (value, schema) => {
        const tabelaDomain = `${dbPrefix}_${schema.cliente}_${schema.dominio}.aux_cargos`
        const param = await app.db(tabelaDomain).select('id').where({ 'nome': value }).first()
        if (param) return param.id
        else undefined
    }

    const getIdRubricas = async (value, schema, perApur) => {
        const tabelaDomain = `${dbPrefix}_${schema.cliente}_${schema.dominio}.fin_rubricas`
        const param = await app.db(tabelaDomain).select('id')
            .where(function () {
                this.where('cod_rubr', value)
                    .andWhere('ini_valid', '<=', `${perApur.substring(0, 4)}-${perApur.substring(5, 6)}`)
            }).first()
        if (param) return param.id
        else undefined
    }

    function countOccurrences(str, term) { return str.split(term).length - 1 }

    // TODO: Receber uma string tipo key=value, e após um split na string, se o 
    // valor de [0] for igual à posição [0] da string, retornar uma propriedade
    // json contendo a chave e o valor
    function parseKeyValueFromString(str, key) {
        const [k, v] = str.split('=');
        if (k === key) return { [k]: v };
        return null;
    }

    // TODO: Receber uma string tipo key=value, e após um split na string, se o 
    // valor de [0] for igual à posição [0] da string, retornar o valor de key
    // ou retornar a key caso o parâmetro type seja igual a 'key'
    function getValueFromKeyPairString(str, key, type = 'value') {
        const [k, v] = str.split('=');
        if (k === key) return type == 'key' ? k : v;
        return null;
    }

    // TODO: Receber uma string tipo key=value, e após um split na string, 
    // retornar o value ou retornar a key caso o parâmetro type seja igual a 'key'
    function getRawValueFromKeyPairString(str, type = 'value') {
        const [k, v] = str.split('=');
        return type == 'key' ? k : v;
    }

    return {
        capitalizeFirstLetter, titleCase, removeAccents, removeAccentsObj,
        numbersOrZero, changeUpperCase, diffInDays, encryptPassword, comparePassword,
        convertESocialTextToJson, getIdParam, getIdCidade, getIdCargos, getIdRubricas,
        countOccurrences, parseKeyValueFromString, getRawValueFromKeyPairString,
        getValueFromKeyPairString
    }
}