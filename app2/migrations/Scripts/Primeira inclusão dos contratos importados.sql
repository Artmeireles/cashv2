SELECT cs.id, cs.matricula, ff.ano, ff.mes, ff.id_vinculo, cm.codigo_afastamento FROM wwmgca_major_previdencia.cad_servidores AS cs 
INNER JOIN wwmgca_major_previdencia.fin_sfuncional AS ff ON ff.id_cad_servidores = cs.id 
INNER JOIN wwmgca_major_previdencia.fin_rubricas AS fr ON fr.id_cad_servidores = ff.id_cad_servidores 
	AND ff.ano = fr.ano AND ff.mes = fr.mes
LEFT JOIN wwmgca_major_previdencia.cad_smovimentacao cm ON cm.id_cad_servidores = ff.id_cad_servidores
WHERE cs.cpf = '39172368420' AND ff.ano = '2021' AND ff.mes = '06' 
	AND ff.situacaofuncional IS NOT NULL AND ff.situacaofuncional > 0 AND ff.mes < 13 AND ff.id_vinculo IN(1,4,5)
ORDER BY ff.ano DESC, ff.mes DESC LIMIT 1;

SELECT * FROM wwmgca_major_previdencia.cad_smovimentacao WHERE id_cad_servidores = 266;

SELECT cs.id, cs.matricula, ff.ano, ff.mes, ff.id_vinculo FROM wwmgca_maribondo_ativos.cad_servidores AS cs 
INNER JOIN wwmgca_maribondo_ativos.fin_sfuncional AS ff ON ff.id_cad_servidores = cs.id 
INNER JOIN wwmgca_maribondo_ativos.fin_rubricas AS fr ON fr.id_cad_servidores = ff.id_cad_servidores 
	AND ff.ano = fr.ano AND ff.mes = fr.mes
WHERE cs.cpf = '39172368420' AND ff.ano = '2021' AND ff.mes = '06' 
	-- AND ff.situacaofuncional IS NOT NULL AND ff.situacaofuncional > 0 AND ff.mes < 13 and ff.id_vinculo in(1,4,5,6)
ORDER BY ff.ano DESC, ff.mes DESC LIMIT 1;

SELECT * FROM wwmgca_maribondo_ativos.cad_smovimentacao WHERE id_cad_servidores = 142;

TRUNCATE TABLE wwmgca_api.con_liquidacoes;
UPDATE wwmgca_api.con_liquidacoes SET STATUS = 10;
TRUNCATE TABLE wwmgca_maribondo_ativos.con_liquidacoes;
TRUNCATE TABLE wwmgca_major_previdencia.con_liquidacoes;

SELECT a.*, b.* FROM wwmgca_major_previdencia.con_liquidacoes a
JOIN wwmgca_maribondo_ativos.con_liquidacoes b ON a.contrato = b.contrato;

SELECT COUNT(*) FROM wwmgca_api.con_liquidacoes GROUP BY contrato;

SELECT cs.id, cs.matricula, ff.ano, ff.mes, ff.id_vinculo, SUM(fr.valor) FROM wwmgca_maribondo_ativos.cad_servidores AS cs 
INNER JOIN wwmgca_maribondo_ativos.fin_sfuncional AS ff ON ff.id_cad_servidores = cs.id 
INNER JOIN wwmgca_maribondo_ativos.fin_rubricas AS fr ON fr.id_cad_servidores = ff.id_cad_servidores 
	AND ff.ano = fr.ano AND ff.mes = fr.mes
INNER JOIN wwmgca_maribondo_ativos.fin_eventos fe ON fe.id = fr.id_fin_eventos
WHERE cs.cpf = '03244932401' AND ff.ano = '2021' AND ff.mes = '06' 
	AND ff.situacaofuncional IS NOT NULL AND ff.situacaofuncional > 0 AND ff.mes < 13 AND ff.id_vinculo IN(1,4,5)
	AND fe.consignado = 1
GROUP BY cs.id, cs.matricula, ff.ano, ff.mes, ff.id_vinculo	
ORDER BY ff.ano DESC, ff.mes DESC LIMIT 1;

SELECT SUM(fr.valor) FROM wwmgca_maribondo_ativos.fin_rubricas AS fr 
INNER JOIN wwmgca_maribondo_ativos.fin_eventos fe ON fe.id = fr.id_fin_eventos
WHERE fr.id_cad_servidores = 142 AND fr.ano = '2021' AND fr.mes = '06';

SELECT * FROM wwmgca_maribondo_ativos.con_liquidacoes WHERE folha_ano = 2021 AND folha_mes = 06;

SELECT MIN(ce.id) id FROM con_eventos ce
JOIN con_contratos cc ON cc.id_con_eventos = ce.id
WHERE ce.id_consignatario = 2 AND cc.status != 10 AND cc.id_cad_servidores = 2 AND ce.id != 4;

SELECT cc.id_con_eventos FROM con_contratos cc WHERE cc.id_consignatario = 2 AND cc.status = 10 AND cc.id_cad_servidores = 2; 

SELECT MIN(id) id, ce.* FROM con_eventos ce
WHERE ce.id_consignatario = 2 
AND id NOT IN(SELECT cc.id_con_eventos FROM con_contratos cc WHERE cc.id_consignatario = 2 AND cc.status = 10 AND cc.id_cad_servidores = 2);

SELECT * FROM wwmgca_maribondo_ativos.con_liquidacoes WHERE folha_ano = 2021 AND folha_mes = 06;

SELECT MIN(id) id FROM `wwmgca_maribondo_ativos`.`con_eventos` AS `ce` WHERE `id_consignatario` = 2 AND id NOT IN(SELECT cc.id_con_eventos FROM wwmgca_maribondo_ativos.con_contratos cc
                        WHERE cc.id_consignatario = 2 AND cc.status = 10
                        AND cc.id_cad_servidores = 20) LIMIT 1;

SELECT MIN(id) id FROM `wwmgca_maribondo_ativos`.`con_eventos` AS `ce` WHERE `id_consignatario` = 2 AND id NOT IN(SELECT cc.id_con_eventos FROM wwmgca_maribondo_ativos.con_contratos cc
                        WHERE cc.id_consignatario = 2 AND cc.status = 10
                        AND cc.id_cad_servidores = 132) LIMIT 1;
                        
TRUNCATE TABLE wwmgca_maribondo_ativos.con_contratos;
TRUNCATE TABLE wwmgca_major_previdencia.con_contratos;


INSERT INTO `wwmgca_maribondo_ativos`.`con_contratos` 
(`averbado_online`, `contrato`, `created_at`, `data_averbacao`, `evento`, `id_cad_servidores`, `id_con_eventos`, `id_consignatario`, 
`id_user`, `parcelas`, `primeiro_vencimento`, `qmar`, `status`, `token`, `valor_liquido`, `valor_parcela`, `valor_total`) 
VALUES (1, '01.3209.110.0008416/17', '2021-06-28 12:27:02.613', '10/06/2021', 39749, 266, 213, 2, 2, 72, '10/06/2021', '0', 10, 'y6IeYWPc1rWgNr837Rxgnt9K6T7Kd6LGPTwF5d8D', 29448, 409, 29448)

