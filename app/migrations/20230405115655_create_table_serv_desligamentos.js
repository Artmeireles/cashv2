exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_cliente_ativos.serv_desligamentos', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.integer('id_serv_vinc').notNull().unsigned().comment("Vinculos")
        table.integer('id_par_mt_dlg').notNull().unsigned().comment("Código Motivo do Desligamento")
        table.specificType('dt_deslig', 'char(10)').notNull().comment("Data do Desligamento")
        table.boolean('ind_pagto_ap').notNull().comment("Pagamento de Aviso Prévio Indenizado")
        table.string('obs', 255).comment("Observação")
        
        table.foreign('id_serv_vinc').references('id').inTable('serv_vinculos').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_par_mt_dlg').references('id').inTable('wwmgca_api.params').onUpdate('CASCADE').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_cliente_ativos.serv_desligamentos')
};