-- Insere todas CON_LIQUIDACOES importadas pelo cash que inexistem em cliente.con_parcelas
INSERT INTO con_contratos (STATUS,evento,created_at,updated_at,token,id_user,id_consignatario,id_cad_servidores,id_con_eventos,
contrato,primeiro_vencimento,
valor_parcela,parcela,parcelas,valor_total,valor_liquido,qmar,averbado_online,data_averbacao,data_liquidacao) 
(SELECT 10,1,NOW(),NULL,SHA(CONCAT(cl.id,cl.contrato))token,'562' id_user,cl.id_consignatario, cl.id_cad_servidores,(SELECT id FROM con_eventos WHERE id_consignatario = cl.id_consignatario LIMIT 1)id_con_eventos,
cl.contrato,CONCAT(EXTRACT(YEAR FROM DATE_ADD(NOW(), INTERVAL cl.prestacao *(-1) MONTH)),'-',LPAD(EXTRACT(MONTH FROM DATE_ADD(NOW(), INTERVAL cl.prestacao *(-1) MONTH)),2,'0'),'-10')primeiro_vencimento,
cl.v_pagar,cl.prestacao,cl.prz_total,(cl.v_pagar*cl.prz_total)valor_total,(cl.v_pagar*cl.prz_total)valor_liquido,(SELECT qmar FROM consignatarios WHERE id = cl.id_consignatario LIMIT 1)qmar,
1 averbado_online,NOW(),NULL
FROM wwmgca_api.con_liquidacoes cl 
LEFT JOIN con_contratos cc ON cl.contrato = cc.contrato
LEFT JOIN con_parcelas cp ON cp.id_con_contratos = cc.id 
WHERE cl.folha_ano = '2022' AND cl.folha_mes = '11' AND cl.status IN(10,20) AND cc.contrato IS NULL AND cl.cliente = 'maribondo' AND cl.dominio = 'ativos'
GROUP BY cl.contrato, cl.id_consignatario, cl.id_cad_servidores, cl.cliente, cl.dominio
);

-- Insere todas FIN_RUBRICAS importadas do MGFolha para o cash que inexistem em cliente.con_parcelas
INSERT INTO con_contratos (STATUS,evento,created_at,updated_at,token,id_user,id_consignatario,id_cad_servidores,id_con_eventos,
contrato,primeiro_vencimento,
valor_parcela,parcela,parcelas,valor_total,valor_liquido,qmar,averbado_online,data_averbacao,data_liquidacao) 
(SELECT 10,1,NOW(),NULL,SHA(CONCAT(fr.id,fr.id_fin_eventos))token,'562' id_user,ce.id_consignatario, fr.id_cad_servidores,ce.id id_con_eventos,
TO_BASE64(CONCAT(fr.id,fr.id_fin_eventos))contrato,CONCAT(EXTRACT(YEAR FROM DATE_ADD(NOW(), INTERVAL fr.prazo *(-1) MONTH)),'-',LPAD(EXTRACT(MONTH FROM DATE_ADD(NOW(), INTERVAL fr.prazo *(-1) MONTH)),2,'0'),'-10')primeiro_vencimento,
fr.valor,fr.prazo,fr.prazot,(fr.valor*fr.prazot)valor_total,(fr.valor*fr.prazot)valor_liquido,(SELECT qmar FROM consignatarios WHERE id = ce.id_consignatario LIMIT 1)qmar,
1 averbado_online,NOW(),NULL
-- SELECT COUNT(id_evento) 
FROM fin_rubricas fr
JOIN fin_eventos fe ON fe.id = fr.`id_fin_eventos`
JOIN con_eventos ce ON ce.id_fin_eventos = fe.id
WHERE ano = 2022 AND mes = 11 AND fe.id_evento IN(301,302,303,304,305,306) AND fr.valor > 0
);

DELETE FROM `con_contratos` WHERE id_user = 562;

SELECT COUNT(id_evento) FROM fin_rubricas fr
JOIN fin_eventos fe ON fe.id = fr.`id_fin_eventos`
WHERE ano = 2022 AND mes = 11 AND fe.id_evento IN(301,302,303,304,305,306) AND fr.valor > 0;

-- Seleciona todos os contratos por user e idconsignatario
SELECT cc.* FROM con_contratos cc WHERE cc.id_consignatario = '1' AND cc.id_user = '562';
-- Seleciona todas as parcelas por user e idconsignatario
SELECT cp.* FROM con_contratos cc
JOIN con_parcelas cp ON cp.id_con_contratos = cc.id
WHERE id_consignatario = '1' AND id_user = '562' LIMIT 999999;
-- delete FROM con_contratos WHERE id_consignatario = '1' AND id_user = '562';

-- Verificar duplicatas de contratos
SELECT * FROM con_contratos WHERE id_consignatario = 1 GROUP BY contrato HAVING COUNT(contrato) > 1;

-- Localizar e Excluir api.con_liquidacoes sem dominio
SELECT * FROM wwmgca_api.con_liquidacoes WHERE dominio = '';
DELETE FROM wwmgca_api.con_liquidacoes WHERE dominio = '';

-- Seleciona contratos sem parcelas
SELECT cc.id,cc.parcelas,cc.valor_parcela,cc.primeiro_vencimento FROM con_contratos cc
LEFT JOIN con_parcelas cp ON cp.id_con_contratos = cc.id
WHERE cp.id IS NULL AND cc.status = 10 LIMIT 999999;

-- Seleciona todas as importações por user 1 para idconsignatario 1
SELECT * FROM wwmgca_api.con_liquidacoes WHERE id_consignatario = '1' AND cliente = 'maribondo' AND folha_ano = '2022' AND folha_mes = '11'; 
-- DELETE FROM wwmgca_api.con_liquidacoes WHERE id_consignatario = '1' AND cliente = 'maribondo' AND folha_ano = '2022' AND folha_mes = '11'; 

-- delete from con_parcelas where id_con_contratos in (1672,2811);
SELECT * FROM con_parcelas;

SELECT * FROM `fin_rubricas` WHERE `ano` = '2022' AND `mes` = '11' LIMIT 999999999; 

-- BB
SELECT * FROM fin_rubricas fr
JOIN fin_eventos fe ON fe.id = fr.`id_fin_eventos`
WHERE ano = 2022 AND mes = 11 AND fe.id_evento IN(301,302,303) AND fr.valor > 0;
-- CEF
SELECT COUNT(id_evento) FROM fin_rubricas fr
JOIN fin_eventos fe ON fe.id = fr.`id_fin_eventos`
WHERE ano = 2022 AND mes = 11 AND fe.id_evento IN(304,305,306) AND fr.valor > 0;
-- Bra
SELECT COUNT(id_evento) FROM fin_rubricas fr
JOIN fin_eventos fe ON fe.id = fr.`id_fin_eventos`
WHERE ano = 2022 AND mes = 11 AND fe.id_evento IN(310,311,312,313) AND fr.valor > 0;
-- Bmg
SELECT COUNT(id_evento) FROM fin_rubricas fr
JOIN fin_eventos fe ON fe.id = fr.`id_fin_eventos`
WHERE ano = 2022 AND mes = 11 AND fe.id_evento IN(307,308,309) AND fr.valor > 0;

