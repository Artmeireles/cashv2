exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_cliente_ativos.con_consign', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.integer('id_cad_bancos').unsigned().notNull()
        table.string('agencia').notNull()
        table.string('qmar').notNull().comment('Quitação mínima (parcelas) antes da renovação')
        table.string('qmp').notNull().comment('Quantidade máxima de parcelas do consignatário')
        table.boolean('averbar_online').notNull().default(false).comment('Aceitar averbação online')
        table.boolean('apenas_efetivos').notNull().default(true).comment('Apenas efetivos podem contratar')

        table.foreign('id_cad_bancos').references('id').inTable('wwmgca_cliente_ativos.cad_bancos').onUpdate('CASCADE').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_cliente_ativos.con_consign')
};