DELIMITER $$
DROP FUNCTION IF EXISTS `getMaxFolhaByServidores`$$
CREATE FUNCTION `getMaxFolhaByServidores`(v_id VARCHAR(11)) RETURNS varchar(9) CHARSET utf8mb4
    COMMENT 'Retorna em formato yyyymmdd a última folha do servidor'
BEGIN
	DECLARE v_ano, v_mes, v_complementar VARCHAR(4);
	SELECT MAX(CAST(ano AS UNSIGNED)) INTO v_ano FROM fin_rubricas 
		JOIN cad_servidores ON cad_servidores.id = fin_rubricas.id_cad_servidores 
		WHERE (cad_servidores.id IN(v_id) OR cad_servidores.cpf IN(v_id));
	SELECT LPAD(MAX(CAST(mes AS UNSIGNED)),2,'0') INTO v_mes FROM fin_rubricas
		JOIN cad_servidores ON cad_servidores.id = fin_rubricas.id_cad_servidores
		WHERE (cad_servidores.id in(v_id) OR cad_servidores.cpf IN(v_id)) AND ano  = v_ano AND CAST(mes AS UNSIGNED) <= 12;
	SET v_complementar = '000';
	RETURN CONCAT(v_ano,v_mes,v_complementar);
    END$$
DELIMITER ;

DELIMITER $$
DROP FUNCTION IF EXISTS `getMaxFolhaByServidor`$$
CREATE FUNCTION `getMaxFolhaByServidor`(v_id VARCHAR(11)) RETURNS VARCHAR(9) CHARSET utf8mb4
    COMMENT 'Retorna em formato yyyymmdd a última folha do servidor'
BEGIN
	DECLARE v_ano, v_mes, v_complementar VARCHAR(4);
	SELECT MAX(CAST(fr.ano AS UNSIGNED)) INTO v_ano FROM fin_rubricas fr
		JOIN cad_servidores cs ON cs.id  = fr.id_cad_servidores 
		JOIN fin_parametros fp ON fp.`ano` = fr.ano AND fp.`mes` = fr.mes AND fp.`complementar` = fr.complementar
		WHERE (cs.id  = v_id OR cs.cpf  = v_id) AND CAST(fr.mes AS UNSIGNED) <= 12 AND fp.situacao = 0;
	SELECT LPAD(MAX(CAST(fr.mes AS UNSIGNED)),2,'0') INTO v_mes FROM fin_rubricas fr
		JOIN cad_servidores cs ON cs.id = fr.id_cad_servidores
		JOIN fin_parametros fp ON fp.`ano` = fr.ano AND fp.`mes` = fr.mes AND fp.`complementar` = fr.complementar
		WHERE (cs.id  = v_id OR cs.cpf  = v_id) AND fr.ano  = v_ano AND CAST(fr.mes AS UNSIGNED) <= 12 AND fp.situacao = 0;
	SET v_complementar = '000';
	RETURN CONCAT(v_ano,v_mes,v_complementar);
    END$$

DELIMITER ;

DELIMITER $$
DROP FUNCTION IF EXISTS `getMargemConsignavel`$$
CREATE FUNCTION `getMargemConsignavel`(v_ano VARCHAR(4),v_mes VARCHAR(2),v_complementar VARCHAR(3), v_id_cad_servidores INT) RETURNS varchar(255) CHARSET utf8mb4
    COMMENT 'Retorna a margem consignável do servidor referente a um determinado período'
BEGIN
	DECLARE r_valor, r_margemC, r_margemD, r_consignadoPos, r_margemFinal FLOAT(11,2);
	DECLARE r_id_evento, r_consignavel, r_deduzconsig, r_consignado INTEGER;
	DECLARE v_max_folha VARCHAR(10);
	DECLARE percentual INTEGER;
	
	DECLARE curlRubricas CURSOR FOR  
		SELECT fr.valor, fe.id_evento, fe.consignavel, fe.deduzconsig, fe.consignado FROM fin_rubricas fr
		JOIN fin_eventos fe ON fe.id = fr.id_fin_eventos
		WHERE ano = v_ano AND mes = v_mes AND complementar = v_complementar AND id_cad_servidores = v_id_cad_servidores;
	SET r_margemC = 0;
	SET r_margemD = 0;
	SET r_consignadoPos = 0;
	
	IF (v_ano IS NULL OR v_mes IS NULL OR v_complementar IS NULL) THEN
		SELECT getMaxFolhaByServidor(v_id_cad_servidores) INTO v_max_folha;
		SET v_ano = SUBSTR(v_max_folha,1,4);
		SET v_mes = SUBSTR(v_max_folha,5,2);
		SET v_complementar = SUBSTR(v_max_folha,7);
	END IF;
	
	OPEN curlRubricas;
	BEGIN
		DECLARE exit_flag INT DEFAULT 0;
		DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET exit_flag = 1;
		rubricasLoop: LOOP
			FETCH curlRubricas INTO r_valor, r_id_evento, r_consignavel, r_deduzconsig, r_consignado;
			IF exit_flag THEN LEAVE rubricasLoop; END IF;
			IF (r_consignavel) THEN
				SET r_margemC = r_margemC + r_valor;
			END IF;
			IF (r_deduzconsig AND !r_consignado) THEN
				SET r_margemC = r_margemC - r_valor;
			END IF;
			IF (r_deduzconsig AND r_consignado) THEN
				SET r_consignadoPos = r_consignadoPos + r_valor;
			END IF;			
		END LOOP;
	END;
	CLOSE curlRubricas;
	IF (r_margemC > 0) THEN
		SELECT CAST(parametro AS UNSIGNED) INTO percentual FROM local_params WHERE dominio = 'cash' AND grupo = 'base';
		SET r_margemD = ((r_margemC / 100) * percentual) - r_consignadoPos;
		IF (r_margemD > 0) THEN
			SET r_margemFinal = r_margemD;
		END IF;
	END IF;
	RETURN JSON_OBJECT('margemFolha', COALESCE(r_margemFinal,0), 'somaEventos', COALESCE(r_consignadoPos,0));
    END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `getPenddingContracts`$$
CREATE PROCEDURE `getPenddingContracts`(cliente varchar(255), dominio varchar(255))
    COMMENT 'Retorna uma lista de contratos pendentes'
BEGIN
	declare bd varchar(255);
	set bd = concat('wwmgca_',cliente,'_',dominio);
	SELECT u.name Nome, u.email Email, DATE_FORMAT(cc.`created_at`, '%d/%m/%Y') `Data criação`, cc.contrato Contrato, c.`matricula` `Matrícula`, 
	c.nome Nome, CONCAT("https://mgcash.app.br/servidor-panel/",c.matricula) Link 
	FROM bd.con_contratos cc
	JOIN `wwmgca_api`.users u ON u.id = cc.id_user
	JOIN cad_servidores c ON c.id = cc.`id_cad_servidores`
	WHERE cc.status = 9;
    END$$
DELIMITER ;

DELIMITER $$
DROP PROCEDURE IF EXISTS `setContracts`$$
CREATE PROCEDURE `setContracts`(v_ano char(4), v_mes char(2))
    COMMENT 'Restaura, cria e insere os dados de contratos consignados do cliente'
BEGIN
	DROP TABLE IF EXISTS `con_contratos`;
	DROP TABLE IF EXISTS `con_eventos`;
	DROP TABLE IF EXISTS `consignatarios`;
	CREATE TABLE `consignatarios` (
	  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	  `status` INT(11) NOT NULL DEFAULT 10,
	  `evento` INT(11) NOT NULL,
	  `created_at` VARCHAR(255) COLLATE utf8_unicode_ci NOT NULL,
	  `updated_at` VARCHAR(255) COLLATE utf8_unicode_ci DEFAULT NULL,
	  `id_cad_bancos` INT(11) NOT NULL,
	  `agencia` VARCHAR(255) COLLATE utf8_unicode_ci NOT NULL,
	  `qmar` VARCHAR(255) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Quitação mínima (parcelas) antes da renovação',
	  `qmp` VARCHAR(255) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Quantidade máxima de parcelas do consignatário',
	  `averbar_online` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Aceitar averbação online',
	  PRIMARY KEY (`id`),
	  KEY `mgcash_major_consignatarios_id_cad_bancos_foreign` (`id_cad_bancos`),
	  CONSTRAINT `mgcash_major_consignatarios_id_cad_bancos_foreign` FOREIGN KEY (`id_cad_bancos`) REFERENCES `cad_bancos` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
	) ENGINE=INNODB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
	CREATE TABLE `con_eventos` (
	  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	  `status` INT(11) NOT NULL DEFAULT 10,
	  `evento` INT(11) NOT NULL,
	  `created_at` VARCHAR(255) COLLATE utf8_unicode_ci NOT NULL,
	  `updated_at` VARCHAR(255) COLLATE utf8_unicode_ci DEFAULT NULL,
	  `id_consignatario` INT(10) UNSIGNED NOT NULL,
	  `id_fin_eventos` INT(11) NOT NULL,
	  PRIMARY KEY (`id`),
	  KEY `mgcash_major_con_eventos_id_fin_eventos_foreign` (`id_fin_eventos`),
	  KEY `mgcash_major_con_eventos_id_consignatario_foreign` (`id_consignatario`),
	  CONSTRAINT `mgcash_major_con_eventos_id_consignatario_foreign` FOREIGN KEY (`id_consignatario`) REFERENCES `consignatarios` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
	  CONSTRAINT `mgcash_major_con_eventos_id_fin_eventos_foreign` FOREIGN KEY (`id_fin_eventos`) REFERENCES `fin_eventos` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
	) ENGINE=INNODB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
	CREATE TABLE `con_contratos` (
	  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	  `status` INT(11) NOT NULL DEFAULT 10,
	  `evento` INT(11) NOT NULL,
	  `created_at` VARCHAR(255) COLLATE utf8_unicode_ci NOT NULL,
	  `updated_at` VARCHAR(255) COLLATE utf8_unicode_ci DEFAULT NULL,
	  `token` VARCHAR(255) COLLATE utf8_unicode_ci NOT NULL,
	  `id_user` INT(11) NOT NULL,
	  `id_consignatario` INT(10) UNSIGNED NOT NULL,
	  `id_cad_servidores` INT(11) NOT NULL,
	  `id_con_eventos` INT(10) UNSIGNED NOT NULL,
	  `contrato` VARCHAR(255) COLLATE utf8_unicode_ci NOT NULL,
	  `primeiro_vencimento` VARCHAR(255) COLLATE utf8_unicode_ci NOT NULL,
	  `valor_parcela` DECIMAL(11,2) NOT NULL,
	  `parcelas` VARCHAR(255) COLLATE utf8_unicode_ci NOT NULL,
	  `valor_total` DECIMAL(11,2) NOT NULL,
	  `valor_liquido` DECIMAL(11,2) NOT NULL,
	  `qmar` VARCHAR(255) COLLATE utf8_unicode_ci NOT NULL COMMENT 'Quitação mínima (parcelas) antes da renovação',
	  `averbado_online` TINYINT(1),
	  `data_averbacao` VARCHAR(255) COLLATE utf8_unicode_ci DEFAULT NULL,
	  `data_liquidacao` VARCHAR(255) COLLATE utf8_unicode_ci DEFAULT NULL,
	  PRIMARY KEY (`id`),
	  UNIQUE KEY `mgcash_major_con_contratos_token_unique` (`token`),
	  KEY `mgcash_major_con_contratos_id_cad_servidores_foreign` (`id_cad_servidores`),
	  KEY `mgcash_major_con_contratos_id_con_eventos_foreign` (`id_con_eventos`),
	  KEY `mgcash_major_con_contratos_id_consignatario_foreign` (`id_consignatario`),
	  CONSTRAINT `mgcash_major_con_contratos_id_cad_servidores_foreign` FOREIGN KEY (`id_cad_servidores`) REFERENCES `cad_servidores` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
	  CONSTRAINT `mgcash_major_con_contratos_id_con_eventos_foreign` FOREIGN KEY (`id_con_eventos`) REFERENCES `con_eventos` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
	  CONSTRAINT `mgcash_major_con_contratos_id_consignatario_foreign` FOREIGN KEY (`id_consignatario`) REFERENCES `consignatarios` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
	) ENGINE=INNODB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
	INSERT INTO `consignatarios` (`evento`, `created_at`, `id_cad_bancos`, `agencia`, `qmar`, `qmp`, `averbar_online`) 
	(
	select '1', now(), cb.id, lpad(cb.id,4,cb.id), '6', '96', '1' from cad_bancos cb
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
