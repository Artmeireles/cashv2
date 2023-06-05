SET @dataTrasnfer = NOW();
SET @matricula = '00000767';
SET @statusAtivo = 10;
SET @statusLiquidado = 20;
SET @situacaoLiquidado = 6;
SET @parcelaInicial = 70;
SET @idConContrato = @idConContrato;


INSERT INTO wwmgca_maribondo_previdencia.con_contratos (
	STATUS, evento, created_at, updated_at, token, id_user, id_consignatario, 
	id_cad_servidores, 
	id_con_eventos, contrato, primeiro_vencimento, valor_parcela, 
	parcela, parcelas, valor_total, valor_liquido, qmar, averbado_online, data_averbacao
)(
SELECT @statusAtivo, evento, @dataTrasnfer, updated_at, token, id_user, id_consignatario, 
	(SELECT id FROM wwmgca_maribondo_previdencia.cad_servidores WHERE matricula = @matricula)id_cad_servidores, 
	id_con_eventos, contrato, primeiro_vencimento, valor_parcela, 
	parcela, parcelas, valor_total, valor_liquido, qmar, averbado_online, data_averbacao 
	FROM wwmgca_maribondo_ativos.con_contratos WHERE id = @idConContrato
);

UPDATE wwmgca_maribondo_ativos.con_contratos 
	SET STATUS = @statusLiquidado, data_liquidacao = @dataTrasnfer
	WHERE id = @idConContrato;

UPDATE wwmgca_maribondo_ativos.con_parcelas
	SET situacao = @situacaoLiquidado, observacao = 'Troca de domínio', updated_at = @dataTrasnfer
	WHERE id_con_contratos = @idConContrato AND parcela >= @parcelaInicial;
	
/* Executar con-parcelas/f-a/gpce */

TRUNCATE TABLE `wwmgca_maribondo_ativos`.`con_parcelas`;
TRUNCATE TABLE `wwmgca_maribondo_previdencia`.`con_parcelas`;
