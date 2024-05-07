select ID, STATUS, EVENTO, CREATED_AT, UPDATED_AT, ID_EMP, C_UA, CARDUG, CNPJ, NOME, ID_CIDADE, CEP, BAIRRO, LOGRADOURO,
       NR, COMPLEMENTO, ID_EMP_RESP, EMAIL, TELEFONE
from (select 0 ID, 10 STATUS, 1 EVENTO, timestamp 'now' as CREATED_AT, null as UPDATED_AT, '1' as ID_EMP, UA_1 C_UA,
             coalesce(CARDUG, '000000') CARDUG, replace(replace(replace(CNPJ_1, '-', ''), '/', ''), '.', '') CNPJ,
             UNIDADE_1 NOME, '112' ID_CIDADE, CEP_EMPRESA CEP, BAIRRO, ENDERECO LOGRADOURO, 0 NR, null COMPLEMENTO,
             1 as ID_EMP_RESP, EMAIL, replace(replace(replace(TELEFONE_EMPRESA, '(', ''), ')', ''), '-', '') TELEFONE
      from ORGAO
      union all
      select 0 ID, 10 STATUS, 1 EVENTO, timestamp 'now' as CREATED_AT, null as UPDATED_AT, '1' as ID_EMP, UA_2 C_UA,
             coalesce(CARDUG, '000000') CARDUG, replace(replace(replace(CNPJ_2, '-', ''), '/', ''), '.', '') CNPJ,
             UNIDADE_2 NOME, '112' ID_CIDADE, CEP_EMPRESA CEP, BAIRRO, ENDERECO LOGRADOURO, 0 NR, null COMPLEMENTO,
             1 as ID_EMP_RESP, EMAIL, replace(replace(replace(TELEFONE_EMPRESA, '(', ''), ')', ''), '-', '') TELEFONE
      from ORGAO
      where CNPJ_2 is not null
      union all
      select 0 ID, 10 STATUS, 1 EVENTO, timestamp 'now' as CREATED_AT, null as UPDATED_AT, '1' as ID_EMP, UA_3 C_UA,
             coalesce(CARDUG, '000000') CARDUG, replace(replace(replace(CNPJ_3, '-', ''), '/', ''), '.', '') CNPJ,
             UNIDADE_3 NOME, '112' ID_CIDADE, CEP_EMPRESA CEP, BAIRRO, ENDERECO LOGRADOURO, 0 NR, null COMPLEMENTO,
             1 as ID_EMP_RESP, EMAIL, replace(replace(replace(TELEFONE_EMPRESA, '(', ''), ')', ''), '-', '') TELEFONE
      from ORGAO
      where CNPJ_2 is not null
      union all
      select 0 ID, 10 STATUS, 1 EVENTO, timestamp 'now' as CREATED_AT, null as UPDATED_AT, '1' as ID_EMP, UA_4 C_UA,
             coalesce(CARDUG, '000000') CARDUG, replace(replace(replace(CNPJ_4, '-', ''), '/', ''), '.', '') CNPJ,
             UNIDADE_4 NOME, '112' ID_CIDADE, CEP_EMPRESA CEP, BAIRRO, ENDERECO LOGRADOURO, 0 NR, null COMPLEMENTO,
             1 as ID_EMP_RESP, EMAIL, replace(replace(replace(TELEFONE_EMPRESA, '(', ''), ')', ''), '-', '') TELEFONE
      from ORGAO
      where CNPJ_2 is not null)  
