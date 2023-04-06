exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_maribondo_ativos.serv_ferias', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.integer('id_serv_vinc').notNull().unsigned().comment("Vinculos")
        table.specificType('dt_i_aquisicao', 'char(10)').notNull().comment("Data Início da Aquisição")
        table.specificType('dt_f_aquisicao', 'char(10)').notNull().comment("Data Fim da Aquisição")
        table.specificType('dt_inicio', 'char(10)').notNull().comment("Data Início das Férias")
        table.string('periodo', 255).notNull().comment("Período")
        table.string('obs', 255).comment("Observação")
        
        table.foreign('id_serv_vinc').references('id').inTable('serv_vinculos').onUpdate('CASCADE').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_maribondo_ativos.serv_ferias')
};