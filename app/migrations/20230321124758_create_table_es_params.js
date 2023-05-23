exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_cliente_ativos.es_params', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.boolean('ambiente').comment("1-Produção, 2-Homologação")
        table.string('cnpj_sh', 14).notNull().comment("CNPJ")
        table.string('token_sh', 255).notNull().comment("Token sh")
        table.string('ver_process', 255).notNull().default('S.01.01.00').comment("Versão do Processo")
        table.integer('id_emp').notNull().unsigned().comment("Empresa")
        table.string('cnpj_transmissor', 14).notNull().comment("CNPJ Transmissor")
        table.string('cnpj_efr', 14).notNull().comment("CNPJ Ente Federativo")
        
        table.foreign('id_emp').references('id').inTable('wwmgca_api.empresa').onUpdate('CASCADE').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_cliente_ativos.es_params')
};