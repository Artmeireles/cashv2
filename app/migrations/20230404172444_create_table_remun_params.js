const { migrationClientSchema } = require('../.env')

exports.up = function(knex) {
    return knex.schema.createTable(migrationClientSchema + '.remun_params', table => {
        table.engine('InnoDB')
        table.charset('utf8mb4')
        table.collate('utf8mb4_general_ci')
        table.increments('id').primary()
        table.integer('status').notNull().default(10)
        table.integer('evento').notNull()
        table.string('created_at').notNull()
        table.string('updated_at')
        table.string('ano').notNull().comment("Ano")
        table.string('mes').notNull().comment("Mês")
        table.string('complementar').default('000').comment("Complementar")
        table.string('ano_inf').notNull().comment("Ano Informação")
        table.string('mes_inf').notNull().comment("Mês Informação")
        table.string('complementar_inf').default('000').comment("Informação Complementar")
        table.string('descricao').comment("Descrição")
        table.string('mensagem').comment("Mensagem")
        table.string('mensagem_especial').comment("Mensagem Especial")
        table.unique(['ano', 'mes', 'complementar'])
    })
};

exports.down = function(knex) {
    return knex.schema.dropTable(migrationClientSchema + '.remun_params')
};