
/**
 * Tipos possívels de status de usuários
 */
module.exports = {
    STATUS_INACTIVE: 0,
    STATUS_SUSPENDED_BY_TKN: 8,
    STATUS_SUSPENDED: 9,
    STATUS_ACTIVE: 10,
    STATUS_PASS_EXPIRED: 19,
    STATUS_DELETE: 99,
    MINIMUM_KEYS_BEFORE_CHANGE: 3, // Não pode repetiar a últimas X senhas
    TOKEN_VALIDE_MINUTES: 10 // 10 minutos de validade
}