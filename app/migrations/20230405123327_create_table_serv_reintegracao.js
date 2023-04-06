exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_maribondo_ativos.serv_reintegracao', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.integer('id_serv_vinc').notNull().unsigned().comment("Vinculos")
        table.integer('id_par_tp_rein').notNull().unsigned().comment("Tipo da Reintegração")
        table.string('nr_proc_jud', 20).notNull().comment("Número do Processo")
        table.string('nr_lei_anistia', 13).notNull().comment("Número da Anistia")
        table.specificType('dt_efet_retorno', 'char(10)').notNull().comment("Data Efetivo Retorno")
        table.specificType('dt_i_efeito', 'char(10)').notNull().comment("Data Início dos Efeitos")
        table.string('obs', 255).comment("Observação")
        
        table.foreign('id_serv_vinc').references('id').inTable('serv_vinculos').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_par_tp_rein').references('id').inTable('wwmgca_api.params').onUpdate('CASCADE').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_maribondo_ativos.serv_reintegracao')
};