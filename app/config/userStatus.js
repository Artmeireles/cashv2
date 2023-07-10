
/**
 * Tipos possívels de status de usuários
 */
module.exports = {
    STATUS_INACTIVE: 0, // Perfil inativo
    STATUS_WAITING: 1, // Perfil aguardando o token de liberação
    STATUS_SUSPENDED_BY_TKN: 8, // Perfil suspenso por envio de token
    STATUS_SUSPENDED: 9, // Perfil suspenso
    STATUS_ACTIVE: 10, // Usuário ok
    STATUS_PASS_EXPIRED: 19, // Senha expirada por tempo de criação
    STATUS_DELETE: 99, // Usuário excluído
    MINIMUM_KEYS_BEFORE_CHANGE: 3, // Não pode repetiar a últimas X senhas
    TOKEN_VALIDE_MINUTES: 10 // 10 minutos de validade
}