/*Recupera domínios do cliente*/
SELECT VALUE AS dominios FROM wwmgca_api.params WHERE dominio = 'major' AND meta = 'domainName';

/*Recuperar a última folha do servidor por CPF*/
SELECT cs.id, ff.ano, ff.mes
FROM wwmgca_maribondo_ativos.cad_servidores cs
JOIN wwmgca_maribondo_ativos.fin_sfuncional AS ff ON ff.id_cad_servidores = cs.id 
WHERE cs.cpf = '03441685490' AND ff.situacaofuncional IS NOT NULL AND ff.situacaofuncional > 0 AND ff.mes < 13 
ORDER BY ff.ano DESC, ff.mes DESC
LIMIT 1;

/*Recupera todas as linhas do CPF*/
SELECT * FROM wwmgca_api.con_liquidacoes cl WHERE cl.cpf = '03441685490';

/*Recupera movimentações do servidor*/
SELECT cm.codigo_afastamento, cm.d_afastamento, cm.d_retorno FROM wwmgca_maribondo_ativos.cad_smovimentacao cm
WHERE cm.id_cad_servidores = 210;

/*Recupera parcelas atuais de consignados*/
SELECT fr.ano, fr.mes, fe.evento_nome, fe.id_evento, fr.valor FROM wwmgca_maribondo_ativos.fin_rubricas fr
JOIN wwmgca_maribondo_ativos.cad_servidores cs ON cs.id = fr.id_cad_servidores
JOIN wwmgca_maribondo_ativos.fin_eventos fe ON fe.id = fr.id_fin_eventos
JOIN wwmgca_maribondo_ativos.con_eventos ce ON ce.id_fin_eventos = fe.id
WHERE fe.consignado = 1 AND fr.id_cad_servidores = 210 AND 
fr.ano = 2021 AND fr.mes = 5 AND ce.id_consignatario = 2
ORDER BY fe.id_evento;
