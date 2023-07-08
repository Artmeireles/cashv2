const { cpf, cnpj } = require('cpf-cnpj-validator')
const { dbPrefix } = require("../.env")

module.exports = app => {

    const noAccessMsg = 'Ops!!! Parece que seu perfil não dá acesso a essa operação'

    function cpfOrError(value, msg) {
        if (!cpf.isValid(value)) throw msg ? msg : "CPF inválido"
    }

    function cpfOrMsgError(value, msg) {
        if (!cpf.isValid(value)) return msg ? msg : "CPF inválido, "
    }

    function cnpjOrError(value, msg) {
        if (!cnpj.isValid(value)) throw msg ? msg : "CNPJ inválido"
    }

    function lengthOrError(value, lengthCompare, msg) {
        if (value.length != lengthCompare) throw msg
    }

    function existsOrError(value, msg) {
        if (!value) throw msg
        if (typeof value === 'string' && !value.trim().length > 0) throw msg
        if (Array.isArray(value) && value.length === 0) throw msg
    }

    function existsOrMsgError(value, msg) {
        if (!value) return msg + ', '
        if (typeof value === 'string' && !value.trim().length > 0) return msg + ', '
        if (Array.isArray(value) && value.length === 0) return msg + ', '
    }

    function isBooleanOrError(value) {
        return (typeof value === 'boolean' && !(value === true || value === false))
    }

    function booleanOrError(value, msg) {
        if (!isBooleanOrError) throw msg
    }

    function valueOrError(value, msg) {
        if (!value) throw msg
        if (value.isNan) throw msg
        if (value < 0.01) throw msg
    }

    function valueMinorOrError(valueMinor, value, msg) {
        valueOrError(value, msg)
        valueOrError(valueMinor, msg)
        if (valueMinor > value) throw msg
    }

    function notExistsOrError(value, msg) {
        try {
            existsOrError(value, msg)
        } catch (error) {
            return
        }
        throw msg
    }
    function notExistsOrMsgError(value, msg) {
        try {
            existsOrError(value, msg)
        } catch (error) {
            return
        }
        return msg + ', '
    }

    function equalsOrError(valueA, valueB, msg) {
        if (valueA !== valueB) throw msg
    }

    function diffOrError(valueA, valueB, msg) {
        if (valueA == valueB) throw msg
    }

    function isMatchOrError(value, msg) {
        if (!value) throw msg
    }

    function isValidEmail(value) {
        const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegexp.test(value)
    }

    function isEmailOrError(value, msg) {
        if (!isValidEmail(value)) throw msg
    }

    async function isParamOrError(meta, id) {
        const param = await app.db(`${dbPrefix}_app.params`)
            .where({ 'status': 10, 'dominio': 'root', 'meta': meta, 'id': id }).first()
        if (param && param.id > 0) return true
    }

    async function isCityOrError(id) {
        const param = await app.db(`${dbPrefix}_app.cad_cidades`)
            .where({ 'id': id }).first()
        if (param && param.id > 0) return true
    }

    function isValidCelPhone(value) {
        celular = value.replace(/([^\d])+/gim, "");
        return celular.match(/^([14689][0-9]|2[12478]|3([1-5]|[7-8])|5([13-5])|7[193-7])9[0-9]{8}$/)
    }

    function isCelPhoneOrError(value, msg) {
        if (!isValidCelPhone(value)) throw msg
    }

    function validatePassword(value) {
        return value.match(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+={[}\]|:;"'<,>.?/\\])(?!.*['"`])(?!.*\s)(?!.*(.)\1)(?!.*(?:123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz))[A-Za-z\d!@#$%^&*()_+={[}\]|:;"'<,>.?/\\]{8,}$/)
    }

    return {
        noAccessMsg, cpfOrError, cpfOrMsgError, cnpjOrError, lengthOrError, existsOrError, existsOrMsgError, isBooleanOrError, booleanOrError, valueOrError,
        valueMinorOrError, notExistsOrError, notExistsOrMsgError, equalsOrError, diffOrError, isMatchOrError,
        isValidEmail, isEmailOrError, isParamOrError, isCityOrError, isValidCelPhone, isCelPhoneOrError,
        validatePassword
    }
}