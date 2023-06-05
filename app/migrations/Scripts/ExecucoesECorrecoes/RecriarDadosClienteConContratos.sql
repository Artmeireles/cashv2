-- Setar as variáveis da operação
SET @cliente = 'tapera';
SET @dominio = 'ativos';
SET @ano = '2023';
SET @mes = '05'; 
SET @id_consignatario = 2; -- 1=bb,2=cef,3=brad
SET @id_convenio = 5; -- 1=Mjr;2=MaribBB;3=MaribCef;4=TprBB;5=TprCef;6=TprPrevBB;7=TprPrevCef;9=DRiachosBB;10=DRiachosCef

-- Exclui tabela de cópia caso exista
SET @sql = CONCAT('DROP TABLE IF EXISTS wwmgca_',@cliente,'_',@dominio,'.con_contratos_cn');
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Criar tabela cópia
SET @sql = CONCAT('CREATE TABLE wwmgca_',@cliente,'_',@dominio,'.con_contratos_cn (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  status INT(11) NOT NULL DEFAULT 9,
  evento INT(11) NOT NULL,
  created_at VARCHAR(255) NOT NULL,
  updated_at VARCHAR(255) DEFAULT NULL,
  token VARCHAR(255) NOT NULL,
  id_user INT(11) NOT NULL,
  id_consignatario INT(10) UNSIGNED NOT NULL,
  id_cad_servidores INT(11) DEFAULT NULL,
  id_con_eventos INT(10) UNSIGNED NOT NULL,
  contrato VARCHAR(255) NOT NULL,
  primeiro_vencimento VARCHAR(255) NOT NULL,
  valor_parcela DECIMAL(11,2) NOT NULL,
  parcela VARCHAR(255) NOT NULL DEFAULT "1",
  parcelas VARCHAR(255) NOT NULL,
  valor_total DECIMAL(11,2) NOT NULL,
  valor_liquido DECIMAL(11,2) NOT NULL,
  qmar VARCHAR(255) NOT NULL COMMENT "Quitação mínima (parcelas) antes da renovação",
  averbado_online TINYINT(1) DEFAULT NULL,
  data_averbacao VARCHAR(255) DEFAULT NULL,
  data_liquidacao VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY wwmgca_',@cliente,'_',@dominio,'_cn_token_unique (token),
  KEY wwmgca_',@cliente,'_',@dominio,'_cn_id_cad_servidores_foreign (id_cad_servidores),
  KEY wwmgca_',@cliente,'_',@dominio,'_cn_id_eventos_foreign (id_con_eventos),
  KEY wwmgca_',@cliente,'_',@dominio,'_cn_id_consignatario_foreign (id_consignatario),
  CONSTRAINT wwmgca_',@cliente,'_',@dominio,'_cn_id_cad_servidores_foreign FOREIGN KEY (id_cad_servidores) REFERENCES cad_servidores (id) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT wwmgca_',@cliente,'_',@dominio,'_cn_id_eventos_foreign FOREIGN KEY (id_con_eventos) REFERENCES con_eventos (id) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT wwmgca_',@cliente,'_',@dominio,'_cn_id_consignatario_foreign FOREIGN KEY (id_consignatario) REFERENCES consignatarios (id) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=INNODB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci');
-- select @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Insere os registros de API.con_liquidações em wwmgca_@cliente@dominio.con_contratos_cn
SET @sql = CONCAT('INSERT INTO wwmgca_',@cliente,'_',@dominio,'.con_contratos_cn
	SELECT 0,10,1,NOW(),NULL,SHA(CONCAT(id,@cliente,"_",@dominio)),(SELECT id FROM wwmgca_api.users WHERE NAME = "Cash"),@id_consignatario, 
	COALESCE(cla.id_cad_servidores,(SELECT id FROM wwmgca_driachos_ativos.cad_servidores WHERE cpf = cla.cpf ORDER BY id DESC LIMIT 1))id_cad_servidores,
	(SELECT id FROM wwmgca_',@cliente,'_',@dominio,'.con_eventos WHERE id_consignatario = @id_consignatario LIMIT 1),
	contrato,(LAST_DAY(DATE_SUB(NOW(), INTERVAL prestacao - 1 MONTH)))"primeiro_vencimento",v_prestacao, prestacao, prz_total, (v_prestacao * prz_total), (v_prestacao * prz_total), 
	0, 1, (LAST_DAY(DATE_SUB(NOW(), INTERVAL (prestacao) MONTH)))"data_averbacao", NULL	
	FROM wwmgca_api.con_liquidacoes cla
	WHERE cla.id_consignatario = @id_consignatario AND cla.cliente = @cliente AND cla.dominio = @dominio
		AND cla.folha_ano = @ano AND cla.folha_mes = @mes
	GROUP BY cla.contrato
	ORDER BY cla.contrato');
PREPARE stmt FROM @sql;
EXECUTE stmt;
	
-- Insere os dados mais atuais
SET @sql = CONCAT('INSERT INTO wwmgca_',@cliente,'_',@dominio,'.con_contratos_cn
	SELECT cno.* FROM wwmgca_',@cliente,'_',@dominio,'.con_contratos cno
	LEFT JOIN wwmgca_',@cliente,'_',@dominio,'.con_contratos_cn cn ON cn.contrato = cno.contrato
	WHERE cno.id_consignatario = @id_consignatario AND cno.primeiro_vencimento >= LAST_DAY(NOW()) and cn.contrato is null
GROUP BY cno.contrato');
PREPARE stmt FROM @sql;
EXECUTE stmt;
	
-- Recupera os dados existentes na tabela con_contratos original
SET @sql = CONCAT('UPDATE wwmgca_',@cliente,'_',@dominio,'.con_contratos_cn cn
	JOIN wwmgca_',@cliente,'_',@dominio,'.con_contratos cno ON cn.contrato = cno.contrato
	SET cn.id_user = cno.id_user, cn.evento = cno.evento, cn.updated_at = cno.updated_at, 
		cn.data_averbacao = cno.data_averbacao, cn.averbado_online = cno.averbado_online');
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Recupera os dados inseridos
SET @sql = CONCAT('select * from wwmgca_',@cliente,'_',@dominio,'.con_contratos_cn where id_consignatario = @id_consignatario and id_cad_servidores is not null ORDER BY primeiro_vencimento desc, contrato DESC, id_cad_servidores');
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Limpa a tabela con_contratos original
SET @sql = CONCAT('DELETE FROM wwmgca_',@cliente,'_',@dominio,'.con_contratos where id_consignatario = @id_consignatario');
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Insere na tabela con_contratos original os dados da cópia
SET @sql = CONCAT('INSERT INTO wwmgca_',@cliente,'_',@dominio,'.con_contratos 
			(SELECT 0,status,evento,created_at,updated_at,token,id_user,id_consignatario,
			id_cad_servidores,id_con_eventos,contrato,primeiro_vencimento,valor_parcela,
			parcela,parcelas,valor_total,valor_liquido,qmar,averbado_online,data_averbacao,
			data_liquidacao FROM wwmgca_',@cliente,'_',@dominio,'.con_contratos_cn)');
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Exclui tabela de cópia
SET @sql = CONCAT('DROP TABLE wwmgca_',@cliente,'_',@dominio,'.con_contratos_cn');
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Recupera os dados inseridos na tabela con_contratos original
SET @sql = CONCAT('select * from wwmgca_',@cliente,'_',@dominio,'.con_contratos where id_consignatario = @id_consignatario and id_cad_servidores is not null ORDER BY primeiro_vencimento desc, contrato DESC, id_cad_servidores');
PREPARE stmt FROM @sql;
EXECUTE stmt;