exports.up = function(knex, Promise) {
    return knex.schema.createTable('users_keys', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.integer('id_users').unsigned().notNull()
        table.string('password').notNull()
        table.foreign('id_users').references('id').inTable('users').onUpdate('CASCADE').onDelete('CASCADE')
        table.unique(['password', 'id_users'])
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('users_keys')
};