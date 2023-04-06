exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_cliente_ativos.con_contratos', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(9)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.string('token').notNull().unique()
        table.integer('id_user').notNull()
        table.integer('id_consignatario').notNull().unsigned()
        table.integer('id_cad_servidores').notNull()
        table.integer('id_con_eventos').notNull().unsigned()
        table.string('contrato').notNull()
        table.string('primeiro_vencimento').notNull()
        table.decimal('valor_parcela', 11, 2).notNull()
        table.string('parcela').notNull()
        table.string('parcelas').notNull()
        table.decimal('valor_total', 11, 2).notNull()
        table.decimal('valor_liquido', 11, 2).notNull()
        table.string('qmar').notNull().comment('Quitação mínima (parcelas) antes da renovação')
        table.boolean('averbado_online')
        table.string('data_averbacao')
        table.string('data_liquidacao')

        table.foreign('id_cad_servidores').references('id').inTable('cad_servidores').onUpdate('Cascade').onDelete('NO ACTION')
        table.foreign('id_con_eventos').references('id').inTable('con_eventos').onUpdate('Cascade').onDelete('NO ACTION')
        table.foreign('id_consignatario').references('id').inTable('consignatarios').onUpdate('Cascade').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_cliente_ativos.con_contratos')
};