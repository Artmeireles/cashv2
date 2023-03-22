UPDATE con_liquidacoes clD
JOIN con_liquidacoes clO ON clO.`contrato` = clD.`contrato` AND clO.`cpf` = clD.`cpf` AND `clO`.`folha_mes` = LPAD(clD.`folha_mes` - 1, 2, '0')  
SET clD.id_cad_servidores = clO.`id_cad_servidores`, clD.`dominio` = clO.`dominio`, clD.`status` = 20  
WHERE clD.`folha_mes` = '11' AND clD.`cliente` = 'tapera' AND clD.id_cad_servidores IS NULL;