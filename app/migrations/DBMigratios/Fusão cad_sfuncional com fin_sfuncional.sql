ALTER TABLE fin_sfuncional
	ADD COLUMN id_local_trabalho INT(11) COMMENT 'Local de trabalho',
	ADD COLUMN id_cad_principal INT(11) COMMENT 'Vinculo principal',
	ADD COLUMN id_escolaridade VARCHAR(2) COMMENT 'Escolaridade',
	ADD COLUMN escolaridaderais VARCHAR(2) COMMENT 'Escolaridade RAIS',
	ADD COLUMN rais TINYINT(3) COMMENT 'Declara RAIS',
	ADD COLUMN dirf TINYINT(3) COMMENT 'Declara DIRF',
	ADD COLUMN sefip TINYINT(3) COMMENT 'Declara SEFIP',
	ADD COLUMN sicap TINYINT(3) COMMENT 'Declara SICAP',
	ADD COLUMN insalubridade TINYINT(3) COMMENT 'Insalubridade',
	ADD COLUMN decimo TINYINT(3) COMMENT 'Recebe décimo',
	ADD COLUMN id_vinculo VARCHAR(2) COMMENT 'Vínculo',
	ADD COLUMN id_cat_sefip INT(11) COMMENT 'Categoria SEFIP',
	ADD COLUMN ocorrencia VARCHAR(2) COMMENT 'Ocorrência',
	ADD COLUMN carga_horaria DECIMAL(15,2) COMMENT 'Carga horária',
	ADD COLUMN molestia VARCHAR(2) COMMENT 'Moléstia',
	ADD COLUMN d_laudomolestia VARCHAR(10) COMMENT 'Moléstia data',
	ADD COLUMN manad_tiponomeacao VARCHAR(20) COMMENT 'Tipo nomeação',
	ADD COLUMN manad_numeronomeacao VARCHAR(20) COMMENT 'Número nomeação',
	ADD COLUMN d_admissao VARCHAR(10) COMMENT 'Admissão data',
	ADD COLUMN d_tempo VARCHAR(10) COMMENT '',
	ADD COLUMN d_tempofim VARCHAR(10) COMMENT '',
	ADD COLUMN n_valorbaseinss DECIMAL(15,2) COMMENT 'Valor base INSS';
	
UPDATE fin_sfuncional f 
JOIN cad_sfuncional c ON c.id_cad_servidores = f.id_cad_servidores AND c.ano = '2021' AND c.mes = '06' AND c.complementar = '000'
SET f.id_local_trabalho = c.id_local_trabalho,
	f.id_cad_principal = c.id_cad_principal,
	f.id_escolaridade = c.id_escolaridade,
	f.escolaridaderais = c.escolaridaderais,
	f.rais = c.rais,
	f.dirf = c.dirf,
	f.sefip = c.sefip,
	f.sicap = c.sicap,
	f.insalubridade = c.insalubridade,
	f.decimo = c.decimo,
	f.id_vinculo = c.id_vinculo,
	f.id_cat_sefip = c.id_cat_sefip,
	f.ocorrencia = c.ocorrencia,
	f.carga_horaria = c.carga_horaria,
	f.molestia = c.molestia,
	f.d_laudomolestia = c.d_laudomolestia,
	f.manad_tiponomeacao = c.manad_tiponomeacao,
	f.manad_numeronomeacao = c.manad_numeronomeacao,
	f.d_admissao = c.d_admissao,
	f.d_tempo = c.d_tempo,
	f.d_tempofim = c.d_tempofim,
	f.n_valorbaseinss = c.n_valorbaseinss;
	
DROP TABLE cad_sfuncional;
ALTER TABLE cad_bancos DROP COLUMN IF EXISTS slug, DROP INDEX IF EXISTS slug;
ALTER TABLE cad_bconvenios DROP COLUMN IF EXISTS slug, DROP INDEX IF EXISTS slug;
ALTER TABLE cad_cargos DROP COLUMN IF EXISTS slug, DROP INDEX IF EXISTS slug;
ALTER TABLE cad_centros DROP COLUMN IF EXISTS slug, DROP INDEX IF EXISTS slug;
ALTER TABLE cad_classes DROP COLUMN IF EXISTS slug, DROP INDEX IF EXISTS slug;
ALTER TABLE cad_departamentos DROP COLUMN IF EXISTS slug, DROP INDEX IF EXISTS slug;
ALTER TABLE cad_funcoes DROP COLUMN IF EXISTS slug, DROP INDEX IF EXISTS slug;
ALTER TABLE cad_localtrabalho DROP COLUMN IF EXISTS slug, DROP INDEX IF EXISTS slug;
ALTER TABLE cad_pccs DROP COLUMN IF EXISTS slug, DROP INDEX IF EXISTS slug;
ALTER TABLE cad_scertidao DROP COLUMN IF EXISTS slug, DROP INDEX IF EXISTS slug;
ALTER TABLE cad_sdependentes DROP COLUMN IF EXISTS slug, DROP INDEX IF EXISTS slug;
ALTER TABLE cad_servidores DROP COLUMN IF EXISTS slug, DROP INDEX IF EXISTS slug;
ALTER TABLE cad_sferias DROP COLUMN IF EXISTS slug, DROP INDEX IF EXISTS slug;
ALTER TABLE cad_smovimentacao DROP COLUMN IF EXISTS slug, DROP INDEX IF EXISTS slug;
ALTER TABLE cad_srecadastro DROP COLUMN IF EXISTS slug, DROP INDEX IF EXISTS slug;
ALTER TABLE fin_basefixa DROP COLUMN IF EXISTS slug, DROP INDEX slug;
ALTER TABLE `fin_basefixaeventos` DROP COLUMN IF EXISTS slug, DROP INDEX slug;
ALTER TABLE `fin_basefixarefer` DROP COLUMN IF EXISTS slug, DROP INDEX slug;
ALTER TABLE `fin_eventos` DROP COLUMN IF EXISTS slug, DROP INDEX slug;
ALTER TABLE `fin_eventosbase` DROP COLUMN IF EXISTS slug, DROP INDEX slug;
ALTER TABLE `fin_eventosdesconto` DROP COLUMN IF EXISTS slug, DROP INDEX slug;
ALTER TABLE `fin_eventospercentual` DROP COLUMN IF EXISTS slug, DROP INDEX slug;
ALTER TABLE `fin_faixas` DROP COLUMN IF EXISTS slug, DROP INDEX slug;
ALTER TABLE `fin_parametros` DROP COLUMN IF EXISTS slug, DROP INDEX slug;
ALTER TABLE `fin_referencias` DROP COLUMN IF EXISTS slug, DROP INDEX slug;
ALTER TABLE `fin_rubricas` DROP COLUMN IF EXISTS slug, DROP INDEX slug;
ALTER TABLE `fin_sfuncional` DROP COLUMN IF EXISTS slug, DROP INDEX slug;
ALTER TABLE `local_params` DROP COLUMN IF EXISTS slug, DROP INDEX slug;
ALTER TABLE `orgao` DROP COLUMN IF EXISTS slug, DROP INDEX slug;
ALTER TABLE `orgao_resp` DROP COLUMN IF EXISTS slug, DROP INDEX slug;
ALTER TABLE `orgao_ua` DROP COLUMN IF EXISTS slug, DROP INDEX slug;
SELECT
    table_schema AS 'DB Name',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 1) AS 'DB Size in MB'
FROM
    information_schema.tables
GROUP BY
    table_schema;