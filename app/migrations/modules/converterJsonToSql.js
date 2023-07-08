function convertToBatchInsertSQL(data) {
    if (!data.tabela || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
        return '';
    }

    const tableName = data.tabela;
    const dataArray = data.data;

    const columns = Object.keys(dataArray[0]);
    const values = dataArray.map((obj) =>
        Object.values(obj).map((value) => {
            if (typeof value === 'string') {
                return `'${value}'`;
            }
            return value;
        })
    );

    const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES \n`;

    const rows = values
        .map((row) => `(${row.join(', ')})`)
        .join(',\n');

    return `${insertSQL}${rows};`;
}


const json = {
    "tabela": "params",
    "data": [
        {
            "dominio": "root",
            "meta": "classTrib",
            "VALUE": "01",
            "label": "Empresa enquadrada no regime de tributação Simples Nacional com tributação previdenciária substituída"
        },
        {
            "dominio": "root",
            "meta": "classTrib",
            "VALUE": "02",
            "label": "Empresa enquadrada no regime de tributação Simples Nacional com tributação previdenciária não substituída"
        },
        {
            "dominio": "root",
            "meta": "classTrib",
            "VALUE": "03",
            "label": "Empresa enquadrada no regime de tributação Simples Nacional com tributação previdenciária substituída e não substituída"
        },
        {
            "dominio": "root",
            "meta": "classTrib",
            "VALUE": "04",
            "label": "Microempreendedor Individual - MEI"
        },
        {
            "dominio": "root",
            "meta": "classTrib",
            "VALUE": "06",
            "label": "Agroindústria"
        },
        {
            "dominio": "root",
            "meta": "classTrib",
            "VALUE": "07",
            "label": "Produtor rural Pessoa Jurídica"
        },
        {
            "dominio": "root",
            "meta": "classTrib",
            "VALUE": "09",
            "label": "Órgão Gestor de Mão de Obra - OGMO"
        },
        {
            "dominio": "root",
            "meta": "classTrib",
            "VALUE": "10",
            "label": "Entidade sindical a que se refere a Lei 12.023/2009"
        },
        {
            "dominio": "root",
            "meta": "classTrib",
            "VALUE": "11",
            "label": "Associação desportiva que mantém clube de futebol profissional"
        },
        {
            "dominio": "root",
            "meta": "classTrib",
            "VALUE": "13",
            "label": "Banco, caixa econômica, sociedade de crédito, financiamento e investimento e demais empresas relacionadas no parágrafo 1º do art. 22 da Lei 8.212/1991"
        },
        {
            "dominio": "root",
            "meta": "classTrib",
            "VALUE": "14",
            "label": "Sindicatos em geral, exceto aquele classificado no código [10]"
        },
        {
            "dominio": "root",
            "meta": "classTrib",
            "VALUE": "60",
            "label": "Missão diplomática ou repartição consular de carreira estrangeira"
        },
        {
            "dominio": "root",
            "meta": "classTrib",
            "VALUE": "70",
            "label": "Empresa de que trata o Decreto 5.436/2005"
        },
        {
            "dominio": "root",
            "meta": "classTrib",
            "VALUE": "80",
            "label": "Entidade beneficente de assistência social isenta de contribuições sociais"
        },
        {
            "dominio": "root",
            "meta": "classTrib",
            "VALUE": "85",
            "label": "Administração direta da União, Estados, Distrito Federal e Municípios; autarquias e fundações públicas"
        },
        {
            "dominio": "root",
            "meta": "classTrib",
            "VALUE": "99",
            "label": "Pessoas Jurídicas em geral"
        }
    ]
}

const sql = convertToBatchInsertSQL(json, 'params');
console.log(sql);