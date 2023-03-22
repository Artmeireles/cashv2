/*
SQLyog Professional v12.12 (64 bit)
MySQL - 10.4.13-MariaDB : Database - wwmgca_api
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
USE `wwmgca_api`;

/* Function  structure for function  `getMeioAverbacaoLabel` */

/*!50003 DROP FUNCTION IF EXISTS `getMeioAverbacaoLabel` */;
DELIMITER $$

/*!50003 CREATE FUNCTION `getMeioAverbacaoLabel`(STATUS VARCHAR(3)) RETURNS varchar(255) CHARSET utf8mb4
    COMMENT 'Retorna um label para um meio de averbação informado'
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
    END */$$
DELIMITER ;

/* Function  structure for function  `getStatusLabel` */

/*!50003 DROP FUNCTION IF EXISTS `getStatusLabel` */;
DELIMITER $$

/*!50003 CREATE FUNCTION `getStatusLabel`(status varchar(3)) RETURNS varchar(255) CHARSET utf8mb4
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
    END */$$
DELIMITER ;

/* Function  structure for function  `getVinculoLabel` */

/*!50003 DROP FUNCTION IF EXISTS `getVinculoLabel` */;
DELIMITER $$

/*!50003 CREATE FUNCTION `getVinculoLabel`(status varchar(3)) RETURNS varchar(255) CHARSET utf8mb4
    COMMENT 'Retorna um label para um vinculo funcional informado'
BEGIN
	declare ret varchar(255);
	SELECT 
	CASE
	    WHEN STATUS = 1 THEN "Efetivo"
	    WHEN STATUS = 2 THEN "Comissionado"
	    WHEN STATUS = 3 THEN "Contratado"
	    WHEN STATUS = 4 THEN "Aposentado"
	    WHEN STATUS = 5 THEN "Pensionista"
	    WHEN STATUS = 6 THEN "Eletivo"
	    WHEN STATUS = 7 THEN "Estagiário"
	    ELSE "Não informado"
	END
	into ret
	FROM users limit 1;
	return ret;
    END */$$
DELIMITER ;

/* Function  structure for function  `newEventCreate` */

/*!50003 DROP FUNCTION IF EXISTS `newEventCreate` */;
DELIMITER $$

/*!50003 CREATE FUNCTION `newEventCreate`(v_id_user integer(11),v_evento varchar(255),v_classevento varchar(255),v_tabela_bd varchar(255),v_id_registro integer(11)) RETURNS int(11)
    COMMENT 'Cria um registro de evento e retorna seu ID'
BEGIN
	declare r_id integer(11);
	INSERT INTO `wwmgca_api`.`sis_events` (`id_user`,`created_at`,`evento`,`classevento`,`tabela_bd`,`id_registro`) 
	VALUES(v_id_user, now(), v_evento, v_classevento, v_tabela_bd, v_id_registro);	
	select max(id) into r_id from sis_events;
	return r_id; 
    END */$$
DELIMITER ;

/* Function  structure for function  `newUserBatch` */

/*!50003 DROP FUNCTION IF EXISTS `newUserBatch` */;
DELIMITER $$

/*!50003 CREATE FUNCTION `newUserBatch`(v_name varchar(255),v_cpf varchar(255),v_email varchar(255),v_telefone VARCHAR(255),v_cliente VARCHAR(255)
	,v_dominio VARCHAR(255), v_gestor TINYINT(1), v_multiCliente TINYINT(1), v_consignatario TINYINT(1), v_tipoUsuario TINYINT(1)
	, v_averbarOnline TINYINT(1), v_cad_servidores tinyint(1), v_financeiro TINYINT(1), v_con_contratos TINYINT(1), v_jUser VARCHAR(255), v_jPaswd VARCHAR(255)) RETURNS varchar(255) CHARSET utf8mb4
    COMMENT 'Cria um usuário e suas alçadas a partir de alguns dados informados como parâmetros'
BEGIN
	DECLARE v_password_reset_token VARCHAR(255);
	declare r_token varchar(255);
	declare v_user_id int(11);
	Declare v_id_evento int(11);
	select MAX(id) + 1 into v_user_id FROM users;
	select TO_BASE64(CONCAT(v_user_id, '_10_', v_email)) into r_token;
	set v_password_reset_token = CONCAT(SUBSTR(SHA(NOW()),1,27), '_', UNIX_TIMESTAMP(NOW()) * 10);
	/*Criação do registro de Evento*/
	select newEventCreate(v_user_id,
		concat('Novo perfil de usuário: email: ', v_email, ', name: ', v_name, ', cpf: ', v_cpf, ', telefone: ', v_telefone, ', status: 10, id: ', v_user_id),
		'NewUser', 'users', v_user_id) into v_id_evento;
	/*Criação do registro de Usuário*/
	INSERT INTO `wwmgca_api`.`users` (`id`,`evento`,`created_at`,`status`,`name`,`cpf`,`email`,`telefone`,`password`,`password_reset_token`) 
		VALUES(v_user_id, v_id_evento, now(), 10, v_name, v_cpf, v_email, v_telefone, '$2a$10$Um3a47hubqsq30hZMGaaQeAbs/FoPpUeNtZxH8HB23ezNJIgwM5WW', v_password_reset_token);
	/*Criação do registro de Evento*/
	SELECT newEventCreate(v_user_id,'Novo parâmetro de usuário', 'NewUser', 'users', v_user_id) INTO v_id_evento;
	/*Criação dos parâmetros obrigatórios*/
	INSERT INTO `wwmgca_api`.`user_params` (`id_users`,`status`,`evento`,`created_at`,`cliente`,`dominio`,`gestor`,`multiCliente`,`consignatario`,`tipoUsuario`,`averbaOnline`,
		`cad_servidores`,`financeiro`,`con_contratos`,`f_ano`,`f_mes`,`f_complementar`,`j_user`,`j_paswd`) 
		VALUES(v_user_id, 10, v_id_evento, now(), v_cliente, v_dominio, v_gestor, v_multiCliente, v_consignatario, v_tipoUsuario, v_averbarOnline,
		v_cad_servidores, v_financeiro, v_con_contratos, EXTRACT(YEAR FROM NOW()), lpad(EXTRACT(MONTH FROM NOW()), 2, '0'), '000', v_jUser, v_jPaswd);
--	RETURN CONCAT('https://mgcash.app.br/user-unlock/',v_user_id,'/',r_token);
	RETURN CONCAT('https://mgcash.app.br/password-reset/',v_password_reset_token);-- v_user_id,'/',r_token);	
    END */$$
DELIMITER ;

/* Procedure structure for procedure `getPenddingContracts` */

/*!50003 DROP PROCEDURE IF EXISTS  `getPenddingContracts` */;

DELIMITER $$

/*!50003 CREATE PROCEDURE `getPenddingContracts`(cliente varchar(255), dominio varchar(255))
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
    END */$$
DELIMITER ;

/* Procedure structure for procedure `mirrorNewDomain` */

/*!50003 DROP PROCEDURE IF EXISTS  `mirrorNewDomain` */;

DELIMITER $$

/*!50003 CREATE PROCEDURE `mirrorNewDomain`(clientDomain VARCHAR(255), clientName VARCHAR(255))
    COMMENT 'Cria os parâmetros para o novo domínio de cliente'
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
END */$$
DELIMITER ;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
