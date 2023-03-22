exports.up = function(knex) {
    return knex.schema.createTable('con_liquidacoes', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
            // table.string('cliente').notNull() // Apenas para api
            // table.string('dominio').notNull() // Apenas para api
        table.integer('id_consignatario').notNull().unsigned()
        table.integer('id_cad_servidores')
        table.string('folha_ano').notNull()
        table.string('folha_mes').notNull()
        table.integer('seq').notNull()
        table.integer('prz_total').notNull()
        table.integer('prz_reman').notNull()
        table.string('contrato').notNull()
        table.integer('prestacao').notNull()
        table.string('nome')
        table.string('cpf').notNull()
        table.decimal('v_prestacao', 11, 2).notNull()
        table.decimal('v_pagar', 11, 2).notNull()
        table.integer('situacao').notNull()
        table.string('observacao')

        // Remover para api
        table.foreign('id_consignatario').references('id').inTable('consignatarios').onUpdate('Cascade').onDelete('NO ACTION')
        table.foreign('id_cad_servidores').references('id').inTable('cad_servidores').onUpdate('Cascade').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('con_liquidacoes')
};