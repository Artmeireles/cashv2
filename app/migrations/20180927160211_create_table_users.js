exports.up = function(knex, Promise) {
    return knex.schema.createTable('users', function(table) {
        table.increments('id').unsigned().primary();
        table.integer('evento').notNullable();
        table.string('created_at').notNullable();
        table.string('updated_at').nullable();
        table.integer('status').notNullable().defaultTo(0);
        table.string('name').notNullable();
        table.string('cpf').notNullable();
        table.string('email').nullable();
        table.string('telefone').nullable();
        table.string('password').notNullable();
        table.string('password_reset_token').nullable();
        table.string('sms_token').nullable();
        table.integer('id_cadas').nullable();
        table.integer('id_emp').unsigned().nullable();
        table.string('cliente').nullable();
        table.string('dominio').nullable();
        table.boolean('admin').notNullable().defaultTo(false);
        table.boolean('gestor').notNullable().defaultTo(false);
        table.boolean('multiCliente').notNullable().defaultTo(true);
        table.boolean('consignatario').notNullable().defaultTo(false);
        table.boolean('openFinance').notNullable().defaultTo(false);
        table.integer('tipoUsuario').notNullable().defaultTo(-1);
        table.integer('averbaOnline').notNullable().defaultTo(0);
        table.boolean('cad_servidores').notNullable().defaultTo(false);
        table.boolean('financeiro').notNullable().defaultTo(false);
        table.boolean('con_contratos').notNullable().defaultTo(false);
        table.boolean('cad_orgao').notNullable().defaultTo(false);
        table.string('f_ano').nullable();
        table.string('f_mes').nullable();
        table.string('f_complementar').nullable();
        table.string('tkn_api').nullable();
        table.integer('time_to_pas_expires').notNullable().defaultTo(30);
    
        table.unique(['cpf', 'cliente', 'dominio'], 'users_cpf_unique');
        table.unique(['email', 'cliente', 'dominio'], 'users_email_unique');
    });
    
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('users')
};