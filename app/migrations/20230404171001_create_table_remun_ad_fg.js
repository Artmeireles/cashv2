exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_cliente_ativos.remun_ad_fg', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.string('tipo').notNull().comment("1-Adicional; 2-Função Gratificada")
        table.specificType('dt_inicio', 'char(10)').notNull().comment("Data do Início")
        table.string('publicacao').comment("Publicação")
        table.string('nr_pub').comment("Número da Publicação")
        table.integer('id_param_vei_pub').notNull().unsigned().comment("Veículo da Publicação")

        table.foreign('id_param_vei_pub').references('id').inTable('wwmgca_app.params').onUpdate('CASCADE').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_cliente_ativos.remun_ad_fg')
};