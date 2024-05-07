exports.up = function (knex) {
  return knex.schema.createTable("wwmgca_cliente_ativos.tabelas_cc", (table) => {
    table.engine("InnoDB");
    table.charset("utf8mb4");
    table.collate("utf8mb4_general_ci");
    table.increments("id").primary();
    table.integer("status").notNull().default(10);
    table.integer("evento").notNull();
    table.string("created_at").notNull();
    table.string("updated_at");
    table.integer("id_emp_ua").notNull().unsigned().comment("Unidade");
    table.string("cod_tabela", 8).notNull().comment("Código da tabela");
    table.string("dsc_tabela").notNull().comment("Descrição (nome) da Tabela");
    table.foreign('id_emp_ua').references('id').inTable('emp_ua').onUpdate('CASCADE').onDelete('NO ACTION')
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("wwmgca_cliente_ativos.tabelas_cc");
};
