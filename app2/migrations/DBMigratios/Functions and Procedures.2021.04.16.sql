/*
SQLyog Professional v12.12 (64 bit)
MySQL - 10.4.13-MariaDB : Database - wwmgca_api
*********************************************************************
*/

utf8mb4
/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
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
