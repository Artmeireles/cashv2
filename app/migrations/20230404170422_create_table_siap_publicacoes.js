exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_cliente_ativos.siap_publicacoes', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.specificType('data_pub', 'char(10)').notNull().comment("Data da Publicação")
        table.string('nr_pub', 14).notNull().comment("Número da Publicação")
        table.integer('id_param_v_pub').notNull().unsigned().comment("Veículo da Publicação")

        table.foreign('id_param_v_pub').references('id').inTable('wwmgca_app.params').onUpdate('CASCADE').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_cliente_ativos.siap_publicacoes')
};