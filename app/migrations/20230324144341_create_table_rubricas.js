exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_maribondo_ativos.rubricas', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.integer('id_emp').notNull().unsigned().comment("Órgão")
        table.string('cod_rubr', 30).notNull().comment("Código da Rúbrica")
        table.string('ini_valid', 7).notNull().comment("Início da Validade das Informações")
        table.string('dsc_rubr', 100).notNull().comment("Descrição (nome) da Rubrica ")
        table.integer('id_param_nat_rubr').notNull().unsigned().comment("Natureza Rubrica")
        table.integer('id_param_tipo').notNull().unsigned().comment("Tipo Rubrica")
        table.integer('id_param_cod_inc_cp').notNull().unsigned().comment("Código de Incidência Tributária")
        table.integer('id_param_cod_inc_irrf').notNull().unsigned().comment("Código de Incidência IRRF")
        table.integer('id_param_cod_inc_fgts').notNull().unsigned().comment("Código de Incidência FGTS")
        table.integer('id_param_cod_inc_cprp').notNull().unsigned().comment("Código de Incidência RPPS")
        table.boolean('teto_remun').notNull().comment("S-Sim, N-Não")
        table.string('observacao', 255).comment("Informações Relacionadas a Rubrica")
        
        table.foreign('id_emp').references('id').inTable('empresa').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_param_nat_rubr').references('id').inTable('wwmgca_api.params').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_param_tipo').references('id').inTable('wwmgca_api.params').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_param_cod_inc_cp').references('id').inTable('wwmgca_api.params').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_param_cod_inc_irrf').references('id').inTable('wwmgca_api.params').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_param_cod_inc_fgts').references('id').inTable('wwmgca_api.params').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_param_cod_inc_cprp').references('id').inTable('wwmgca_api.params').onUpdate('CASCADE').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_maribondo_ativos.rubricas')
};