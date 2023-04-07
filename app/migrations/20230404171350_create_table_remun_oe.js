exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_cliente_ativos.remun_oe', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.integer('id_serv_vinc').notNull().unsigned().comment("Vinculos")
        table.integer('id_param_ind_mv').notNull().unsigned().comment("Indicador de Desconto")
        table.string('nr_insc').notNull().comment("CPF ou CNPJ")
        table.integer('id_param_cod_categ').notNull().unsigned().comment("Código da Categoria ")
        table.string('vlr_remun_oe').notNull().comment("Valor da Remuneração")

        table.foreign('id_serv_vinc').references('id').inTable('serv_vinculos').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_param_ind_mv').references('id').inTable('wwmgca_api.params').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_param_cod_categ').references('id').inTable('wwmgca_api.params').onUpdate('CASCADE').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_cliente_ativos.remun_oe')
};