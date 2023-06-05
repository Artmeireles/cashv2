exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_app.empresa', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.string('cliente').notNull()
        table.string('dominio').notNull()
        table.string('nr_insc', 14).notNull().comment("CPF ou CNPJ")
        table.string('cnpj_efr', 14).notNull().comment("CNPJ do Ente Federativo")
        table.integer('id_param_cl_trib').notNull().unsigned().comment("Classificação Tributária")
        table.boolean('ind_opt_reg_eletron').notNull().comment("Opção pelo Registro Eletrônico de Empregados")
        table.string('razao_social', 255).notNull().comment("Razão Social")
        table.integer('id_cidade').notNull().unsigned().comment("Cidade")
        table.string('cep', 10).notNull().comment("CEP")
        table.string('bairro', 255).notNull().comment("Bairro")
        table.string('logradouro', 255).notNull().comment("Logradouro")
        table.string('nr', 255).notNull().comment("Número")
        table.string('complemento', 255).comment("Complemento")
        table.string('email', 255).comment("E-mail")
        table.string('telefone', 255).comment("Telefone")
        table.string('codigo_fpas', 40).comment("Códigos e Alíquotas de FPAS")
        table.string('codigo_gps', 40).comment("Códigos GPS")
        table.string('codigo_cnae', 7).comment("Códigos Atividades Economicas")
        table.string('codigo_recolhimento', 500).comment("Código de Recolhimento")
        table.specificType('mes_descsindical', 'char(2)').comment("Mês Desconto Sindical")

        table.foreign('id_param_cl_trib').references('id').inTable('wwmgca_app.params').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_cidade').references('id').inTable('wwmgca_app.cidades').onUpdate('CASCADE').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_app.empresa')
};