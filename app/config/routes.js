const gestor = require('./gestor')

module.exports = app => {
    app.post('/signup', app.api.user.signup)
    app.post('/signin', app.api.auth.signin)
    app.post('/validateToken', app.api.auth.validateToken)

    /**
     * Exibição ou captura de ativos do sistema
     */
    app.route('/asset')
        .all(app.config.passport.authenticate())
        .post(app.api.assets.getAsset)

    /**
     * Rota de validação genérica de documentos
     */
    app.route('/validator/:func/:tk')
        .get(app.api.validator.getByFunction)

    /**
     * Rotas de usuários
     */
    // Solocitação de tokens de reset
    app.route('/request-password-reset').post(app.api.user.requestPasswordReset)
    // Entrega do token de reset e desbloqueio
    app.route('/password-reset/:id').put(app.api.user.passwordReset)
    // Desbloqueio de usuário por token 
    app.route('/user-unlock/:id')
        .get(app.api.user.unlock)
        .post(app.api.user.unlock)
    // Rotas utilizadas para envio do token por SMS e email
    app.route('/user-sms-unlock').patch(app.api.user.smsToken)
    app.route('/user-mail-unlock').patch(app.api.user.mailyToken)
    app.route('/users')
        .all(app.config.passport.authenticate())
        .post(gestor(app.api.user.save))
        .get(app.api.user.get)
    app.route('/users/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.user.save)
        .get(app.api.user.getById)
        .delete(gestor(app.api.user.remove))
    app.route('/user-token/:token').get(app.api.user.getByToken)
    app.route('/users/f-a/:func')
        .all(app.config.passport.authenticate())
        .get(app.api.user.getByFunction)
    app.route('/users/f/:func').get(app.api.user.getByFunction)
    app.route('/users-cpf/:cpf')
        .all(app.config.passport.authenticate())
        .get(app.api.user.getByCpf)
    app.route('/users/locate-servidor-on-client')
        .all(app.config.passport.authenticate())
        .post(app.api.user.locateServidorOnClient)

    /**
     * Rotas administrativas
     */
    app.route('/cidades').all(app.config.passport.authenticate()).get(app.api.cidades.getListaCidades)
    app.route('/cidades-uf').all(app.config.passport.authenticate()).get(app.api.cidades.getUFByCidade)

    /**
     * Rotas administrativas
     */
    app.route('/sis-events')
        .all(app.config.passport.authenticate())
        .post(app.api.sisEvents.createEventUpd)
        .get(app.api.sisEvents.get)
    app.route('/sis-events/:field')
        .all(app.config.passport.authenticate())
        .get(app.api.sisEvents.getByField)
    app.route('/params')
        .all(app.config.passport.authenticate())
        .post(app.api.params.save)
        .get(app.api.params.get)
    app.route('/params/f-a/:func')
        .all(app.config.passport.authenticate())
        .get(app.api.params.getByFunction)
    app.route('/params/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.params.save)
        .get(app.api.params.getById)
        .delete(app.api.params.remove)
    app.route('/mailer-cli')
        .all(app.config.passport.authenticate())
        .post(app.api.mailerCli.mailyCliSender)
    app.route('/mailer-noncli')
        // .all(app.config.passport.authenticate())
        .post(app.api.mailerCli.mailyCliSender)

    /**
     * Rotas para o MGFolha Desktop
     */
    app.route('/desk-users').get(app.api.user.getDeskUser)
    app.route('/ponte-id').post(app.api.params.getPonteId)
    app.route('/siap-id').post(app.api.params.getSiapId)
    app.route('/esocial-id').post(app.api.params.getESocialId)
    app.route('/esocialjar-id').post(app.api.params.getESocialJarId)

    /**
    * Novas Rotas /////////////////////////////////////////////////////
    * 
    */
    app.route('/empresa')
        .all(app.config.passport.authenticate())
        .post(app.api.empresa.save)
        .get(app.api.empresa.get)
    app.route('/empresa/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.empresa.save)
        .get(app.api.empresa.getById)
        .delete(app.api.empresa.remove)

    app.route('/es-params/:id_emp')
        .all(app.config.passport.authenticate())
        .post(app.api.esParams.save)
        .get(app.api.esParams.get)
    app.route('/es-params/:id_emp/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.esParams.save)
        .get(app.api.esParams.getById)
        .delete(app.api.esParams.remove)

    app.route('/es-envios')
        .all(app.config.passport.authenticate())
        .post(app.api.esEnvios.save)
        .get(app.api.esEnvios.get)
    app.route('/es-envios/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.esEnvios.save)
        .get(app.api.esEnvios.getById)
        .delete(app.api.esEnvios.remove)

    app.route('/es-rejeicoes')
        .all(app.config.passport.authenticate())
        .post(app.api.esRejeicoes.save)
        .get(app.api.esRejeicoes.get)
    app.route('/es-rejeicoes/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.esRejeicoes.save)
        .get(app.api.esRejeicoes.getById)
        .delete(app.api.esRejeicoes.remove)

    app.route('/emp-resp/:id_emp')
        .all(app.config.passport.authenticate())
        .post(app.api.empResp.save)
        .get(app.api.empResp.get)
    app.route('/emp-resp/:id_emp/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.empResp.save)
        .get(app.api.empResp.getById)
        .delete(app.api.empResp.remove)

    app.route('/emp-resp-contato/:id_emp_resp')
        .all(app.config.passport.authenticate())
        .post(app.api.empRespContato.save)
        .get(app.api.empRespContato.get)
    app.route('/emp-resp-contato/:id_emp_resp/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.empRespContato.save)
        .get(app.api.empRespContato.getById)
        .delete(app.api.empRespContato.remove)

    app.route('/emp-ua/:id_emp')
        .all(app.config.passport.authenticate())
        .post(app.api.empUA.save)
        .get(app.api.empUA.get)
    app.route('/emp-ua/:id_emp/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.empUA.save)
        .get(app.api.empUA.getById)
        .delete(app.api.empUA.remove)

    app.route('/aux-cargos')
        .all(app.config.passport.authenticate())
        .post(app.api.auxCargos.save)
        .get(app.api.auxCargos.get)
    app.route('/aux-cargos/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.auxCargos.save)
        .get(app.api.auxCargos.getById)
        .delete(app.api.auxCargos.remove)

    app.route('/cad-bancos')
        .all(app.config.passport.authenticate())
        .post(app.api.cadBancos.save)
        .get(app.api.cadBancos.get)
    app.route('/cad-bancos/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.cadBancos.save)
        .get(app.api.cadBancos.getById)
        .delete(app.api.cadBancos.remove)

    app.route('/con-consign')
        .all(app.config.passport.authenticate())
        .post(app.api.conConsign.save)
        .get(app.api.conConsign.get)
    app.route('/con-consign/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.conConsign.save)
        .get(app.api.conConsign.getById)
        .delete(app.api.conConsign.remove)

    app.route('/con-contratos/:id_serv')
        .all(app.config.passport.authenticate())
        .post(app.api.conContratos.save)
        .get(app.api.conContratos.get)
    app.route('/con-contratos/:id_serv/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.conContratos.save)
        .get(app.api.conContratos.getById)
        .delete(app.api.conContratos.remove)

    app.route('/fin-rubricas/:id_emp')
        .all(app.config.passport.authenticate())
        .post(app.api.finRubricas.save)
        .get(app.api.finRubricas.get)
    app.route('/fin-rubricas/:id_emp/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.finRubricas.save)
        .get(app.api.finRubricas.getById)
        .delete(app.api.finRubricas.remove)

    app.route('/servidores')
        .all(app.config.passport.authenticate())
        .post(app.api.servidores.save)
        .get(app.api.servidores.get)
    app.route('/servidores/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.servidores.save)
        .get(app.api.servidores.getById)
        .delete(app.api.servidores.remove)

    app.route('/serv-dependentes')
        .all(app.config.passport.authenticate())
        .post(app.api.servDependentes.save)
    app.route('/serv-dependentes/:id_serv')
        .all(app.config.passport.authenticate())
        .post(app.api.servDependentes.save)
        .get(app.api.servDependentes.get)
    app.route('/serv-dependentes/:id_serv/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.servDependentes.save)
        .get(app.api.servDependentes.getById)
        .delete(app.api.servDependentes.remove)

    app.route('/serv-vinculos')
        .all(app.config.passport.authenticate())
        .post(app.api.servVinculos.save)
    app.route('/serv-vinculos/:id_serv')
        .all(app.config.passport.authenticate())
        .post(app.api.servVinculos.save)
        .get(app.api.servVinculos.get)
    app.route('/serv-vinculos/:id_serv/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.servVinculos.save)
        .get(app.api.servVinculos.getById)
        .delete(app.api.servVinculos.remove)

    app.route('/local-params')
        .all(app.config.passport.authenticate())
        .post(app.api.localParams.save)
        .get(app.api.localParams.get)
    app.route('/local-params/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.localParams.save)
        .get(app.api.localParams.getById)
        .delete(app.api.localParams.remove)

    app.route('/siap-publicacoes')
        .all(app.config.passport.authenticate())
        .post(app.api.siapPublicacoes.save)
        .get(app.api.siapPublicacoes.get)
    app.route('/siap-publicacoes/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.siapPublicacoes.save)
        .get(app.api.siapPublicacoes.getById)
        .delete(app.api.siapPublicacoes.remove)

    app.route('/remun-adfg')
        .all(app.config.passport.authenticate())
        .post(app.api.remunADFG.save)
        .get(app.api.remunADFG.get)
    app.route('/remun-adfg/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.remunADFG.save)
        .get(app.api.remunADFG.getById)
        .delete(app.api.remunADFG.remove)

    app.route('/remun-oe/:id_serv_vinc')
        .all(app.config.passport.authenticate())
        .post(app.api.remunOE.save)
        .get(app.api.remunOE.get)
    app.route('/remun-oe/:id_serv_vinc/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.remunOE.save)
        .get(app.api.remunOE.getById)
        .delete(app.api.remunOE.remove)

    app.route('/remun-params')
        .all(app.config.passport.authenticate())
        .post(app.api.remunParams.save)
        .get(app.api.remunParams.get)
    app.route('/remun-params/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.remunParams.save)
        .get(app.api.remunParams.getById)
        .delete(app.api.remunParams.remove)

    app.route('/remuneracao/:id_vinculo')
        .all(app.config.passport.authenticate())
        .post(app.api.remuneracao.save)
        .get(app.api.remuneracao.get)
    app.route('/remuneracao/:id_vinculo/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.remuneracao.save)
        .get(app.api.remuneracao.getById)
        .delete(app.api.remuneracao.remove)

    app.route('/serv-afastamentos/:id_serv_vinc')
        .all(app.config.passport.authenticate())
        .post(app.api.servAfastamento.save)
        .get(app.api.servAfastamento.get)
    app.route('/serv-afastamentos/:id_serv_vinc/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.servAfastamento.save)
        .get(app.api.servAfastamento.getById)
        .delete(app.api.servAfastamento.remove)

    app.route('/serv-desligamento/:id_serv_vinc')
        .all(app.config.passport.authenticate())
        .post(app.api.servDesligamento.save)
        .get(app.api.servDesligamento.get)
    app.route('/serv-desligamento/:id_serv_vinc/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.servDesligamento.save)
        .get(app.api.servDesligamento.getById)
        .delete(app.api.servDesligamento.remove)

    app.route('/serv-ferias/:id_serv_vinc')
        .all(app.config.passport.authenticate())
        .post(app.api.servFerias.save)
        .get(app.api.servFerias.get)
    app.route('/serv-ferias/:id_serv_vinc/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.servFerias.save)
        .get(app.api.servFerias.getById)
        .delete(app.api.servFerias.remove)

    app.route('/serv-reintegracao/:id_serv_vinc')
        .all(app.config.passport.authenticate())
        .post(app.api.servReintegracao.save)
        .get(app.api.servReintegracao.get)
    app.route('/serv-reintegracao/:id_serv_vinc/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.servReintegracao.save)
        .get(app.api.servReintegracao.getById)
        .delete(app.api.servReintegracao.remove)

    app.route('/serv-cessao/:id_serv_vinc')
        .all(app.config.passport.authenticate())
        .post(app.api.servCessao.save)
        .get(app.api.servCessao.get)
    app.route('/serv-cessao/:id_serv_vinc/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.servCessao.save)
        .get(app.api.servCessao.getById)
        .delete(app.api.servCessao.remove)

    app.route('/beneficiarios')
        .all(app.config.passport.authenticate())
        .post(app.api.beneficiarios.save)
        .get(app.api.beneficiarios.get)
    app.route('/beneficiarios/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.beneficiarios.save)
        .get(app.api.beneficiarios.getById)
        .delete(app.api.beneficiarios.remove)

    app.route('/ben-dependentes/:id_benef')
        .all(app.config.passport.authenticate())
        .post(app.api.benDependentes.save)
        .get(app.api.benDependentes.get)
    app.route('/ben-dependentes/:id_benef/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.benDependentes.save)
        .get(app.api.benDependentes.getById)
        .delete(app.api.benDependentes.remove)

    app.route('/ben-vinculos/:id_benef')
        .all(app.config.passport.authenticate())
        .post(app.api.benVinculos.save)
        .get(app.api.benVinculos.get)
    app.route('/ben-vinculos/:id_benef/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.benVinculos.save)
        .get(app.api.benVinculos.getById)
        .delete(app.api.benVinculos.remove)

    app.route('/ben-beneficios/:id_ben_vinc')
        .all(app.config.passport.authenticate())
        .post(app.api.benBeneficios.save)
        .get(app.api.benBeneficios.get)
    app.route('/ben-beneficios/:id_ben_vinc/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.benBeneficios.save)
        .get(app.api.benBeneficios.getById)
        .delete(app.api.benBeneficios.remove)

    app.route('/ben-beneficios/:id_ben_vinc')
        .all(app.config.passport.authenticate())
        .post(app.api.benBeneficios.save)
        .get(app.api.benBeneficios.get)
    app.route('/ben-beneficios/:id_ben_vinc/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.benBeneficios.save)
        .get(app.api.benBeneficios.getById)
        .delete(app.api.benBeneficios.remove)

    app.route('/tabelas-cc')
        .all(app.config.passport.authenticate())
        .post(app.api.tabelasCC.save)
        .get(app.api.tabelasCC.get)
    app.route('/tabelas-cc/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.tabelasCC.save)
        .get(app.api.tabelasCC.getById)
        .delete(app.api.tabelasCC.remove)

    app.route('/tabelas/:id_emp')
        .all(app.config.passport.authenticate())
        .post(app.api.tabelas.save)
        .get(app.api.tabelas.get)
    app.route('/tabelas/:id_emp/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.tabelas.save)
        .get(app.api.tabelas.getById)
        .delete(app.api.tabelas.remove)

    app.route('/aux-pccs')
        .all(app.config.passport.authenticate())
        .post(app.api.auxPccs.save)
        .get(app.api.auxPccs.get)
    app.route('/aux-pccs/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.auxPccs.save)
        .get(app.api.auxPccs.getById)
        .delete(app.api.auxPccs.remove)

    app.route('/aux-classes')
        .all(app.config.passport.authenticate())
        .post(app.api.auxClasses.save)
        .get(app.api.auxClasses.get)
    app.route('/aux-classes/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.auxClasses.save)
        .get(app.api.auxClasses.getById)
        .delete(app.api.auxClasses.remove)

    app.route('/aux-centros')
        .all(app.config.passport.authenticate())
        .post(app.api.auxCentros.save)
        .get(app.api.auxCentros.get)
    app.route('/aux-centros/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.auxCentros.save)
        .get(app.api.auxCentros.getById)
        .delete(app.api.auxCentros.remove)

    app.route('/aux-departamentos')
        .all(app.config.passport.authenticate())
        .post(app.api.auxDepartamentos.save)
        .get(app.api.auxDepartamentos.get)
    app.route('/aux-departamentos/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.auxDepartamentos.save)
        .get(app.api.auxDepartamentos.getById)
        .delete(app.api.auxDepartamentos.remove)

    app.route('/aux-locacoes')
        .all(app.config.passport.authenticate())
        .post(app.api.auxLocacoes.save)
        .get(app.api.auxLocacoes.get)
    app.route('/aux-locacoes/:id')
        .all(app.config.passport.authenticate())
        .put(app.api.auxLocacoes.save)
        .get(app.api.auxLocacoes.getById)
        .delete(app.api.auxLocacoes.remove)
    

}