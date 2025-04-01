const { migrationClientSchema } = require('../.env')

exports.up = function(knex) {
    return knex.schema.createTable(migrationClientSchema + '.siafic_empenho', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.integer('id_unidade_gestora').unsigned().notNull()
        table.string('mes').notNull().notNull()
        table.string('ano').notNull().notNull()
        table.decimal('desapropriacao_decimo', 11, 2).notNull()
        table.decimal('desapropriacao_ferias', 11, 2).notNull()
    })
};

exports.down = function (knex) {
    return knex.schema.dropTable(migrationClientSchema + '.siafic_empenho')
};
