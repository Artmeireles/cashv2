exports.up = function(knex) {
    /**
     * Tabela 2400 do eSocial
     */
    return knex.schema.createTable('wwmgca_cliente_ativos.beneficiarios', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.integer('id_serv').notNull().unsigned().comment("Servidor").references('id').inTable('servidores').onUpdate('CASCADE').onDelete('NO ACTION')
        table.specificType('dt_inicio', 'char(10)').notNull().comment("Data de início do cadastro do beneficiário")
        table.string('inc_fis_men', 1).notNull().comment("Doença incapacitante")
        table.specificType('dt_inc_fis', 'char(10)').comment("Data reconhecimento da incapacidade")
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_cliente_ativos.beneficiarios')
};