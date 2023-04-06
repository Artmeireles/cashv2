exports.up = function(knex) {
    return knex.schema.createTable('wwmgca_cliente_ativos.emp_resp_contato', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.integer('id_emp_resp').notNull().unsigned().comment("Empresa")
        table.boolean('tipo').notNull().comment("1-Telefone, 2-email, 3-Rede Social, 4-Site")
        table.string('contato', 255).comment("Contato")
        
        table.foreign('id_emp_resp').references('id').inTable('emp_resp').onUpdate('CASCADE').onDelete('NO ACTION')
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable('wwmgca_cliente_ativos.emp_resp_contato')
};