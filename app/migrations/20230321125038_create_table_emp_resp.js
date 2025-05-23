const { migrationClientSchema } = require('../.env')

exports.up = function(knex) {
    return knex.schema.createTable(migrationClientSchema + '.emp_resp', table => {
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
        table.string('complemento', 255).comment("Complemento")
        table.string('d_nascimento', 255).notNull().comment("Data de Nascimento") 
        
        table.foreign('id_emp').references('id').inTable('wwmgca_app.empresa').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_local_params_tipo').references('id').inTable('local_params').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_cidade').references('id').inTable('wwmgca_app.cad_cidades').onUpdate('CASCADE').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable(migrationClientSchema + '.emp_resp')
};