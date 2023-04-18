exports.up = function(knex, Promise) {
    return knex.schema.alterTable('wwmgca_maribondo_ativos.orgao', table => {
        table.string('cpf_resp_gestao')
        table.string('nome_resp_gestao')
        table.string('cpf_resp_contInt')
        table.string('nome_resp_contInt')
        table.string('cpf_resp_contabil')
        table.string('nome_resp_contabil')
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.alterTable('wwmgca_maribondo_ativos.orgao', table => {
        table.string('cpf_resp_gestao').delete()
        table.string('nome_resp_gestao').delete()
        table.string('cpf_resp_contInt').delete()
        table.string('nome_resp_contInt').delete()
        table.string('cpf_resp_contabil').delete()
        table.string('nome_resp_contabil').delete()
    })
};