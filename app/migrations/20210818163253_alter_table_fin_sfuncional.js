exports.up = function(knex, Promise) {
    return knex.schema.alterTable('wwmgca_major_previdencia.fin_sfuncional', table => {
        table.string('holerite_online')
        table.string('siope_atuacao').after('holerite_online')
        table.string('siope_s1', 1).after('siope_atuacao')
        table.string('siope_s2', 1).after('siope_s1')
        table.string('siope_s3', 1).after('siope_s2')
        table.string('siope_s4', 1).after('siope_s3')
        table.string('siope_s5', 1).after('siope_s4')
        table.string('siope_s6', 1).after('siope_s5')
        table.string('siope_s7', 1).after('siope_s6')
    })
};

exports.down = function(knex, Promise) {
    return knex.schema.alterTable('wwmgca_major_previdencia.fin_sfuncional', table => {
        table.dropColumn('holerite_online')
        table.dropColumn('siope_atuacao')
        table.dropColumn('siope_s1')
        table.dropColumn('siope_s2')
        table.dropColumn('siope_s3')
        table.dropColumn('siope_s4')
        table.dropColumn('siope_s5')
        table.dropColumn('siope_s6')
        table.dropColumn('siope_s7')
    })
};