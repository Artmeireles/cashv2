const { db } = require('../.env')

exports.up = function (knex, Promise) {
    return knex.schema.createTable(db.database+ '.params', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.string('dominio').notNull().comment('dominio do usuário')
        table.string('meta').notNull()
        table.string('value').notNull()
        table.string('label')
    })
};

exports.down = function (knex, Promise) {
    return knex.schema.dropTable('params')
};