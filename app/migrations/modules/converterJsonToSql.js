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
    "data": [{ "id": 0, "status": 10, "evento": 1, "created_at": "2023-07-10T13:38:00.397Z", "updated_at": null },
    { "id": 0, "status": 10, "evento": 1, "created_at": "2023-07-10T13:38:00.397Z", "updated_at": null }, { "id": 0, "status": 10, "evento": 1, "created_at": "2023-07-10T13:38:00.397Z", "updated_at": null }, { "id": 0, "status": 10, "evento": 1, "created_at": "2023-07-10T13:38:00.397Z", "updated_at": null }, { "id": 0, "status": 10, "evento": 1, "created_at": "2023-07-10T13:38:00.397Z", "updated_at": null }]
}

const sql = convertToBatchInsertSQL(json, 'params');
console.log(sql);