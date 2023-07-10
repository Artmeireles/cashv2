function convertSQLToJSON(sql) {
    const regexValues = /\((.*?)\)/g; // Expressão regular para extrair os valores entre parênteses
    const regexNumber = /\b\d+\b/g; // Expressão regular para encontrar números inteiros
  
    const matches = sql.match(regexValues); // Encontrar todos os conjuntos de valores
    if (!matches) return []; // Retornar um array vazio se não houver correspondência
  
    const jsonArray = matches.map((match) => {
      const values = match.match(regexNumber); // Encontrar os valores numéricos
  
      return {
        id: parseInt(values[0]),
        status: parseInt(values[1]),
        evento: parseInt(values[2]),
        created_at: new Date(),
        updated_at: null,
        dominio: values[5],
        meta: values[6],
        value: values[7],
        label: values[8],
      };
    });
  
    return JSON.stringify(jsonArray);
  }
  

  const sql = `(0,10,1,now(),null,'root','estCiv','1','Solteiro'),
  (0,10,1,now(),null,'root','estCiv','2','Casado'),
  (0,10,1,now(),null,'root','estCiv','3','Divorciado'),
  (0,10,1,now(),null,'root','estCiv','4','Separado'),
  (0,10,1,now(),null,'root','estCiv','5','Viúvo')`;

  const jsonArray = convertSQLToJSON(sql);
  console.log(jsonArray);