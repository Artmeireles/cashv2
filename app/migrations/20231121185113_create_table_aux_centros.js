const { migrationClientSchema } = require('../.env')

exports.up = function(knex) {
    return knex.schema.createTable(migrationClientSchema + '.aux_centros', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.string('centro').notNull().comment("Centro")
        table.string('c_ua', 10).notNull().comment("Código Unidade Autonoma")
        table.string('cnpj_ua', 14).notNull().comment("CNPJ Unidade Autonoma")
        table.specificType('siap_data_criacao', 'char(10)').comment("Data de criação")
        table.specificType('siap_data_ato', 'char(10)').comment("Data do ato de criação")
        table.string('siap_ato').comment("Número do ato de criação")
        table.integer('id_param_v_pub').unsigned().comment("Veículo de Publicação do ato de criação")

        table.foreign('id_param_v_pub').references('id').inTable('wwmgca_app.params').onUpdate('CASCADE').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable(migrationClientSchema + '.aux_centros')
};