exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_cliente_ativos.es_rejeicoes', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.integer('id_es_envio').notNull().unsigned().comment("eSocial Envios")
        table.integer('rejeicao_id').notNull().comment("ID da Rejeição de acordo com erro")
        table.integer('codigo').notNull().comment("Código da Rejeição")
        table.string('ocorrencia', 255).comment("Ocorrência da Rejeição, descrição do erro")

        table.foreign('id_es_envio').references('id').inTable('es_envios').onUpdate('CASCADE').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_cliente_ativos.es_rejeicoes')
};