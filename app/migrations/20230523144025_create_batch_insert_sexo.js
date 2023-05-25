/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    const sexo = [
        {
            dominio: 'root',
            meta: 'sexo',
            value: 'F',
            label: 'Feminino'
        },
        {
            dominio: 'root',
            meta: 'sexo',
            value: 'M',
            label: 'Masculino'
        }
    ]
    return knex('params').insert(sexo)
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.table('users', function (table) {
        table.dropColumn('time_to_pas_expires');
    })

};