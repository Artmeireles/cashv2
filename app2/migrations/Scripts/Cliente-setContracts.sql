DELIMITER $$

DROP PROCEDURE IF EXISTS `setContracts`$$

CREATE PROCEDURE `setContracts`(v_ano CHAR(4), v_mes CHAR(2))
    COMMENT 'Restaura, cria e insere os dados de contratos consignados do cliente'
BEGIN
	INSERT INTO `consignatarios` (`evento`, `created_at`, `id_cad_bancos`, `agencia`, `qmar`, `qmp`, `averbar_online`) 
	(
	SELECT '1', NOW(), cb.id, LPAD(cb.id,4,cb.id), '6', '96', '1' FROM cad_bancos cb
	);
	INSERT INTO `con_eventos` (
	  STATUS, evento, created_at, updated_at, id_consignatario, id_fin_eventos
	)(
	SELECT 10, 1, NOW(), NULL, (SELECT id FROM cad_bancos WHERE nome LIKE '%brasil%'), id FROM fin_eventos WHERE consignado = 1 AND 
	(evento_nome LIKE '%BB%' OR evento_nome LIKE '%B B%')
	) ;
	INSERT INTO `con_eventos` (
	  STATUS, evento, created_at, updated_at, id_consignatario, id_fin_eventos
	)(
	SELECT 10, 1, NOW(), NULL, (SELECT id FROM cad_bancos WHERE nome LIKE '%brad%'), id FROM fin_eventos WHERE consignado = 1 AND evento_nome LIKE '%brad%'
	) ;
	INSERT INTO `con_eventos` (
	  STATUS, evento, created_at, updated_at, id_consignatario, id_fin_eventos
	)(
	SELECT 10, 1, NOW(), NULL, (SELECT id FROM cad_bancos WHERE nome LIKE '%caixa%'), id FROM fin_eventos WHERE consignado = 1 AND 
	(evento_nome LIKE '%caixa%' OR evento_nome LIKE '%cef%')
	) ;
	INSERT INTO `con_contratos` (
	  evento, created_at, updated_at, token, 
	  id_user, id_consignatario, id_cad_servidores, id_con_eventos, contrato, primeiro_vencimento, 
	  valor_parcela, parcelas, valor_total, valor_liquido, qmar, averbado_online, data_averbacao, data_liquidacao)
	(
	SELECT
	1,NOW(),NULL,SUBSTRING(CONCAT(fr.id,SHA(fr.prazot+fr.prazo),SHA(fr.valor)),1,60)token,
	2,ce.id_consignatario,id_cad_servidores,ce.id,SUBSTRING(CONCAT(fr.id,SHA(fr.prazot+fr.prazo),SHA(fr.valor)),1,10) contrato,DATE_FORMAT(DATE_SUB(NOW(), INTERVAL fr.prazo MONTH),'%Y-%m-%d')primeiro_vencimento, 
	fr.valor, fr.prazot, fr.valor * fr.prazot, fr.valor * fr.prazot, 6,1,NOW(),NULL FROM fin_rubricas fr
	JOIN fin_eventos fe ON fe.id = fr.id_fin_eventos
	JOIN con_eventos ce ON fr.id_fin_eventos = ce.id_fin_eventos
	WHERE fr.ano = v_ano AND fr.mes = v_mes AND fe.consignado = 1
	GROUP BY fr.id_cad_servidores,fe.id_evento
	ORDER BY fr.id_cad_servidores, fr.ano DESC, fr.mes DESC, fr.complementar DESC, fe.id_evento
	LIMIT 999999
	);
    END$$

DELIMITER ;