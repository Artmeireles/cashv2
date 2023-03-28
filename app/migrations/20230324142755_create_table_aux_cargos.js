exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_maribondo_ativos.aux_cargos', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.string('nome', 100).notNull().comment("Nome do Cargo")
        table.string('cbo', 6).notNull().comment("Código CBO")
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_maribondo_ativos.aux_cargos')
};