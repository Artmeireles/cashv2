const { migrationClientSchema } = require('../.env')

exports.up = function(knex) {
    return knex.schema.createTable(migrationClientSchema + '.aux_departamentos', table => {
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
    return knex.schema.dropTable(migrationClientSchema + '.aux_departamentos')
};