exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_cliente_ativos.ben_vinculos', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.integer('id_benef').notNull().unsigned().comment("Beneficiário")
        table.string('nr_beneficio', 30).notNull().comment("Número do Benefício")
        table.integer('id_param_tp_benef').notNull().unsigned().comment("Tipo de Benefício")
        table.boolean('tp_plan_rp').notNull().default('0').comment("Plano Segregação da Massa")
        table.boolean('tp_pen_morte').notNull().comment("Tipo pensão por morte")
        table.string('cpf_inst', 11).notNull().comment("CPF do Instituidor")
        table.specificType('dt_inst', 'char(10)').notNull().comment("Data óbito do instituidor")


        table.foreign('id_benef').references('id').inTable('beneficiarios').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_param_tp_benef').references('id').inTable('wwmgca_app.params').onUpdate('CASCADE').onDelete('NO ACTION')
        
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_cliente_ativos.ben_vinculos')
};