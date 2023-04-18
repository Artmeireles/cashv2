exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users', table => {
        table.boolean('cad_orgao').notNull().defaultTo(0).after('con_contratos')
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.alterTable('users', table => {
        table.string('cad_orgao').delete()
    })
};