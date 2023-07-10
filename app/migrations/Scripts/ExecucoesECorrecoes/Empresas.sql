ALTER TABLE `wwmgca_app`.`empresa`  
  ADD CONSTRAINT `wwmgca_app_empresa_id_cidade_foreign` FOREIGN KEY (`id_cidade`) REFERENCES `wwmgca_app`.`cad_cidades`(`id`) ON UPDATE CASCADE ON DELETE NO ACTION;
