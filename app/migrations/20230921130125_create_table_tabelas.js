exports.up = function (knex) {
  return knex.schema.createTable("wwmgca_cliente_ativos.tabelas", (table) => {
    table.engine("InnoDB");
    table.charset("utf8mb4");
    table.collate("utf8mb4_general_ci");
    table.increments("id").primary();
    table.integer("status").notNull().default(10);
    table.integer("evento").notNull();
    table.string("created_at").notNull();
    table.string("updated_at");
    table.integer('id_emp').notNull().unsigned().comment("Empresa")
    table.specificType('tipo_tabela', 'char(1)').notNull().comment("Tipo da Tabela(0:IRRF, 1:RGPS, 2:RPPS")
    table.string('cod_tabela', 8).notNull().comment("Código da tabela")
    table.string('dsc_tabela', 100).notNull().comment("Descrição (nome) da Tabela")
    table.string("inicial1").notNull().default(0).comment("Valor inicial da faixa");
    table.string("final1").notNull().default(0).comment("Valor final da faixa");
    table.string("aliquota1").notNull().default(0).comment("Aliquota da faixa");
    table.string("deduzir1").comment("Valor a deduzir da faixa (apenas tipo = 0) (obrigatório para tipo = 0)");
    table.string("inicial2").notNull().default(0).comment("Valor inicial da faixa");
    table.string("final2").notNull().default(0).comment("Valor final da faixa");
    table.string("aliquota2").notNull().default(0).comment("Aliquota da faixa");
    table.string("deduzir2").comment("Valor a deduzir da faixa (apenas tipo = 0) (obrigatório para tipo = 0)");
    table.string("inicial3").notNull().default(0).comment("Valor inicial da faixa");
    table.string("final3").notNull().default(0).comment("Valor final da faixa");
    table.string("aliquota3").notNull().default(0).comment("Aliquota da faixa");
    table.string("deduzir3").comment("Valor a deduzir da faixa (apenas tipo = 0) (obrigatório para tipo = 0)");
    table.string("inicial4").notNull().default(0).comment("Valor inicial da faixa");
    table.string("final4").notNull().default(0).comment("Valor final da faixa");
    table.string("aliquota4").notNull().default(0).comment("Aliquota da faixa");
    table.string("deduzir4").comment("Valor a deduzir da faixa (apenas tipo = 0) (obrigatório para tipo = 0)");
    table.string("inicial5").comment("Valor inicial da faixa (obrigatório para tipo = 0)");
    table.string("final5").comment("Valor final da faixa (obrigatório para tipo = 0)");
    table.string("aliquota5").comment("Aliquota da faixa (obrigatório para tipo = 0)");
    table.string("deduzir5").comment("Valor a deduzir da faixa (apenas tipo = 0) (obrigatório para tipo = 0)");
    table.string("patronal").comment("Aliquota patronal (apenas tipos 1 e 2) (obrigatório para tipo 1 e 2)");
    table.string("patronal_e1").comment("Aliquota patronal (apenas tipos = 2) (obrigatório para tipo = 2)");
    table.integer("id_cc_e1").unsigned().comment("Centro de custo E1 (apenas tipos = 2) (obrigatório para tipo = 2)");
    table.string("patronal_e2").comment("Aliquota patronal (apenas tipos = 2) (obrigatório para tipo = 2)");
    table.integer("id_cc_e2").unsigned().comment("Centro de custo E2 (apenas tipos = 2) (obrigatório para tipo = 2)");
    table.string("teto").comment("Teto do INSS (apenas tipo = 1) (obrigatório para tipo = 0)");
    table.string("rat").comment("Aliquota RAT (apenas tipo = 1) (obrigatório para tipo = 0)");
    table.string("fap").comment("Aliquota FAP (apenas tipo = 1) (obrigatório para tipo = 0)");
    table.string("deducao_dependente").notNull().default(0).comment("Valor da dedução por dependente");
    table.string('ini_valid', 7).notNull().comment("Início da Validade das Informações")
    table.unique(['tipo_tabela', 'ini_valid'])
    
    table.foreign('id_cc_e1').references('id').inTable('tabelas_cc').onUpdate('CASCADE').onDelete('NO ACTION')
    table.foreign('id_cc_e2').references('id').inTable('tabelas_cc').onUpdate('CASCADE').onDelete('NO ACTION')
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("wwmgca_cliente_ativos.tabelas");
};
