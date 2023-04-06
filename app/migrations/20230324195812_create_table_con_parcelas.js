exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_cliente_ativos.con_parcelas', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(9)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.string('token').notNull().unique()
        table.integer('id_con_contratos').notNull().unsigned()
        table.integer('parcela').notNull()
        table.decimal('valor_parcela', 11, 2).notNull()
        table.integer('vencimento').notNull()
        table.integer('situacao').notNull()
        table.integer('observacao').notNull()

        table.foreign('id_con_contratos').references('id').inTable('con_contratos').onUpdate('Cascade').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_cliente_ativos.con_parcelas')
};