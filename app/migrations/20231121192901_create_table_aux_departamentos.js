exports.up = function(knex) {
    /**
     * Tabela 2410 do eSocial
     */
    return knex.schema.createTable('wwmgca_cliente_ativos.aux_departamentos', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.string('nome').comment("Nome")
        table.string('id_siope').comment("SIOPE")
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_cliente_ativos.aux_departamentos')
};