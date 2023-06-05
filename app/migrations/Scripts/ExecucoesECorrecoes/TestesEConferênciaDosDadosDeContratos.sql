-- Setar as variáveis da operação
SET @cliente = 'tapera';
SET @dominio = 'ativos';
SET @dominio2 = 'ativos';
SET @ano = '2023';
SET @mes = '05'; 
SET @id_convenio = 4; -- 1=Mjr;2=MaribBB;3=MaribCef;4=TprBB;5=TprCef;6=TprPrevBB;7=TprPrevCef;9=DRiachosBB;10=DRiachosCef
SET @id_convenio2 = 5; -- 1=Mjr;2=MaribBB;3=MaribCef;4=TprBB;5=TprCef;6=TprPrevBB;7=TprPrevCef;9=DRiachosBB;10=DRiachosCef

-- truncate table `wwmgca_tapera_ativos`.`con_parcelas`;

-- Linhas de contratos
SET @sql = CONCAT('
SELECT * FROM (
	SELECT lpad(cs.matricula,8,"0")matricula, cs.cpf, cs.nome servidor, cp.situacao, cc.contrato, cp.valor_parcela, cv.febraban, cv.nome, cp.parcela, cc.parcelas, 1
	FROM wwmgca_',@cliente,'_',@dominio,'.con_contratos cc
	JOIN wwmgca_',@cliente,'_',@dominio,'.con_parcelas cp ON cp.id_con_contratos = cc.id
	JOIN wwmgca_',@cliente,'_',@dominio,'.cad_servidores cs ON cc.id_cad_servidores = cs.id
	JOIN wwmgca_',@cliente,'_',@dominio,'.consignatarios cn ON cn.id = cc.id_consignatario
	JOIN wwmgca_api.con_convenios cv ON cv.id = cn.id_convenio
	WHERE EXTRACT(YEAR FROM cp.vencimento) = ',@ano,' AND EXTRACT(MONTH FROM cp.vencimento) = ',@mes,' AND cn.id_convenio IN (',@id_convenio,',',@id_convenio2,') 
	GROUP BY cc.contrato
	union 
	SELECT lpad(cs.matricula,8,"0")matricula, cs.cpf, cs.nome servidor, cp.situacao, cc.contrato, cp.valor_parcela, cv.febraban, cv.nome, cp.parcela, cc.parcelas, 2
	FROM wwmgca_',@cliente,'_',@dominio2,'.con_contratos cc
	JOIN wwmgca_',@cliente,'_',@dominio2,'.con_parcelas cp ON cp.id_con_contratos = cc.id
	JOIN wwmgca_',@cliente,'_',@dominio2,'.cad_servidores cs ON cc.id_cad_servidores = cs.id
	JOIN wwmgca_',@cliente,'_',@dominio2,'.consignatarios cn ON cn.id = cc.id_consignatario
	JOIN wwmgca_api.con_convenios cv ON cv.id = cn.id_convenio
	WHERE EXTRACT(YEAR FROM cp.vencimento) = ',@ano,' AND EXTRACT(MONTH FROM cp.vencimento) = ',@mes,' AND cn.id_convenio IN (',@id_convenio,',',@id_convenio2,') 
	GROUP BY cc.contrato
) dum
group by  matricula, contrato
-- having situacao = 1
ORDER BY situacao, servidor');
-- select @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;

-- Agrupador
SET @sql = CONCAT('
SELECT situacao, quantidade, SUM(valor_parcela) valor_parcela FROM (
	SELECT cp.situacao, count(cc.id)quantidade, SUM(cp.valor_parcela)valor_parcela
	FROM wwmgca_',@cliente,'_',@dominio,'.con_contratos cc
	JOIN wwmgca_',@cliente,'_',@dominio,'.con_parcelas cp ON cp.id_con_contratos = cc.id
	JOIN wwmgca_',@cliente,'_',@dominio,'.cad_servidores cs ON cc.id_cad_servidores = cs.id
	JOIN wwmgca_',@cliente,'_',@dominio,'.consignatarios cn ON cn.id = cc.id_consignatario
	JOIN wwmgca_api.con_convenios cv ON cv.id = cn.id_convenio
	WHERE EXTRACT(YEAR FROM cp.vencimento) = ',@ano,' AND EXTRACT(MONTH FROM cp.vencimento) = ',@mes,'
	AND cn.id_convenio IN (',@id_convenio,',',@id_convenio2,')
	GROUP BY cp.situacao
	UNION
	SELECT cp.situacao, count(cc.id)quantidade, SUM(cp.valor_parcela)valor_parcela
	FROM wwmgca_',@cliente,'_',@dominio2,'.con_contratos cc
	JOIN wwmgca_',@cliente,'_',@dominio2,'.con_parcelas cp ON cp.id_con_contratos = cc.id
	JOIN wwmgca_',@cliente,'_',@dominio2,'.cad_servidores cs ON cc.id_cad_servidores = cs.id
	JOIN wwmgca_',@cliente,'_',@dominio2,'.consignatarios cn ON cn.id = cc.id_consignatario
	JOIN wwmgca_api.con_convenios cv ON cv.id = cn.id_convenio
	WHERE EXTRACT(YEAR FROM cp.vencimento) = ',@ano,' AND EXTRACT(MONTH FROM cp.vencimento) = ',@mes,'
	AND cn.id_convenio IN (',@id_convenio,',',@id_convenio2,')
	GROUP BY cp.situacao
) dum
GROUP BY situacao
ORDER BY situacao');
-- select @sql;
PREPARE stmt FROM @sql;
EXECUTE stmt;