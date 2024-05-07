exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_cliente_ativos.emp_ua', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.integer('id_emp').notNull().unsigned().comment("Orgão")
        table.string('c_ua', 10).notNull().comment("Código Unidade Autonoma")
        table.string('cardug', 6).notNull().comment("CARDUG")
        table.string('cnpj', 14).notNull().comment("CNPJ")
        table.string('nome', 255).notNull().comment("Nome do Orgão")
        table.integer('id_cidade').notNull().unsigned().comment("Cidade")        
        table.string('cep', 10).notNull().comment("CEP")
        table.string('bairro', 255).notNull().comment("Bairro")
        table.string('logradouro', 255).notNull().comment("Logradouro")
        table.string('nr', 255).notNull().comment("Número")
        table.string('complemento', 255).notNull().comment("Complemento")
        table.integer('id_emp_resp').notNull().unsigned().comment("Orgão Responsável")        
        table.string('email', 255).notNull().comment("E-mail")
        table.string('telefone', 255).notNull().comment("Telefone")  

        table.foreign('id_emp').references('id').inTable('wwmgca_app.empresa').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_cidade').references('id').inTable('wwmgca_app.cad_cidades').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_emp_resp').references('id').inTable('emp_resp').onUpdate('CASCADE').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_cliente_ativos._emp_ua')
};