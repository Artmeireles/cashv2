exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_cliente_ativos.cad_bancos', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.string('febraban').notNull()
        table.string('nome').notNull()
        table.string('nomeAbrev')
        table.string('url_logo')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_cliente_ativos.cad_bancos')
};