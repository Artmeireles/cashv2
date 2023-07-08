INSERT INTO `wwmgca_app`.`params` (`id`, `status`, `evento`, `created_at`, `updated_at`, `dominio`, `meta`, `value`, `label`)
values
(0,10,1,now(),null,'root','tpJornada','2','Jornada 12 x 36 (12 horas de trabalho seguidas de 36 horas ininterruptas de descanso)'),
(0,10,1,now(),null,'root','tpJornada','3','Jornada com horário diário fixo e folga variável'),
(0,10,1,now(),null,'root','tpJornada','4','Jornada com horário diário fixo e folga fixa (no domingo)'),
(0,10,1,now(),null,'root','tpJornada','5','Jornada com horário diário fixo e folga fixa (exceto no domingo)'),
(0,10,1,now(),null,'root','tpJornada','6','Jornada com horário diário fixo e folga fixa (em outro dia da semana), com folga adicional periódica no domingo'),
(0,10,1,now(),null,'root','tpJornada','7','Turno ininterrupto de revezamento'),
(0,10,1,now(),null,'root','tpJornada','9','Demais tipos de jornada')