const { migrationClientSchema } = require('../.env')

exports.up = function(knex) {
    return knex.schema.createTable(migrationClientSchema + '.aux_classes', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.integer('id_pccs').notNull().unsigned().comment("Plano, Cargos, Carreira e Salários")
        table.string('classe').comment("Classe")
        table.string('i_ano_inicial').comment("Ano Inicial")
        table.string('i_ano_final').comment("Ano Final")

        table.unique(['id_pccs', 'classe'])
        table.foreign('id_pccs').references('id').inTable('aux_pccs').onUpdate('CASCADE').onDelete('NO ACTION')        
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable(migrationClientSchema + '.aux_classes')
};