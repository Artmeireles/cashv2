exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_cliente_ativos.con_eventos', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.integer('id_consignatario').notNull().unsigned()
        table.integer('id_fin_eventos').notNull()

        table.foreign('id_fin_eventos').references('id').inTable('fin_eventos').onUpdate('Cascade').onDelete('NO ACTION')
        table.foreign('id_consignatario').references('id').inTable('consignatarios').onUpdate('Cascade').onDelete('NO ACTION')
    })
};
