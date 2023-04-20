exports.up = function (knex) {
    return knex.schema.createTable('wwmgca_cliente_ativos.serv_cessao', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.integer('id_serv_vinc').notNull().unsigned().comment("Vinculos")
        table.specificType('dt_inicio', 'char(10)').notNull().comment("Data início da cessão/exercício em outro órgão")
        table.string('cnpj', 14).notNull().comment("CNPJ do empregador/órgão público")
        table.boolean('resp_remun').notNull().comment("Continuará informando remunerações")
        table.specificType('dt_fim', 'char(10)').notNull().comment("Data fim da cessão/exercício em outro órgão")

        table.foreign('id_serv_vinc').references('id').inTable('serv_vinculos').onUpdate('CASCADE').onDelete('NO ACTION')
    })
};

exports.down = function (knex) {
    return knex.schema.dropTable('wwmgca_cliente_ativos.serv_cessao')
};