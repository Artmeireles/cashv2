exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_cliente_ativos.local_params', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.string('grupo').comment("Grupo")
        table.string('parametro').comment("Parâmetro")
        table.string('label').comment("Label")
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_cliente_ativos.local_params')
};