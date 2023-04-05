exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_maribondo_ativos.remuneracao', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.integer('id_serv_vinc').notNull().unsigned().comment("Vinculos")
        table.integer('id_remun_param').notNull().unsigned().comment("Parâmetros da Remuneração")
        table.integer('id_rubrica').notNull().unsigned().comment("Rúbrica")
        table.integer('id_ad_fg').notNull().unsigned().comment("1-Adicional; 2-Função Gratificada")
        table.string('qtd_rubr').comment("Quantidade")
        table.string('fator_rubr').comment("Fator da Rúbrica")
        table.string('valor_rubr').comment("Valor Total da Rúbrica")
        table.string('ind_apur_ir').notNull().default(1).comment("Indicativo de Apuração")
        table.specificType('prazo_i','char(3)').comment("Prazo Inicial")
        table.specificType('prazo_f','char(3)').comment("Prazo Final")

        table.foreign('id_serv_vinc').references('id').inTable('serv_vinculos').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_remun_param').references('id').inTable('remun_params').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_rubrica').references('id').inTable('rubricas').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_ad_fg').references('id').inTable('remun_ad_fg').onUpdate('CASCADE').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_maribondo_ativos.remuneracao')
};