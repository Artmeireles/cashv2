const moment = require('moment')
const { dbPrefix, jasperServerUrl, jasperServerU, jasperServerK } = require("../.env")
const { baseFrontendUrl } = require("../config/params")
const JSIntegration = require('../config/jSIntegration')
const { cnpj } = require('cpf-cnpj-validator')
const accents = require('remove-accents')
const path = require('path')
const fs = require('fs')

module.exports = app => {
    const { isMatchOrError, noAccessMsg, existsOrError } = app.api.validation
    const { capitalizeFirstLetter, capitalizeWords } = app.api.facilities
    const STATUS_ACTIVE = 10
    const tabelaOrgao = 'orgao'
    const tabelaServidores = 'cad_servidores'
    const tabelaEventos = 'fin_eventos'
    const tabelaRubricas = 'fin_rubricas'
    const tabelaFuncional = 'fin_sfuncional'
    const tabelaCentros = 'cad_centros'
    const tabelaCargos = 'cad_cargos'
    const tabelaDepartamentos = 'cad_departamentos'
    const tabelaPcc = 'cad_pccs'
    const tabelaClasses = 'cad_classes'

    const getByFunction = async (req, res) => {
        const func = req.params.func
        switch (func) {
            case 'gfo':
                getReportFolha(req, res)
                break;
            case 'cch':
                getCCheque(req, res)
                break;
            case 'ffa':
                getFichaFA(req, res)
                break;
            case 'ffs':
                getFichaFS(req, res)
                break;
            case 'frs':
                getFichaRS(req, res)
                break;
            case 'can':
                getContratosAnalitivo(req, res)
                break;
            case 'cna':
                getConsignadosAnalitico(req, res)
                break;
            case 'cne':
                getConsignadosExtrato(req, res)
                break;
            default:
                res.status(404).send('Função inexitente')
                break;
        }
    }

    const getReportFolha = async (req, res) => {
        const uParams = await app.db('users').where({ id: req.user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.id && uParams.financeiro >= 1, `${noAccessMsg} "Impressão de relatório da folha de pagamentos"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const body = { ...req.body }
        const dbSchema = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}`
        const tabelaDomainOrgao = `${dbSchema}.${tabelaOrgao}`

        const orgao = await app.db({ o: tabelaDomainOrgao }).select('o.orgao', 'o.cnpj', 'o.url_logo').first()
        const complementar = body.complementar || uParams.f_complementar
        const complementarTitle = complementar != "000" ? ` - Complementar: ${complementar}` : ""
        moment.locale('pt-br');
        const defaultTitle = `Relatorio Geral da Folha de Pagamento ${capitalizeFirstLetter(moment({ year: uParams.f_ano, month: uParams.f_mes - 1 }).format("MMMM/YYYY"))}${complementarTitle}`
        const fileName = body.fileName || `Relatorio_Folha_Pagamento_${capitalizeFirstLetter(moment({ year: uParams.f_ano, month: uParams.f_mes - 1 }).format("MMMM_YYYY"))}`

        const optionParameters = {
            "orgao": accents.remove(orgao.orgao),
            // Encaminhar parâmetros abaixo pelo body
            "logoUrl": body.logo_url || orgao.url_logo || `${baseFrontendUrl}/assets/imgs/logo_cash.png`,
            "titulo": accents.remove(body.titulo || defaultTitle),
            "descricao": accents.remove(body.descricao || `CNPJ: ${cnpj.format(orgao.cnpj)}`),
            "dbSchema": dbSchema,
            "emitidoPor": uParams.name,
            "ano": body.ano || uParams.f_ano,
            "mes": body.mes || uParams.f_mes,
            "complementar": complementar,
            "id_cad_servidores": body.id_cad_servidores || "ff.id_cad_servidores IS NOT NULL",
            "id_cad_centros": body.id_cad_centros || "ff.id_cad_centros IS NOT NULL",
            "id_cad_departamentos": body.id_cad_departamentos || "ff.id_cad_departamentos IS NOT NULL",
            "id_cad_cargos": body.id_cad_cargos || "ff.id_cad_cargos IS NOT NULL",
            "id_cad_locais_trabalho": body.id_local_trabalho || "ff.id_local_trabalho IS NOT NULL",
            "resumo": body.resumo || "1",
            "geral": body.geral || "1",
            "agrupar": body.agrupar || "0",
            "grupo": body.grupo || "",
            "resumirGrupo": body.resumirGrupo || "0",
            "groupBy": body.groupBy || "cs.nome, cs.matricula",
            "orderBy": body.orderBy || "cs.nome, cs.matricula",
        }

        const exportType = body.exportType || 'pdf'

        const jsIntegration = new JSIntegration(
            jasperServerUrl, // URL of the Jasper Server
            'reports/Cash/folha_de_pagamento/folha', // Path to the Report Unit
            exportType, // Export type
            jasperServerU, // User
            jasperServerK, // Password
            optionParameters // Optional parameters
        )
        const data = jsIntegration.execute()
            .then((data) => {
                res.setHeader("Content-Type", `application/${exportType}`);
                res.setHeader("Content-Disposition", `inline; filename=${fileName}.${exportType}`);
                res.setHeader("Content-Length", data.length);
                if (body.encoding == 'base64') res.send(Buffer.from(data).toString('base64'))
                else res.send(data)
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } });
                res.send(error)
            });
    }

    const getFichaFA = async (req, res) => {
        const uParams = await app.db('users').where({ id: req.user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.id && uParams.cad_servidores >= 1, `${noAccessMsg} "Impressão de ficha financeira analítica"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const body = { ...req.body }
        const dbSchema = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}`
        const tabelaDomainOrgao = `${dbSchema}.${tabelaOrgao}`

        const orgao = await app.db({ o: tabelaDomainOrgao }).select('o.orgao', 'o.cnpj', 'o.url_logo').first()
        moment.locale('pt-br');
        const defaultTitle = `Ficha Financeira Analitica ${capitalizeFirstLetter(moment({ year: uParams.f_ano, month: uParams.f_mes - 1 }).format("YYYY"))}`
        const fileName = body.fileName || `Ficha_Financeira_Analitica_${capitalizeFirstLetter(moment({ year: uParams.f_ano, month: uParams.f_mes - 1 }).format("YYYY"))}`

        const optionParameters = {
            // Encaminhar parâmetros abaixo pelo body
            "titulo": accents.remove(body.titulo || defaultTitle),
            "descricao": accents.remove(body.descricao || `CNPJ: ${cnpj.format(orgao.cnpj)}`),
            "dbSchema": dbSchema,
            "emitidoPor": uParams.name,
            "ano": body.ano || uParams.f_ano,
            "id_cad_servidores": body.id_cad_servidores || "ff.id_cad_servidores IS NOT NULL",
            "id_cad_centros": body.id_cad_centros || "ff.id_cad_centros IS NOT NULL",
            "id_cad_departamentos": body.id_cad_departamentos || "ff.id_cad_departamentos IS NOT NULL",
            "id_cad_cargos": body.id_cad_cargos || "ff.id_cad_cargos IS NOT NULL",
            "id_cad_locais_trabalho": body.id_local_trabalho || "ff.id_local_trabalho IS NOT NULL",
            "resumo": body.resumo || "1",
            "geral": body.geral || "1",
            "agrupar": body.agrupar || "0",
            "grupo": body.grupo || "",
            "resumirGrupo": body.resumirGrupo || "0",
            "groupBy": body.groupBy || "ff.ano, ff.mes, ff.complementar, cs.nome, cs.matricula",
            "orderBy": body.orderBy || "ff.ano, ff.mes, ff.complementar, cs.nome, cs.matricula",
        }

        const exportType = body.exportType || 'pdf'

        const jsIntegration = new JSIntegration(
            jasperServerUrl, // URL of the Jasper Server
            'reports/Cash/fichas_de_servidores/analitica', // Path to the Report Unit
            exportType, // Export type
            jasperServerU, // User
            jasperServerK, // Password
            optionParameters // Optional parameters
        )
        const data = jsIntegration.execute()
            .then((data) => {
                res.setHeader("Content-Type", `application/${exportType}`);
                res.setHeader("Content-Disposition", `inline; filename=${fileName}.${exportType}`);
                res.setHeader("Content-Length", data.length);
                if (body.encoding == 'base64') res.send(Buffer.from(data).toString('base64'))
                else
                    res.send(data)
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } });
                res.send(error)
            });
    }

    const getFichaFS = async (req, res) => {
        const uParams = await app.db('users').where({ id: req.user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.id && uParams.cad_servidores >= 1, `${noAccessMsg} "Impressão de ficha financeira sintética"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const body = { ...req.body }
        const dbSchema = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}`
        const tabelaDomainOrgao = `${dbSchema}.${tabelaOrgao}`

        const orgao = await app.db({ o: tabelaDomainOrgao }).select('o.orgao', 'o.cnpj', 'o.url_logo').first()
        moment.locale('pt-br');
        const defaultTitle = `Ficha Financeira Sintetica ${capitalizeFirstLetter(moment({ year: uParams.f_ano, month: uParams.f_mes - 1 }).format("YYYY"))}`
        const fileName = body.fileName || `Ficha_Financeira_Sintetica_${capitalizeFirstLetter(moment({ year: uParams.f_ano, month: uParams.f_mes - 1 }).format("YYYY"))}`

        const optionParameters = {
            // Encaminhar parâmetros abaixo pelo body
            "titulo": accents.remove(body.titulo || defaultTitle),
            "descricao": accents.remove(body.descricao || `CNPJ: ${cnpj.format(orgao.cnpj)}`),
            "dbSchema": dbSchema,
            "emitidoPor": uParams.name,
            "ano": body.ano || uParams.f_ano,
            "id_cad_servidores": body.id_cad_servidores || "ff.id_cad_servidores IS NOT NULL",
            "id_cad_centros": body.id_cad_centros || "ff.id_cad_centros IS NOT NULL",
            "id_cad_departamentos": body.id_cad_departamentos || "ff.id_cad_departamentos IS NOT NULL",
            "id_cad_cargos": body.id_cad_cargos || "ff.id_cad_cargos IS NOT NULL",
            "id_cad_locais_trabalho": body.id_local_trabalho || "ff.id_local_trabalho IS NOT NULL",
            "resumo": body.resumo || "1",
            "geral": body.geral || "1",
            "agrupar": body.agrupar || "0",
            "grupo": body.grupo || "",
            "resumirGrupo": body.resumirGrupo || "0",
            "groupBy": body.groupBy || "ff.ano, ff.mes, ff.complementar, cs.nome, cs.matricula",
            "orderBy": body.orderBy || "ff.ano, ff.mes, ff.complementar, cs.nome, cs.matricula",
        }

        const exportType = body.exportType || 'pdf'

        const jsIntegration = new JSIntegration(
            jasperServerUrl, // URL of the Jasper Server
            'reports/Cash/fichas_de_servidores/sintetica', // Path to the Report Unit
            exportType, // Export type
            jasperServerU, // User
            jasperServerK, // Password
            optionParameters // Optional parameters
        )
        const data = jsIntegration.execute()
            .then((data) => {
                res.setHeader("Content-Type", `application/${exportType}`);
                res.setHeader("Content-Disposition", `inline; filename=${fileName}.${exportType}`);
                res.setHeader("Content-Length", data.length);
                if (body.encoding == 'base64') res.send(Buffer.from(data).toString('base64'))
                else
                    res.send(data)
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } });
                res.send(error)
            });
    }

    const getFichaRS = async (req, res) => {
        const uParams = await app.db('users').where({ id: req.user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.id && uParams.cad_servidores >= 1, `${noAccessMsg} "Impressão de ficha financeira sintética"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const body = { ...req.body }

        try {
            existsOrError(body.matricula, 'Matrícula não informada')
            existsOrError(body.id_cad_servidor, 'Servidor não informado')
        } catch (error) {
            return res.status(400).send(error)
        }
        const dbSchema = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}`
        const tabelaDomainServidores = `${dbSchema}.${tabelaServidores}`
        const tabelaDomainOrgao = `${dbSchema}.${tabelaOrgao}`

        const orgao = await app.db({ o: tabelaDomainOrgao }).select('o.orgao', 'o.cnpj', 'o.url_logo').first()
        moment.locale('pt-br');
        const defaultTitle = `Ficha de Recadastro`
        const fileName = body.fileName || `Ficha_Recadastro_${body.matricula}`
        req.bodyFoto = {
            root: `images/${uParams.cliente}/${uParams.dominio}`,
            asset: body.matricula,
            extension: "jpg",
        }
        const fotoServidor = await getAsset(req)

        await app.db(tabelaDomainServidores)
            .update({ foto64: fotoServidor })
            .where({ id: body.id_cad_servidor })
        const optionParameters = {
            // Encaminhar parâmetros abaixo pelo body
            "titulo": accents.remove(body.titulo || defaultTitle),
            "descricao": accents.remove(body.descricao || `CNPJ: ${cnpj.format(orgao.cnpj)}`),
            "dbSchema": dbSchema,
            "emitidoPor": uParams.name,
            "ano": body.ano || uParams.f_ano,
            "mes": body.mes || uParams.f_mes,
            "complementar": body.complementar || uParams.f_complementar,
            "id_cad_servidores": body.id_cad_servidores || `ff.id_cad_servidores = ${body.id_cad_servidor}`,
            "id_cad_centros": body.id_cad_centros || "ff.id_cad_centros IS NOT NULL",
            "id_cad_departamentos": body.id_cad_departamentos || "ff.id_cad_departamentos IS NOT NULL",
            "id_cad_cargos": body.id_cad_cargos || "ff.id_cad_cargos IS NOT NULL",
            "id_cad_locais_trabalho": body.id_local_trabalho || "ff.id_local_trabalho IS NOT NULL",
            "resumo": body.resumo || "1",
            "geral": body.geral || "1",
            "agrupar": body.agrupar || "0",
            "grupo": body.grupo || "",
            "resumirGrupo": body.resumirGrupo || "0",
            "groupBy": body.groupBy || "ff.id_cad_servidores",
            "orderBy": body.orderBy || "cs.nome, cs.matricula",
            "matricula": body.matricula,
            "id_cad_servidor": body.id_cad_servidor
        }

        const exportType = body.exportType || 'pdf'

        const jsIntegration = new JSIntegration(
            jasperServerUrl, // URL of the Jasper Server
            'reports/Cash/fichas_de_servidores/fichaRecadastro', // Path to the Report Unit
            exportType, // Export type
            jasperServerU, // User
            jasperServerK, // Password
            optionParameters // Optional parameters
        )
        const data = jsIntegration.execute()
            .then((data) => {
                res.setHeader("Content-Type", `application/${exportType}`);
                res.setHeader("Content-Disposition", `inline; filename=${fileName}.${exportType}`);
                res.setHeader("Content-Length", data.length);
                if (body.encoding == 'base64') res.send(Buffer.from(data).toString('base64'))
                else
                    res.send(data)
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } });
                res.send(error)
            });
    }

    const getCCheque = async (req, res) => {
        const uParams = await app.db('users').where({ id: req.user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.id && (uParams.id == req.user.id || uParams.cad_servidores >= 1), `${noAccessMsg} "Impressão de Contracheque"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const body = { ...req.body }
        const dbSchema = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}`
        const tabelaDomainOrgao = `${dbSchema}.${tabelaOrgao}`

        const orgao = await app.db({ o: tabelaDomainOrgao }).select('o.orgao', 'o.cnpj', 'o.url_logo').first()
        const complementar = body.complementar || uParams.f_complementar
        const complementarTitle = complementar != "000" ? ` - Complementar: ${complementar}` : ""
        moment.locale('pt-br');
        const defaultTitle = `Demonstrativo de Pagamento de Salário de ${capitalizeFirstLetter(moment({ year: uParams.f_ano, month: uParams.f_mes - 1 }).format("MMMM/YYYY"))}${complementarTitle}`
        const fileName = body.fileName || `Contracheque_${capitalizeFirstLetter(moment({ year: uParams.f_ano, month: uParams.f_mes - 1 }).format("MMMM_YYYY"))}`

        const optionParameters = {
            "orgao": accents.remove(orgao.orgao),
            // Encaminhar parâmetros abaixo pelo body
            "logoUrl": body.logo_url || orgao.url_logo || `${baseFrontendUrl}/assets/imgs/logo_cash.png`,
            "titulo": accents.remove(body.titulo || defaultTitle),
            "descricao": accents.remove(body.descricao || `CNPJ: ${cnpj.format(orgao.cnpj)}`),
            "dbSchema": dbSchema,
            "emitidoPor": uParams.name,
            "ano": body.ano || uParams.f_ano,
            "mes": body.mes || uParams.f_mes,
            "complementar": complementar,
            "id_cad_servidores": body.id_cad_servidores || "ff.id_cad_servidores IS NOT NULL",
            "id_cad_centros": body.id_cad_centros || "ff.id_cad_centros IS NOT NULL",
            "id_cad_departamentos": body.id_cad_departamentos || "ff.id_cad_departamentos IS NOT NULL",
            "id_cad_cargos": body.id_cad_cargos || "ff.id_cad_cargos IS NOT NULL",
            "id_cad_locais_trabalho": body.id_local_trabalho || "ff.id_local_trabalho IS NOT NULL",
            "resumo": body.resumo || "1",
            "geral": body.geral || "1",
            "agrupar": body.agrupar || "0",
            "grupo": body.grupo || "",
            "resumirGrupo": body.resumirGrupo || "0",
            "groupBy": body.groupBy || "cs.nome, cs.matricula",
            "orderBy": body.orderBy || "cs.nome, cs.matricula",
        }

        const exportType = body.exportType || 'pdf'

        const jsIntegration = new JSIntegration(
            jasperServerUrl, // URL of the Jasper Server
            'reports/Cash/cad_servidores/contracheque', // Path to the Report Unit
            exportType, // Export type
            jasperServerU, // User
            jasperServerK, // Password
            optionParameters // Optional parameters
        )
        const data = jsIntegration.execute()
            .then((data) => {
                res.setHeader("Content-Type", `application/${exportType}`);
                res.setHeader("Content-Disposition", `inline; filename=${fileName}.${exportType}`);
                res.setHeader("Content-Length", data.length);
                if (body.encoding == 'base64') res.send(Buffer.from(data).toString('base64'))
                else
                    res.send(data)
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } });
                res.send(error)
            });
    }

    const getConsignadosAnalitico = async (req, res) => {
        const uParams = await app.db('users').where({ id: req.user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.id && (uParams.id == req.user.id || uParams.cad_servidores >= 1), `${noAccessMsg} "Relatório Analítico das Consignações"`)
        } catch (error) {
            return res.status(401).send(error)
        }

        const dbSchema = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}`
        const tabelaBancosDomain = `${dbSchema}.cad_bancos`
        const tabelaConsignatarioDomain = `${dbSchema}.consignatarios`
        const body = { ...req.body }
        try {
            existsOrError(body.mes, 'Mês da impressão não informado')
            existsOrError(body.ano, 'Ano da impressão não informado')
            existsOrError(body.idConsignatario, 'Banco consignatário não informado')
            existsOrError(body.exportType, 'Tipo de arquivo não informado')
            existsOrError(body.titulo, 'Título do relatório não informado')
            existsOrError(body.descricao, 'Descrição do relatório não informada')
        } catch (error) {
            return res.status(400).send(error)
        }
        moment.locale('pt-br');
        const defaultTitle = "Relatório Relatório de Fechamento Mensal Sintético"
        const fileName = body.fileName || `Resumo Analitico de Consignações Ativas ${capitalizeFirstLetter(moment({ year: body.ano, month: body.mes - 1 }).format("MMMM_YYYY"))}`
        const idConsignatario = await app.db({ cn: tabelaConsignatarioDomain }).select('cn.id')
            .join({ cb: tabelaBancosDomain }, 'cb.id', '=', 'cn.id_cad_bancos')
            .where({ 'cb.febraban': body.idConsignatario }).first()

        try {
            existsOrError(idConsignatario, 'Banco consignatário não localizado')
        } catch (error) {
            return res.status(400).send(error)
        }

        const optionParameters = {
            "titulo": accents.remove(body.titulo || defaultTitle),
            "descricao": accents.remove(body.descricao || `Informações referente ao exercício ${body.mes}/${body.ano}`),
            "dbSchema": dbSchema,
            "emitidoPor": uParams.name,
            "ano": body.ano || uParams.f_ano,
            "mes": body.mes || uParams.f_mes,
            "idConsignatario": idConsignatario.id
        }

        const exportType = body.exportType || 'pdf'

        const jsIntegration = new JSIntegration(
            jasperServerUrl, // URL of the Jasper Server
            'reports/Cash/consignados/consignacoesAnalitico', // Path to the Report Unit
            exportType, // Export type
            jasperServerU, // User
            jasperServerK, // Password
            optionParameters // Optional parameters
        )
        const data = jsIntegration.execute()
            .then((data) => {
                res.setHeader("Content-Type", `application/${exportType}`);
                res.setHeader("Content-Disposition", `inline; filename=${fileName}.${exportType}`);
                res.setHeader("Content-Length", data.length);
                if (body.encoding == 'base64') res.send(Buffer.from(data).toString('base64'))
                else
                    res.send(data)
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } });
                res.send(error)
            });
    }

    const getConsignadosExtrato = async (req, res) => {
        const uParams = await app.db('users').where({ id: req.user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.id && (uParams.id == req.user.id || uParams.cad_servidores >= 1), `${noAccessMsg} "Relatório Analítico das Consignações"`)
        } catch (error) {
            return res.status(401).send(error)
        }

        const dbSchema = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}`
        const tabelaBancosDomain = `${dbSchema}.cad_bancos`
        const tabelaConsignatarioDomain = `${dbSchema}.consignatarios`
        const body = { ...req.body }
        try {
            existsOrError(body.mes, 'Mês da impressão não informado')
            existsOrError(body.ano, 'Ano da impressão não informado')
            existsOrError(body.idConsignatario, 'Banco consignatário não informado')
            existsOrError(body.exportType, 'Tipo de arquivo não informado')
            existsOrError(body.titulo, 'Título do relatório não informado')
            existsOrError(body.descricao, 'Descrição do relatório não informada')
        } catch (error) {
            return res.status(400).send(error)
        }
        moment.locale('pt-br');
        const defaultTitle = "Relatório de Fechamento Mensal Sintético"
        const fileName = body.fileName || `Relatório de Fechamento Mensal Sintético ${capitalizeFirstLetter(moment({ year: body.ano, month: body.mes - 1 }).format("MMMM_YYYY"))}`
        const idConsignatario = await app.db({ cn: tabelaConsignatarioDomain }).select('cn.id')
            .join({ cb: tabelaBancosDomain }, 'cb.id', '=', 'cn.id_cad_bancos')
            .where({ 'cb.febraban': body.idConsignatario }).first()
        try {
            existsOrError(idConsignatario, 'Banco consignatário não localizado')
        } catch (error) {
            return res.status(400).send(error)
        }

        const optionParameters = {
            "titulo": accents.remove(body.titulo || defaultTitle),
            "descricao": accents.remove(body.descricao || `Informações referente ao exercício laboral de ${moment(this.vencimento).format("MMMM")} de ${moment(this.vencimento).format("YYYY")}`),
            "dbSchema": dbSchema,
            "emitidoPor": uParams.name,
            "ano": body.ano || uParams.f_ano,
            "mes": body.mes || uParams.f_mes,
            "idConsignatario": idConsignatario.id
        }

        const exportType = body.exportType || 'pdf'
        const jsIntegration = new JSIntegration(
            jasperServerUrl, // URL of the Jasper Server
            'reports/Cash/consignados/consignacoesExtrato', // Path to the Report Unit
            exportType, // Export type
            jasperServerU, // User
            jasperServerK, // Password
            optionParameters // Optional parameters
        )
        const data = jsIntegration.execute()
            .then((data) => {
                res.setHeader("Content-Type", `application/${exportType}`);
                res.setHeader("Content-Disposition", `inline; filename=${fileName}.${exportType}`);
                res.setHeader("Content-Length", data.length);
                if (body.encoding == 'base64') res.send(Buffer.from(data).toString('base64'))
                else
                    res.send(data)
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } });
                res.send(error)
            });
    }

    const getAsset = async (req, res) => {
        const body = { ...req.bodyFoto }
        const uParams = { ...req.user };
        const root = body.root || undefined
        const asset = body.asset || undefined
        const extension = body.extension || undefined
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.id, `${noAccessMsg} "Exibição de arquivo do sistema"`)
            existsOrError(root, "Endereço do arquivo não informado")
            existsOrError(asset, "Nome do arquivo não informado")
            existsOrError(extension, "Extensão do arquivo não informado")
        } catch (error) {
            app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } });
            return res.status(401).send(error)
        }
        const dir = path.join(__dirname, "../assets")
        const file = path.join(dir, `${root}/${asset}.${extension}`);
        if (file.indexOf(dir + path.sep) !== 0) {
            return res.status(403).end('Forbidden');
        }
        try {
            let imagem = fs.readFileSync(file);
            imagem = Buffer.from(imagem).toString('base64')
            return imagem
        } catch (error) {
            return null
        }
    }

    const getContratosAnalitivo = async (req, res) => {
        const uParams = await app.db('users').where({ id: req.user.id }).first();
        try {
            // Alçada para exibição
            isMatchOrError(uParams && uParams.id && (uParams.id == req.user.id || uParams.con_contratos >= 1), `${noAccessMsg} "Impressão de Relatórios da Consignação"`)
        } catch (error) {
            return res.status(401).send(error)
        }
        const body = { ...req.body }
        const dbSchema = `${dbPrefix}_${uParams.cliente}_${uParams.dominio}`
        const tabelaDomainOrgao = `${dbSchema}.${tabelaOrgao}`

        const orgao = await app.db({ o: tabelaDomainOrgao }).select('o.orgao', 'o.cnpj', 'o.url_logo').first()
        moment.locale('pt-br');
        const defaultTitle = `Relatório Relatório de Fechamento Mensal Sintético`
        const fileName = body.fileName || `Contracheque_${capitalizeFirstLetter(moment({ year: uParams.f_ano, month: uParams.f_mes - 1 }).format("MMMM_YYYY"))}`

        const optionParameters = {
            "titulo": accents.remove(body.titulo || defaultTitle),
            "descricao": accents.remove(body.descricao || `CNPJ: ${cnpj.format(orgao.cnpj)}`),
            "dbSchema": dbSchema,
            "emitidoPor": uParams.name,
            "ano": body.ano || uParams.f_ano,
            "mes": body.mes || uParams.f_mes,
        }

        const exportType = body.exportType || 'pdf'

        const jsIntegration = new JSIntegration(
            jasperServerUrl, // URL of the Jasper Server
            'reports/Cash/consignados/consignacoesAnalitico', // Path to the Report Unit
            exportType, // Export type
            jasperServerU, // User
            jasperServerK, // Password
            optionParameters // Optional parameters
        )
        const data = jsIntegration.execute()
            .then((data) => {
                res.setHeader("Content-Type", `application/${exportType}`);
                res.setHeader("Content-Disposition", `inline; filename=${fileName}.${exportType}`);
                res.setHeader("Content-Length", data.length);
                if (body.encoding == 'base64') res.send(Buffer.from(data).toString('base64'))
                else
                    res.send(data)
            })
            .catch(error => {
                app.api.logger.logError({ log: { line: `Error in file: ${__filename} (${__function}:${__line}). Error: ${error}`, sConsole: true } });
                res.send(error)
            });
    }

    return { getByFunction }
}