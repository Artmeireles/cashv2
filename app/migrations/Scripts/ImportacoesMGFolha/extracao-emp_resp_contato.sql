select 0 ID, 10 STATUS, 1 EVENTO, timestamp 'now' CREATED_AT, null UPDATED_AT, 1 id_emp_resp, 'telefone' tipo, '82981499024' contato from ORGAO
union all
select 0 ID, 10 STATUS, 1 EVENTO, timestamp 'now' CREATED_AT, null UPDATED_AT, 1 id_emp_resp, 'email' tipo, 'contato@tommendes.com.br' contato from ORGAO
