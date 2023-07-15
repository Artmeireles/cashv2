SELECT 'servidores', COUNT(*) FROM servidores
UNION
SELECT 'serv_vinculos', COUNT(*) FROM serv_vinculos
UNION
SELECT 'serv_dependentes', COUNT(*) FROM serv_dependentes
UNION
SELECT 'fin_rubricas', COUNT(*) FROM fin_rubricas
UNION
SELECT 'remuneracao', COUNT(*) FROM remuneracao
UNION
SELECT 'cargos', COUNT(*) FROM aux_cargos;