exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_cliente_ativos.serv_afastamentos', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.integer('id_serv_vinc').notNull().unsigned().comment("Vinculos")
        table.integer('id_par_mtv_af').notNull().unsigned().comment("Código Motivo do Afastamento")
        table.specificType('dt_inicio', 'char(10)').comment("Data Início")
        table.specificType('dt_fim', 'char(10)').comment("Data Fim")
        table.boolean('info_mesmo_mtv').comment("Mesmo Motivo")
        table.integer('id_par_tp_acid').unsigned().comment("1-Atropelamento;2-Colisão;3-Outros")
        table.integer('id_par_onus').unsigned().comment("1-Ônus do cedente;2-Ônus do cessionário;3-Ônus do cedente e cessionário")
        table.string('cnpj_onus').comment("CNPJ do Ônus")
        table.integer('id_par_tp_af').unsigned().comment("1-Temporário;2-Definitivo")
        table.boolean('ind_remun_cargo').comment("Optou pela Remuneração do Cargo Efetivo")
        table.string('obs').comment("Observação")

        table.foreign('id_serv_vinc').references('id').inTable('serv_vinculos').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_par_mtv_af').references('id').inTable('wwmgca_app.params').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_par_tp_acid').references('id').inTable('wwmgca_app.params').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_par_onus').references('id').inTable('wwmgca_app.params').onUpdate('CASCADE').onDelete('NO ACTION')
        table.foreign('id_par_tp_af').references('id').inTable('wwmgca_app.params').onUpdate('CASCADE').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_cliente_ativos.serv_afastamentos')
};