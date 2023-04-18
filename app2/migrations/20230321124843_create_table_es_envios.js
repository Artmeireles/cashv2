exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_maribondo_ativos.es_envios', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.integer('id_es_param').notNull().unsigned().comment("eSocial Parametros")
        table.string('es_lote', 255).comment("eSocial Lote")
        table.string('es_idevento', 255).comment("eSocial IDEvento")
        table.string('es_evento', 255).notNull().comment("eSocial IDEvento")
        table.string('es_recibo', 255).comment("eSocial Recibo")
        table.integer('es_status').notNull().comment("eSocial Status")
        table.string('exercicio', 7).comment("Exercício")
        table.string('tabela', 255).comment("Servidores, Financeiro, Fechamento, Exclusão")
        table.string('tbl_field', 25).comment("Tabela field")
        table.string('tbl_id', 500).comment("Tabela id")
        table.boolean('ambiente').comment("1-Produção, 2-Homologação")
        table.string('ver_process', 255).notNull().default('S.01.01.00').comment("Versão do Processo")

        table.foreign('id_es_param').references('id').inTable('es_params').onUpdate('CASCADE').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_maribondo_ativos.es_envios')
};