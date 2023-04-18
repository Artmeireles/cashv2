DROP FUNCTION if exists  `getMeioAverbacaoLabel`;
DELIMITER $$
CREATE FUNCTION `getMeioAverbacaoLabel`(STATUS VARCHAR(3)) RETURNS varchar(255) CHARSET utf8mb4
    COMMENT 'Retorna um label para um meio de averbaÃ§Ã£o informado'
BEGIN
	DECLARE ret VARCHAR(255);
	SELECT 
	CASE
	    WHEN STATUS is null THEN "Não foi averbado"
	    WHEN STATUS = 0 THEN "Online - por meio de senha do cliente"
	    WHEN STATUS = 1 THEN "Presencial - por meio de assinatura do cliente"
	END
	INTO ret
	FROM users LIMIT 1;
	RETURN ret;
    END$$
DELIMITER ;

DROP FUNCTION if exists  `extractNumbers`;
DELIMITER $$
CREATE FUNCTION `extractNumbers`(in_string VARCHAR(50)) RETURNS varchar(255) CHARSET utf8
    NO SQL
BEGIN
    DECLARE ctrNumber VARCHAR(50);
    DECLARE finNumber VARCHAR(50) DEFAULT '';
    DECLARE sChar VARCHAR(1);
    DECLARE inti INTEGER DEFAULT 1;
    IF LENGTH(in_string) > 0 THEN
        WHILE(inti <= LENGTH(in_string)) DO
            SET sChar = SUBSTRING(in_string, inti, 1);
            SET ctrNumber = FIND_IN_SET(sChar, '0,1,2,3,4,5,6,7,8,9'); 
            IF ctrNumber > 0 THEN
                SET finNumber = CONCAT(finNumber, sChar);
            END IF;
            SET inti = inti + 1;
        END WHILE;
        RETURN (finNumber);
    ELSE
        RETURN NULL;
    END IF;    
END$$
DELIMITER ;

DROP FUNCTION if exists  `getStatusLabel`;
DELIMITER $$
CREATE FUNCTION `getStatusLabel`(status varchar(3)) RETURNS varchar(255) CHARSET utf8mb4
    COMMENT 'Retorna um label para um status informado'
BEGIN
	declare ret varchar(255);
	SELECT 
	CASE
	    WHEN STATUS = 9 THEN "Averbar"
	    WHEN STATUS = 10 THEN "Ativo"
	    WHEN STATUS = 20 THEN "Liquidado"
	    ELSE "Cancelado"
	END
	into ret
	FROM users limit 1;
	return ret;
    END$$
DELIMITER ;

DROP PROCEDURE if exists  `getPenddingContracts`;
DELIMITER $$
CREATE PROCEDURE `getPenddingContracts`(cliente varchar(255), dominio varchar(255))
    COMMENT 'Retorna uma lista de contratos pendentes'
BEGIN
	declare _bd varchar(255);
	set _bd = concat('wwmgca_',cliente,'_',dominio);
	set @query := concat('SELECT u.id, u.name Nome, u.email Email, DATE_FORMAT(cc.`created_at`, "%d/%m/%Y") `Data criação`, cc.contrato Contrato, c.`matricula` `Matrícula`, 
	c.nome Nome, CONCAT("https://mgcash.app.br/servidor-panel/",c.matricula) Link 
	FROM ',_bd,'.con_contratos cc
	JOIN `wwmgca_api`.users u ON u.id = cc.id_user
	JOIN ',_bd,'.cad_servidores c ON c.id = cc.`id_cad_servidores`
	WHERE cc.status = 9');                              
	PREPARE myStmt FROM @query;                     
	execute myStmt;
    END$$
DELIMITER ;

DROP FUNCTION if exists  `getVinculoLabel`;
DELIMITER $$
CREATE FUNCTION `getVinculoLabel`(STATUS VARCHAR(3)) RETURNS varchar(255) CHARSET utf8mb4
    COMMENT 'Retorna um label para um vinculo funcional informado'
BEGIN
	DECLARE ret VARCHAR(255);
	SELECT 
	CASE
	    WHEN STATUS = 1 THEN "Efetivo"
	    WHEN STATUS = 2 THEN "Comissionado"
	    WHEN STATUS = 3 THEN "Contratado"
	    WHEN STATUS = 4 THEN "Aposentado"
	    WHEN STATUS = 5 THEN "Pensionista"
	    WHEN STATUS = 6 THEN "Eletivo"
	    WHEN STATUS = 7 THEN "Estagiário"
	    WHEN STATUS = 8 THEN "Contratado por Processo Seletivo"
	    WHEN STATUS = 9 THEN "Estabilizado"
	    WHEN STATUS = 10 THEN "Requisitado"
	    ELSE "Não informado"
	END
	INTO ret
	FROM users LIMIT 1;
	RETURN ret;
    END$$
DELIMITER ;

DROP PROCEDURE if exists  `mirrorNewDomain`;
DELIMITER $$
CREATE PROCEDURE `mirrorNewDomain`(clientDomain VARCHAR(255), clientName VARCHAR(255))
    COMMENT 'Cria os parÃ¢metros para o novo domÃ­nio de cliente'
BEGIN
	/* Insere o domínio do novo cliente*/
	INSERT INTO params (STATUS,evento,created_at,updated_at,dominio,meta,VALUE) 
		(SELECT '10',1,NOW(),NULL,'root','domain',clientDomain);
	/* Insere o Nome do novo cliente*/
	INSERT INTO params (STATUS,evento,created_at,updated_at,dominio,meta,VALUE) 
		(SELECT '10',1,NOW(),NULL,clientDomain,'clientName',clientName);
	/* Insere os parâmetros do novo cliente*/
	INSERT INTO params (STATUS,evento,created_at,updated_at,dominio,meta,VALUE) 
		(SELECT STATUS,evento,NOW(),NULL,clientDomain,meta,VALUE FROM params WHERE dominio = 'mirror');
END$$
DELIMITER ;

DROP FUNCTION if exists  `newEventCreate`;
DELIMITER $$
CREATE FUNCTION `newEventCreate`(v_id_user integer(11),v_evento varchar(255),v_classevento varchar(255),v_tabela_bd varchar(255),v_id_registro integer(11)) RETURNS int(11)
    COMMENT 'Cria um registro de evento e retorna seu ID'
BEGIN
	declare r_id integer(11);
	INSERT INTO `wwmgca_api`.`sis_events` (`id_user`,`created_at`,`evento`,`classevento`,`tabela_bd`,`id_registro`) 
	VALUES(v_id_user, now(), v_evento, v_classevento, v_tabela_bd, v_id_registro);	
	select max(id) into r_id from sis_events;
	return r_id; 
    END$$
DELIMITER ;

DROP FUNCTION if exists  `newUserBatch`;
DELIMITER $$
CREATE FUNCTION `newUserBatch`(v_name VARCHAR(255),v_cpf VARCHAR(255),v_email VARCHAR(255),v_telefone VARCHAR(255),v_cliente VARCHAR(255)
	,v_dominio VARCHAR(255), v_gestor TINYINT(1), v_multiCliente TINYINT(1), v_consignatario TINYINT(1), v_tipoUsuario TINYINT(1)
	, v_averbarOnline TINYINT(1), v_cad_servidores TINYINT(1), v_financeiro TINYINT(1), v_con_contratos TINYINT(1)) RETURNS varchar(255) CHARSET utf8mb4
    COMMENT 'Cria um usuÃ¡rio e suas alÃ§adas a partir de alguns dados informados como parÃ¢metros'
BEGIN
	/*
	Exemplo de uso
	SELECT newUserBatch('Alesson José Rodrigues dos Santos','10918354463','alesson.santos@caixa.gov.br','(82) 99687-7478','major','ativos',0,1,2,1,0,0,0,4)
	*/
	DECLARE v_password_reset_token VARCHAR(255);
	DECLARE r_token VARCHAR(255);
	DECLARE v_user_id INT(11);
	DECLARE v_id_evento INT(11);
	SELECT MAX(id) + 1 INTO v_user_id FROM users;
	SELECT TO_BASE64(CONCAT(v_user_id, '_10_', v_email)) INTO r_token;
	SET v_password_reset_token = CONCAT(SUBSTR(SHA(NOW()),1,27), '_', UNIX_TIMESTAMP(NOW()) * 10);
	/*Criação do registro de Evento*/
	SELECT newEventCreate(v_user_id,
		CONCAT('Novo perfil de usuário: email: ', v_email, ', name: ', v_name, ', cpf: ', v_cpf, ', telefone: ', v_telefone, ', status: 10, id: ', v_user_id),
		'NewUser', 'users', v_user_id) INTO v_id_evento;
	/*Criação do registro de Usuário*/
	
	INSERT INTO `wwmgca_api`.`users` (`id`,`evento`,`created_at`,`status`,`name`,`cpf`,`email`,`telefone`,
		`password`,`password_reset_token`,
		`cliente`,`dominio`,`gestor`,`multiCliente`,`consignatario`,`tipoUsuario`,`averbaOnline`,
		`cad_servidores`,`financeiro`,`con_contratos`,`f_ano`,`f_mes`,`f_complementar`) 
		VALUES(v_user_id, v_id_evento, NOW(), 10, v_name, v_cpf, v_email, v_telefone, 
		'$2a$10$Um3a47hubqsq30hZMGaaQeAbs/FoPpUeNtZxH8HB23ezNJIgwM5WW', v_password_reset_token,
		v_cliente, v_dominio, v_gestor, v_multiCliente, v_consignatario, v_tipoUsuario, v_averbarOnline,
		v_cad_servidores, v_financeiro, v_con_contratos, EXTRACT(YEAR FROM NOW()), LPAD(EXTRACT(MONTH FROM NOW()), 2, '0'), '000'
		);
	RETURN CONCAT('https://mgcash.app.br/password-reset/',v_password_reset_token);-- v_user_id,'/',r_token);	
    END$$
DELIMITER ;
