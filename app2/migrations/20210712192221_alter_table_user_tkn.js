exports.up = function(knex, Promise) {
    return knex.schema.alterTable('users', table => {
        table.string('tkn_api')
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.alterTable('users', table => {
        table.string('tkn_api').delete()
    })
};