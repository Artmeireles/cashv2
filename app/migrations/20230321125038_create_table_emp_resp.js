exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_maribondo_ativos.emp_resp', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.integer('id_emp').notNull().unsigned().comment("Empresa")
        table.integer('id_local_params_tipo').notNull().unsigned().comment("Gestor, Controlador, Contador, DIRF, SIAP, MANAD, SEFIP")
        table.string('nr_insc', 14).notNull().comment("CPF ou CNPJ do responsável")
        table.string('crc', 14).comment("CRC")
        table.string('nome', 255).notNull().comment("Nome do Orgão")
        table.integer('id_cidade').notNull().unsigned().comment("Cidade")
        table.string('cep', 10).notNull().comment("CEP")
        table.string('bairro', 255).notNull().comment("Bairro")
        table.string('logradouro', 255).notNull().comment("Logradouro")
        table.string('nr', 255).notNull().comment("Número")
        table.string('complemento', 255).notNull().comment("Complemento")
        table.string('d_nascimento', 255).comment("Data de Nascimento") //char(10)
        
        table.foreign('id_emp').references('id').inTable('empresa').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_local_params_tipo').references('id').inTable('es_params').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_cidade').references('id').inTable('wwmgca_api.cidades').onUpdate('CASCADE').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_maribondo_ativos.emp_resp')
};