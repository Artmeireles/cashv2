const { migrationClientSchema } = require('../.env')

exports.up = function(knex) {
    return knex.schema.createTable(migrationClientSchema + '.con_contratos', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(9)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.string('token').notNull().unique()
        table.integer('id_user').notNull()
        table.integer('id_consign').notNull().unsigned()
        table.integer('id_serv').notNull().unsigned()
        table.string('contrato').notNull()
        table.string('primeiro_vencimento').notNull()
        table.decimal('valor_parcela', 11, 2).notNull()
        table.string('parcela').notNull()
        table.string('parcelas').notNull()
        table.decimal('valor_total', 11, 2).notNull()
        table.decimal('valor_liquido', 11, 2).notNull()
        table.string('qmar').notNull().comment('Quitação mínima (parcelas) antes da renovação')
        table.boolean('averbado_online')
        table.string('data_averbacao')
        table.string('data_liquidacao')

        table.foreign('id_serv').references('id').inTable('servidores').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_consign').references('id').inTable('con_consign').onUpdate('CASCADE').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable(migrationClientSchema + '.con_contratos')
};