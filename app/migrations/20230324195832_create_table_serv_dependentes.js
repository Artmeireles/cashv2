const { migrationClientSchema } = require('../.env')

exports.up = function(knex) {
    return knex.schema.createTable(migrationClientSchema + '.serv_dependentes', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.integer('id_serv').notNull().unsigned().comment("Servidor")
        table.integer('id_param_tp_dep').notNull().unsigned().comment("Tipo de Dependente")
        table.string('nome', 70).notNull().comment("Nome do Dependente")
        table.specificType('data_nasc', 'char(10)').notNull().comment("Data de Nascimento")
        table.string('cpf').comment("CPF do Dependente")
        table.integer('id_param_sexo').notNull().unsigned().comment("Sexo do Dependente")
        table.string('dep_irrf', 1).notNull().comment("S-Sim, N-Não / Dedução pelo Imposto de Renda")
        table.string('dep_sf', 1).notNull().comment("S-Sim, N-Não / Recebimento do Salário Família")
        table.string('inc_trab', 1).notNull().comment("S-Sim, N-Não / Incapacidade Física ou Mental")
        table.specificType('dt_limite_prev', 'char(10)').comment("Data Limite Prev")
        table.specificType('dt_limite_irpf', 'char(10)').comment("Data Limite IRPF")
        table.string('certidao', 255).comment("Certidão de Nascimento")
        table.string('cert_livro', 255).comment("Certidão Livro")
        table.string('cert_folha', 255).comment("Certidão Folha")
        table.specificType('dt_cert', 'char(10)').comment("Data da Certidão")
        table.boolean('cart_vacinacao').comment("Certificado de Vacinação")
        table.boolean('declaracao_escolar').comment("Declaração Escolar")

        table.foreign('id_serv').references('id').inTable('servidores').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_param_tp_dep').references('id').inTable('wwmgca_app.params').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_param_sexo').references('id').inTable('wwmgca_app.params').onUpdate('CASCADE').onDelete('NO ACTION')
        table.unique(['id_serv', 'cpf'])
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable(migrationClientSchema + '.serv_dependentes')
};