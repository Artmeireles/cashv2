/**
>>> 1a IMPORTAÇÃO DE UM CLIENTE
>>> Executar as operações a seguir para cada banco relacionado ao cliente
1: No caso de domínio único
	a) importar os dados via frontend
	b) inserir o domínio
	c) registrar o id_cad_servidor para cada liquidação
*/
/*Registrar domínio para todas as liquidações inportadas*/
SELECT * FROM con_liquidacoes WHERE cliente = 'tapera' AND LENGTH(dominio) = 0;
UPDATE con_liquidacoes SET dominio = 'ativos' WHERE cliente = 'tapera' AND LENGTH(dominio) = 0;
/*Registrar um id_cad_servidor para cada liquidação*/
UPDATE wwmgca_api.con_liquidacoes cl
JOIN wwmgca_maribondo_ativos.cad_servidores cs ON cl.cpf = cs.cpf
JOIN wwmgca_maribondo_ativos.fin_rubricas fr ON fr.id_cad_servidores = cs.id AND fr.ano = '2022' AND fr.mes = '09' AND fr.complementar = '000'
SET cl.id_cad_servidores = cs.id, cl.updated_at = NOW()
WHERE cl.cliente = 'tapera' AND cl.dominio = 'ativos' AND cl.id_cad_servidores IS NULL;
/*Liquidar registros que tem id_cad_servidores e valor de parcela existente entre wwmgca_api.con_liquidacoes e fin_rubricas*/
UPDATE wwmgca_api.con_liquidacoes cl SET STATUS = 20 WHERE cl.id IN(
SELECT cl.id FROM wwmgca_api.con_liquidacoes cl 
JOIN fin_rubricas fr ON fr.valor = cl.v_pagar AND fr.id_cad_servidores = cl.id_cad_servidores
WHERE cl.cliente = 'tapera' AND cl.STATUS = 10 AND fr.ano = '2022' AND fr.mes = '09' AND fr.complementar = '000'
);

/**
As operações a seguir estão relacionadas às parcelas
*/

/*Criação da tabela*/
DROP TABLE IF EXISTS con_parcelas;
CREATE TABLE con_parcelas (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  STATUS INT(11) NOT NULL DEFAULT 10,
  evento INT(11) NOT NULL,
  created_at VARCHAR(255) NOT NULL,
  updated_at VARCHAR(255) DEFAULT NULL,
  id_con_contratos INT(10) UNSIGNED NOT NULL,
  parcela INT(3) NOT NULL,
  valor_parcela DECIMAL(11,2) NOT NULL,
  vencimento VARCHAR(25) NOT NULL,
  situacao INT(4) NOT NULL DEFAULT 1,
  observacao VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY `con_parcelas-con_contratos-id_con_contratos` (id_con_contratos),
  CONSTRAINT `con_parcelas-con_contratos-id_con_contratos` FOREIGN KEY (id_con_contratos) REFERENCES con_contratos (id) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=INNODB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8mb4;
/*Excluir registros de teste ou cancelados*/
DELETE FROM con_contratos WHERE STATUS IN(99);
/*Limpar tabela de parcelas e contratos*/
SET FOREIGN_KEY_CHECKS=0; 
TRUNCATE TABLE con_parcelas; 
-- TRUNCATE TABLE con_contratos; 
SET FOREIGN_KEY_CHECKS=1; 
/*Seta o mês da operação*/
SET @id_consignatario = 2;
SET @mes = '09';
SET @ano = '2022';
SET @cliente = 'major';
SET @dominio = 'previdencia';
/*Localizar contratos não liquidados*/
SELECT cc.*
FROM con_contratos cc
JOIN wwmgca_api.con_liquidacoes cl ON cc.contrato = cl.contrato AND cc.id_consignatario = cl.id_consignatario 
 AND cl.folha_ano = @ano AND cl.folha_mes IN(@mes) AND cl.cliente = @cliente AND cl.dominio = @dominio
WHERE cc.status != 20 AND cc.id_consignatario IN(@id_consignatario) 
GROUP BY cc.id;

/*Desativar contratos liquidados*/
UPDATE con_contratos cc 
SET cc.status = 20 WHERE cc.id NOT IN (
-- Liquidações do mês = @mes
	SELECT cc.id
	FROM con_contratos cc
	JOIN wwmgca_api.con_liquidacoes cl ON cc.contrato = cl.contrato AND cc.id_consignatario = cl.id_consignatario 
	 AND cl.folha_ano = @ano AND cl.folha_mes IN(@mes) AND cl.cliente = @cliente AND cl.dominio = @dominio
	WHERE cc.status != 20 AND cc.id_consignatario IN(@id_consignatario) 
	GROUP BY cc.id
);
/*Garantir status dos contratos ativos*/
UPDATE con_contratos cc 
SET cc.status = 10 WHERE cc.id IN (
-- Liquidações do mês = @mes
	SELECT cc.id
	FROM con_contratos cc
	JOIN wwmgca_api.con_liquidacoes cl ON cc.contrato = cl.contrato AND cc.id_consignatario = cl.id_consignatario 
	 AND cl.folha_ano = @ano AND cl.folha_mes IN(@mes) AND cl.cliente = @cliente AND cl.dominio = @dominio
	WHERE cc.status != 20 AND cc.id_consignatario IN(@id_consignatario) 
	GROUP BY cc.id
);
/*Verificar contratos novos e reativar manualmente após verificação*/
SELECT cc.* FROM con_contratos cc 
LEFT JOIN wwmgca_api.con_liquidacoes cl ON cc.contrato = cl.contrato
WHERE cl.id IS NULL AND cc.status = 20; AND cc.primeiro_vencimento >= CONCAT('2022-',@mes,'-01');

/*Testar e excluir todos os contratos com primeiro vencimento anterior ao dia 1º do mês anterior*/
SELECT * FROM con_contratos WHERE primeiro_vencimento < CONCAT('2022-',@mes,'-1');
DELETE FROM con_contratos WHERE primeiro_vencimento < CONCAT('2022-',@mes,'-1');

/*Inserir linhas faltantes em contratos e presentes em liquidações para todos os consignatários*/
INSERT INTO con_contratos (STATUS,evento,created_at,updated_at,token,id_user,id_consignatario,id_cad_servidores,
id_con_eventos,contrato,primeiro_vencimento,valor_parcela,
parcela,parcelas,valor_total,valor_liquido,
qmar,averbado_online,data_averbacao,data_liquidacao)
(SELECT '10','1',NOW(),NULL,SHA(cl.contrato),1,cl.id_consignatario,cl.id_cad_servidores,
(SELECT MIN(id) FROM con_eventos WHERE id_consignatario = @id_consignatario),cl.contrato,NOW(),cl.v_prestacao,
cl.prestacao, cl.prz_total, cl.prestacao * cl.prz_total, cl.prestacao * cl.prz_total, 
0,1,NOW(), NULL FROM wwmgca_api.con_liquidacoes AS cl 
LEFT JOIN con_contratos AS cc ON cc.contrato = cl.contrato
WHERE cc.id IS NULL AND cl.status IN(0,10,20) AND cl.dominio = @dominio AND cl.cliente = @cliente 
AND cl.situacao = '1' AND CONCAT(cl.folha_mes,'/',cl.folha_ano) = CONCAT(@mes,'/',@ano));
/*Contar registros que serão/foram incluídos*/
SELECT SUM(parcelas) FROM con_contratos WHERE STATUS = 10;
SELECT COUNT(id) FROM con_contratos WHERE STATUS = 10;

/*Testar as datas de primeiro vencimento e averbação - CEF e BB*/
SELECT cl.situacao, cc.contrato, cl.prz_total - cl.prz_reman, cl.prz_total, cl.prz_reman, 
DATE_SUB(CONCAT('2022-',@mes,'-12'), INTERVAL (cl.prz_total - cl.prz_reman-1) MONTH)primeiro_vencimento,
DATE_SUB(CONCAT('2022-',@mes,'-12'), INTERVAL (cl.prz_total - cl.prz_reman) MONTH)data_averbacao, cc.*
FROM con_contratos cc
JOIN wwmgca_api.con_liquidacoes cl ON cc.contrato = cl.contrato AND cc.id_consignatario = cl.id_consignatario
JOIN cad_servidores cs ON cs.id = cc.id_cad_servidores
WHERE cc.id_consignatario = @id_consignatario AND cl.folha_ano = @ano AND cl.folha_mes IN(@mes) AND cc.status = 10 AND cl.status = 20 
-- AND cl.contrato = '013209110001262718'
GROUP BY cc.contrato;
/*Informar as datas de primeiro vencimento e averbação - CEF*/
UPDATE con_contratos cc
JOIN wwmgca_api.con_liquidacoes cl ON cc.contrato = cl.contrato AND cc.id_consignatario = cl.id_consignatario
JOIN cad_servidores cs ON cs.id = cc.id_cad_servidores
SET primeiro_vencimento = DATE_SUB(CONCAT('2022-',@mes,'-12'), INTERVAL (cl.prz_total - cl.prz_reman-1) MONTH),
data_averbacao = DATE_SUB(CONCAT('2022-',@mes,'-12'), INTERVAL (cl.prz_total - cl.prz_reman) MONTH)
WHERE cc.id_consignatario = @id_consignatario AND cl.folha_ano = @ano AND cl.folha_mes IN(@mes) AND cc.status = 10 AND cl.status = 20; -- AND cl.contrato = '013209110001262718'

-- Adicionais abaixo. Mera consulta e testes
-- contratos
SELECT tb1.*, cp.id AS id_parcela, cs.cpf, cs.nome, cp.parcela 
FROM con_contratos AS tb1 
INNER JOIN cad_servidores AS cs ON cs.id = tb1.id_cad_servidores 
JOIN con_parcelas AS cp ON cp.id_con_contratos = tb1.id 
WHERE NOT tb1.status = 99 AND tb1.status = '10' AND (tb1.contrato LIKE '%%' OR cs.nome LIKE '%%') 
AND CONCAT(LPAD(EXTRACT(MONTH FROM cp.vencimento), 2, '0'),'/',EXTRACT(YEAR FROM cp.vencimento)) = CONCAT(@mes,'/',@ano) 
ORDER BY cs.nome ASC, tb1.created_at ASC;

-- relatório
SELECT cp.situacao, cc.contrato, cc.data_averbacao, cp.parcela, cc.parcelas, cc.primeiro_vencimento, cc.valor_parcela, cc.valor_liquido, 
cs.nome, cs.cpf, cc.valor_total, u.name, cb.url_logo 
FROM con_contratos cc
JOIN wwmgca_api.users u ON u.id = cc.id_user
JOIN cad_bancos cb ON cb.id = cc.id_consignatario
JOIN cad_servidores cs ON cs.id = cc.id_cad_servidores
LEFT JOIN con_parcelas cp ON cp.id_con_contratos = cc.id
WHERE cc.status = 10 AND CONCAT(LPAD(EXTRACT(MONTH FROM vencimento), 2, '0'),'/',EXTRACT(YEAR FROM vencimento)) = CONCAT(@mes,'/',@ano)
ORDER BY cs.nome, cp.situacao, cc.data_averbacao;

-- liquidações
SELECT cl.* FROM wwmgca_api.con_liquidacoes AS cl 
WHERE cl.status IN(0,10,20) AND cl.dominio = @dominio AND cl.cliente = @cliente 
AND cl.situacao = '1' AND CONCAT(cl.folha_mes,'/',cl.folha_ano) = CONCAT(@mes,'/',@ano);

/*Verificar contratos não registrados mas presentes em liquidações do exercício*/
SELECT cl.* FROM wwmgca_api.con_liquidacoes AS cl 
LEFT JOIN con_contratos AS cc ON cc.contrato = cl.contrato
WHERE cc.id IS NULL AND  cl.status IN(0,10,20) AND cl.dominio = @dominio AND cl.cliente = @cliente 
AND cl.situacao = '1' AND CONCAT(cl.folha_mes,'/',cl.folha_ano) = CONCAT(@mes,'/',@ano);



/*Nada ...*/
SELECT tb1.* FROM wwmgca_maribondo_ativos.con_contratos AS tb1 
INNER JOIN wwmgca_maribondo_ativos.cad_servidores AS cs ON cs.id = tb1.id_cad_servidores 
LEFT JOIN wwmgca_maribondo_ativos.con_parcelas AS cp ON cp.id_con_contratos = tb1.id 
AND CONCAT(EXTRACT(YEAR FROM cp.vencimento),'-',LPAD(EXTRACT(MONTH FROM cp.vencimento), 2, '0')) = SUBSTRING('undefined', 1, 7) 
WHERE NOT tb1.status = 99 AND CONCAT(EXTRACT(YEAR FROM cp.vencimento),'-',LPAD(EXTRACT(MONTH FROM cp.vencimento), 2, '0')) = SUBSTRING('2022-09-15', 1, 7) 
AND (tb1.contrato LIKE '%%' OR cs.nome LIKE '%%');

SELECT CONCAT(EXTRACT(YEAR FROM cp.vencimento),'-',LPAD(EXTRACT(MONTH FROM cp.vencimento), 2, '0')), tb1.* 
FROM wwmgca_maribondo_ativos.con_contratos AS tb1 
INNER JOIN wwmgca_maribondo_ativos.cad_servidores AS cs ON cs.id = tb1.id_cad_servidores 
LEFT JOIN wwmgca_maribondo_ativos.con_parcelas AS cp ON cp.id_con_contratos = tb1.id 
-- and CONCAT(EXTRACT(YEAR FROM cp.vencimento),'-',LPAD(EXTRACT(MONTH FROM cp.vencimento), 2, '0')) = substring('undefined', 1, 7) 
WHERE NOT tb1.status = 99 AND CONCAT(EXTRACT(YEAR FROM cp.vencimento),'-',LPAD(EXTRACT(MONTH FROM cp.vencimento), 2, '0')) = SUBSTRING('2022-08-15', 1, 7) 
AND (tb1.contrato LIKE '%%' OR cs.nome LIKE '%%');