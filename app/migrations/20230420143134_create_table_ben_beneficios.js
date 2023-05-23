exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_cliente_ativos.ben_beneficios', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.integer('id_emp').notNull().unsigned().comment("Empresa")
        table.integer('id_ben_vinc').notNull().unsigned().comment("Vínculo")
        table.integer('id_rub').notNull().unsigned().comment("Rúbrica")
        table.specificType('ide_dm_dev', 'char(10)').notNull().comment("Demonstrativo de Valor")
        
        table.foreign('id_emp').references('id').inTable('wwmgca_api.empresa').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_ben_vinc').references('id').inTable('ben_vinculos').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_rub').references('id').inTable('fin_rubricas').onUpdate('CASCADE').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_cliente_ativos.ben_beneficios')
};