UPDATE con_liquidacoes SET dominio = 'ativos' WHERE cliente = 'tapera';

SELECT fr.id_cad_servidores, SUM(fr.valor) FROM wwmgca_maribondo_ativos.cad_servidores cs
JOIN wwmgca_api.con_liquidacoes cl ON cl.cpf = cs.cpf
JOIN wwmgca_maribondo_ativos.fin_sfuncional ff ON ff.id_cad_servidores = cs.id
JOIN wwmgca_maribondo_ativos.fin_rubricas fr ON fr.id_cad_servidores = cs.id AND fr.ano = ff.ano AND fr.mes = ff.mes AND fr.complementar = ff.complementar
WHERE cl.cliente = 'tapera' AND cl.dominio = 'ativos' AND fr.ano = '2022' AND fr.mes = '09' AND fr.complementar = '000'
GROUP BY fr.id_cad_servidores
HAVING SUM(fr.valor) > 0;


