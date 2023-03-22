/**
 * Cria um array das unidades da federação
 * O objetivo é ser usado em form-selects
 */
export const ufList = [
    { value: "null", text: "Selecione" },
    { value: "AC", text: "ACRE" },
    { value: "AL", text: "ALAGOAS" },
    { value: "AP", text: "AMAPÁ" },
    { value: "AM", text: "AMAZONAS" },
    { value: "BA", text: "BAHIA" },
    { value: "CE", text: "CEARÁ" },
    { value: "DF", text: "DISTRITO FEDERAL" },
    { value: "ES", text: "ESPÍRITO SANTO" },
    { value: "GO", text: "GOIÁS" },
    { value: "MA", text: "MARANHÃO" },
    { value: "MT", text: "MATO GROSSO" },
    { value: "MS", text: "MATO GROSSO DO SUL" },
    { value: "MG", text: "MINAS GERAIS" },
    { value: "PA", text: "PARÁ" },
    { value: "PB", text: "PARAÍBA" },
    { value: "PR", text: "PARANÁ" },
    { value: "PE", text: "PERNAMBUCO" },
    { value: "PI", text: "PIAUÍ" },
    { value: "RJ", text: "RIO DE JANEIRO" },
    { value: "RN", text: "RIO GRANDE DO NORTE" },
    { value: "RS", text: "RIO GRANDE DO SUL" },
    { value: "RO", text: "RONDÔNIA" },
    { value: "RR", text: "RORAIMA" },
    { value: "SC", text: "SANTA CATARINA" },
    { value: "SP", text: "SÃO PAULO" },
    { value: "SE", text: "SERGIPE" },
    { value: "TO", text: "TOCANTINS" }
]

/**
 * Cria um array das raças descrita no 
 * http://www.rais.gov.br/sitio/rais_ftp/ManualRAIS2020.pdf
 * O objetivo é ser usado em form-selects
 */
export const racasList = [
    { value: "null", text: "Selecione" },
    { value: "1", text: "Indígena" },
    { value: "2", text: "Branca" },
    { value: "4", text: "Preta/negra" },
    { value: "6", text: "Amarela" },
    { value: "8", text: "Parda" },
    { value: "9", text: "Não informado" }
]

/**
 * Cria um array dos estados civis
 * O objetivo é ser usado em form-selects
 */
export const eCList = [
    { value: "null", text: "Selecione" },
    { value: "1", text: "Casado" },
    { value: "2", text: "Solteiro" },
    { value: "3", text: "Viúvo" },
    { value: "4", text: "Separado Judicialmente" },
    { value: "5", text: "Divorciado" },
]

/**
 * Cria um array dos tipos de deficiência descrita no 
 * http://www.rais.gov.br/sitio/rais_ftp/ManualRAIS2020.pdf
 * O objetivo é ser usado em form-selects
 */
export const deficienciesList = [
    { value: "null", text: "Selecione" },
    { value: "0", text: "Nenhuma" },
    { value: "1", text: "Física" },
    { value: "2", text: "Auditiva" },
    { value: "3", text: "Visual" },
    { value: "4", text: "Intelectual(Mental)" },
    { value: "5", text: "Múltipla" },
    { value: "6", text: "Reabilitado" },
]

/**
 * Cria um array dos códigos de nacionalidade descrita no 
 * http://www.rais.gov.br/sitio/rais_ftp/ManualRAIS2020.pdf
 * O objetivo é ser usado em form-selects
 */
export const nationalitiesList = [
    { value: "null", text: "Selecione" },
    { value: "10", text: "Brasileiro" },
    { value: "20", text: "Naturalizado brasileiro" },
    { value: "21", text: "Argentino" },
    { value: "22", text: "Boliviano" },
    { value: "23", text: "Chileno" },
    { value: "24", text: "Paraguaio" },
    { value: "25", text: "Uruguaio" },
    { value: "26", text: "Venezuelano" },
    { value: "27", text: "Colombiano" },
    { value: "28", text: "Peruano" },
    { value: "29", text: "Equatoriano" },
    { value: "30", text: "Alemão" },
    { value: "31", text: "Belga" },
    { value: "32", text: "Britânico" },
    { value: "34", text: "Canadense" },
    { value: "35", text: "Espanhol" },
    { value: "36", text: "Norte-americano (EUA)" },
    { value: "37", text: "Francês" },
    { value: "38", text: "Suíço" },
    { value: "39", text: "Italiano" },
    { value: "40", text: "Haitiano" },
    { value: "41", text: "Japonês" },
    { value: "42", text: "Chinês" },
    { value: "44", text: "Russo" },
    { value: "45", text: "Português" },
    { value: "46", text: "Paquistanês" },
    { value: "47", text: "Indiano" },
    { value: "48", text: "Outros latino-americanos" },
    { value: "49", text: "Outros asiáticos" },
    { value: "51", text: "Outros Europeus" },
    { value: "52", text: "Guiné Bissau (Guineense)" },
    { value: "53", text: "Marroquino" },
    { value: "54", text: "Cubano" },
    { value: "55", text: "Sírio" },
    { value: "56", text: "Sul-coreana" },
    { value: "59", text: "Bengalês" },
    { value: "60", text: "Angolano" },
    { value: "61", text: "Congolês" },
    { value: "62", text: "Sul - Africano" },
    { value: "63", text: "Ganês" }, 
    { value: "64", text: "Senegalês" },
    { value: "65", text: "Norte-Coreano" },
    { value: "70", text: "Outros Africanos" },
    { value: "80", text: "Outros" }
]

/**
 * Cria um array dos códigos de situacao do registro
 * O objetivo é ser usado em form-selects
 */
export const situationList = [
    { value: null, text: "Selecione" },
    { value: 1, text: "Admitido" },
    { value: 2, text: "Demitido" },
    { value: 3, text: "Afastado" }
]

/**
 * Cria um array dos códigos de situacao funcional do registro
 * O objetivo é ser usado em form-selects
 */
export const fSituationList = [
    { value: null, text: "Selecione" },
    { value: 1, text: "Ativo" },
    { value: 2, text: "Aposentado" },
    { value: 3, text: "Pensionista" }
]

/**
 * Cria um array dos tipos de benefícios para o funcional do registro
 * O objetivo é ser usado em form-selects
 */
export const beneficiosList = [
    { value: null, text: "Nenhum" },
    { value: 1, text: "Invalidez" },
    { value: 2, text: "Idade" },
    { value: 3, text: "Tempo de contribuição" },
    { value: 4, text: "Morte" },
]

/**
 * Cria um array dos tipos de benefícios para o funcional do registro
 * O objetivo é ser usado em form-selects
 */
export const vinculosList = [
    { value: null, text: "Nenhum" },
    { value: 1, text: "Efetivo" },
    { value: 2, text: "Comissionado" },
    { value: 3, text: "Contratado" },
    { value: 4, text: "Aposentado" },
    { value: 5, text: "Pensionista" },
    { value: 6, text: "Eletivo" },
    { value: 7, text: "Estagiário" },
    { value: 8, text: "Contratado por Processo Seletivo" },
    { value: 9, text: "Estabilizado" },
    { value: 10, text: "Requisitado" },
]

/**
 * Cria um array dos códigos de recolhimento da Dirf para o funcional do registro
 * Referência: https://receita.economia.gov.br/orientacao/tributaria/declaracoes-e-demonstrativos/dctf-declaracao-de-debitos-e-creditos-tributarios-federais/tabelas-de-codigos-extensoes/irrf/imposto-de-renda-retido-na-fonte-irrf
 * O objetivo é ser usado em v-selects
 */
export const rendimentosDirfList = [
    { code: "0561", label: "0561 - TRABALHO ASSALARIADO" },
    { code: "0588", label: "0588 - TRABALHO SEM VÍNCULO EMPREGATÍCIO" },
    { code: "1895", label: "1895 - RENDIMENTOS DECORRENTES DE DECISÃO JUDICIAL DOS ESTADOS/DISTRITO FEDERAL" },
    { code: "3208", label: "3208 - ALUGUÉIS E ROYALTIES PAGOS À PESSOA FÍSICA" },
    { code: "3223", label: "3223 - RESGATE PREVIDÊNCIA COMPLEMENTAR - MODALIDADE CONTRIBUIÇÃO DEFINIDA/VARIÁVEL - NÃO OPTANTE TRIBUTAÇÃO EXCLUSIVA" },
    { code: "3277", label: "3277 - RENDIMENTOS DE PARTES BENEFICIÁRIAS OU DE FUNDADOR" },
    { code: "3533", label: "3533 - APOSENTADORIA REGIME GERAL OU DO SERVIDOR PÚBLICO" },
    { code: "3540", label: "3540 - BENEFÍCIO PREVIDÊNCIA COMPLEMENTAR - NÃO OPTANTE TRIBUTAÇÃO EXCLUSIVA" },
    { code: "3556", label: "3556 - RESGATE PREVIDÊNCIA COMPLEMENTAR - MODALIDADE BENEFÍCIO DEFINIDO - NÃO OPTANTE TRIBUTAÇÃO EXCLUSIVA" },
    { code: "5204", label: "5204 - JUROS E INDENIZAÇÕES DE LUCROS CESSANTES" },
    { code: "5928", label: "5928 - RENDIMENTOS DECORRENTES DE DECISÃO DA JUSTIÇA FEDERAL" },
    { code: "5936", label: "5936 - RENDIMENTOS DECORRENTES DE DECISÃO DA JUSTIÇA DO TRABALHO" },
    { code: "9385", label: "9385 - MULTAS E VANTAGENS" }
]

/**
 * Cria um array dos códigos de recolhimento da Dirf para o funcional do registro
 * Referência: https://receita.economia.gov.br/orientacao/tributaria/declaracoes-e-demonstrativos/gfip-sefip-guia-do-fgts-e-informacoes-a-previdencia-social-1/orientacoes-gerais/manualgfipsefip-kit-sefip_versao_84.pdf
 * O objetivo é ser usado em v-selects
 */
export const gfipList = [
    { code: "01", label: "01 - EMPREGADO (INCLUSIVE O EMPREGADO PÚBLICO)" },
    { code: "02", label: "02 - TRABALHADOR AVULSO" },
    { code: "03", label: "03 - TRABALHADOR NÃO VINCULADO AO RGPS, MAS COM DIREITO AO FGTS" },
    { code: "04", label: "04 - EMPREGADO SOB CONTRATO DE TRABALHO POR PRAZO DETERMINADO (LEI N° 9.601/98), COM AS ALTERAÇÕES DA MEDIDA PROVISÓRIA N° 2.164-41, DE 24/08/2001" },
    { code: "05", label: "05 - CONTRIBUINTE INDIVIDUAL - DIRETOR NÃO EMPREGADO COM FGTS (LEI Nº 8.036/90, ART. 16)" },
    { code: "06", label: "06 - EMPREGADO DOMÉSTICO" },
    { code: "07", label: "07 - MENOR APRENDIZ - LEI Nº 11.180/2005" },
    { code: "11", label: "11 - CONTRIBUINTE INDIVIDUAL - DIRETOR NÃO EMPREGADO E DEMAIS EMPRESÁRIOS SEM FGTS" },
    { code: "12", label: "12 - DEMAIS AGENTES PÚBLICOS" },
    { code: "13", label: "13 - CONTRIBUINTE INDIVIDUAL - TRABALHADOR AUTÔNOMO OU A ESTE EQUIPARADO, INCLUSIVE O OPERADOR DE MÁQUINA, COM CONTRIBUIÇÃO SOBRE REMUNERAÇÃO TRABALHADOR ASSOCIADO À COOPERATIVA DE PRODUÇÃO" },
    { code: "14", label: "14 - CONTRIBUINTE INDIVIDUAL - TRABALHADOR AUTÔNOMO OU A ESTE EQUIPARADO, INCLUSIVE O OPERADOR DE MÁQUINA, COM CONTRIBUIÇÃO SOBRE SALÁRIO-BASE" },
    { code: "15", label: "15 - CONTRIBUINTE INDIVIDUAL - TRANSPORTADOR AUTÔNOMO, COM CONTRIBUIÇÃO SOBRE REMUNERAÇÃO" },
    { code: "16", label: "16 - CONTRIBUINTE INDIVIDUAL - TRANSPORTADOR AUTÔNOMO, COM CONTRIBUIÇÃO SOBRE SALÁRIO-BASE" },
    { code: "17", label: "17 - CONTRIBUINTE INDIVIDUAL - COOPERADO QUE PRESTA SERVIÇOS A EMPRESAS CONTRATANTES DA COOPERATIVA DE TRABALHO" },
    { code: "18", label: "18 - CONTRIBUINTE INDIVIDUAL - TRANSPORTADOR COOPERADO QUE PRESTA SERVIÇOS A EMPRESAS CONTRATANTES DA COOPERATIVA DE TRABALHO" },
    { code: "19", label: "19 - AGENTE POLÍTICO" },
    { code: "20", label: "20 - SERVIDOR PÚBLICO OCUPANTE, EXCLUSIVAMENTE, DE CARGO EM COMISSÃO, SERVIDOR PÚBLICO OCUPANTE DE CARGO TEMPORÁRIO" },
    { code: "21", label: "21 - SERVIDOR PÚBLICO TITULAR DE CARGO EFETIVO, MAGISTRADO, MEMBRO DO MINISTÉRIO PÚBLICO E DO TRIBUNAL E CONSELHO DE CONTAS" },
    { code: "22", label: "22 - CONTRIBUINTE INDIVIDUAL - CONTRATADO POR OUTRO CONTRIBUINTE INDIVIDUAL EQUIPARADO A EMPRESA OU POR PRODUTOR RURAL PESSOA FÍSICA OU POR MISSÃO DIPLOMÁTICA E REPARTIÇÃO CONSULAR DE CARREIRA ESTRANGEIRAS" },
    { code: "23", label: "23 - CONTRIBUINTE INDIVIDUAL - TRANSPORTADOR AUTÔNOMO CONTRATADO POR OUTRO CONTRIBUINTE INDIVIDUAL EQUIPARADO À EMPRESA OU POR PRODUTOR RURAL PESSOA FÍSICA OU POR MISSÃO DIPLOMÁTICA E REPARTIÇÃO CONSULAR DE CARREIRA ESTRANGEIRAS" },
    { code: "24", label: "24 - CONTRIBUINTE INDIVIDUAL - COOPERADO QUE PRESTA SERVIÇOS A ENTIDADE BENEFICENTE DE ASSISTÊNCIA SOCIAL ISENTA DA COTA PATRONAL OU A PESSOA FÍSICA, POR INTERMÉDIO DA COOPERATIVA DE TRABALHO" },
    { code: "25", label: "25 - CONTRIBUINTE INDIVIDUAL - TRANSPORTADOR COOPERADO QUE PRESTA SERVIÇOS A ENTIDADE BENEFICENTE DE ASSISTÊNCIA SOCIAL ISENTA DA COTA PATRONAL OU A PESSOA FÍSICA, POR INTERMÉDIO DA COOPERATIVA DE TRABALHO" },
    { code: "26", label: "26 - DIRIGENTE SINDICAL, EM RELAÇÃO AO ADICIONAL PAGO PELO SINDICATO MAGISTRADO CLASSISTA TEMPORÁRIO DA JUSTIÇA DO TRABALHO MAGISTRADO DOS TRIBUNAIS ELEITORAIS, QUANDO, NAS TRÊS SITUAÇÕES, FOR MANTIDA A QUALIDADE DE SEGURADO EMPREGADO (SEM FGTS)." },
]

/**
 * Cria um array dos códigos de ocorrência da Gfip para o funcional do registro
 * Referência: https://receita.economia.gov.br/orientacao/tributaria/declaracoes-e-demonstrativos/gfip-sefip-guia-do-fgts-e-informacoes-a-previdencia-social-1/manuais-e-formularios/manual_gfipsefip_jan2020.pdf
 * O objetivo é ser usado em form-selects
 */
export const gfipOcorrenciasList = [
    { value: null, text: "TRABALHADOR NUNCA ESTEVE EXPOSTO" },
    { value: "01", text: "01 - NÃO EXPOSIÇÃO A AGENTE NOCIVO. TRABALHADOR JÁ ESTEVE EXPOSTO" },
    { value: "02", text: "02 - EXPOSIÇÃO A AGENTE NOCIVO (APOSENTADORIA ESPECIAL AOS 15 ANOS DE TRABALHO)" },
    { value: "03", text: "03 - EXPOSIÇÃO A AGENTE NOCIVO (APOSENTADORIA ESPECIAL AOS 20 ANOS DE TRABALHO)" },
    { value: "04", text: "04 - EXPOSIÇÃO A AGENTE NOCIVO (APOSENTADORIA ESPECIAL AOS 25 ANOS DE TRABALHO)" },
    {
        label: 'Trabalhadores com duplo vínculo',
        options: [
            { value: "05", text: "05 - NÃO EXPOSTO A AGENTE NOCIVO" },
            { value: "06", text: "06 - EXPOSIÇÃO A AGENTE NOCIVO (APOSENTADORIA ESPECIAL AOS 15 ANOS DE TRABALHO)" },
            { value: "07", text: "07 - EXPOSIÇÃO A AGENTE NOCIVO (APOSENTADORIA ESPECIAL AOS 20 ANOS DE TRABALHO)" },
            { value: "08", text: "08 - EXPOSIÇÃO A AGENTE NOCIVO (APOSENTADORIA ESPECIAL AOS 25 ANOS DE TRABALHO)" }
        ]
    }
]

/**
 * Cria um array dos códigos de moléstias para o funcional do registro
 * Referência: MGFolha
 * O objetivo é ser usado em form-selects
 */
export const molestiasList = [
    { value: null, text: "Selecione..." },
    { value: "01", text: "01-AIDS (SÍNDROME DA IMUNODEFICIÊNCIA ADQUIRIDA)" },
    { value: "02", text: "02-ALIENAÇÃO MENTAL" },
    { value: "03", text: "03-CARDIOPATIA GRAVE" },
    { value: "04", text: "04-CEGUEIRA" },
    { value: "05", text: "05-CONTAMINAÇÃO POR RADIAÇÃO" },
    { value: "06", text: "06-DOENÇA DE PAGET EM ESTADOS AVANÇADOS (OSTEÍTE DEFORMANTE)" },
    { value: "07", text: "07-DOENÇA DE PARKINSON" },
    { value: "08", text: "08-ESCLEROSE MÚLTIPLA" },
    { value: "09", text: "09-ESPONDILOARTROSE ANQUILOSANTE" },
    { value: "10", text: "10-FIBROSE CÍSTICA (MUCOVISCIDOSE)" },
    { value: "11", text: "11-PUBLICIDADE" },
    { value: "12", text: "12-HANSENÍASE" },
    { value: "13", text: "13-NEFROPATIA GRAVE" },
    { value: "14", text: "14-HEPATOPATIA GRAVE (NOS CASOS DE HEPATOPATIA GRAVE SOMENTE SERÃO ISENTOS OS RENDIMENTOS AUFERIDOS A PARTIR DE 01/01/2005)" },
    { value: "15", text: "15-NEOPLASIA MALIGNA" },
    { value: "16", text: "16-PARALISIA IRREVERSÍVEL E INCAPACITANTE" },
    { value: "17", text: "17-TUBERCULOSE ATIVA" },
]

/**
 * Cria um array dos códigos de manad para o funcional do registro
 * Referência: MGFolha
 * O objetivo é ser usado em form-selects
 */
export const manadList = [
    { value: null, text: "Selecione..." },
    { value: "1", text: "1 - LEI" },
    { value: "2", text: "2 - DECRETO" },
    { value: "3", text: "3 - PORTARIA" },
    { value: "4", text: "4 - CONTRATO" },
    { value: "9", text: "9 - OUTROS" }
]

/**
 * Cria um array dos códigos de escolaridade de acordo com a RAIS para o funcional do registro
 * Referência: http://www.rais.gov.br/sitio/rais_ftp/ManualRAIS2020.pdf
 * O objetivo é ser usado em form-selects
 */
export const escolaridadeRaisList = [
    { value: null, text: "Selecione..." },
    { value: "01", text: "01. Analfabeto, inclusive o que, embora tenha recebido instrução, não se alfabetizou" },
    { value: "02", text: "02. Até o 5º ano incompleto do Ensino Fundamental (antiga 4ª série) ou que se tenha alfabetizado sem ter frequentado escola regular" },
    { value: "03", text: "03. 5º ano completo do Ensino Fundamental" },
    { value: "04", text: "04. Do 6º ao 9º ano do Ensino Fundamental incompleto (antiga 5ª à 8ª série)" },
    { value: "05", text: "05. Ensino Fundamental completo" },
    { value: "06", text: "06. Ensino Médio incompleto" },
    { value: "07", text: "07. Ensino Médio completo" },
    { value: "08", text: "08. Educação Superior incompleta" },
    { value: "09", text: "09. Educação Superior completa" },
    { value: "10", text: "10. Mestrado completo" },
    { value: "11", text: "11. Doutorado completo" }
]

/**
 * Cria um array dos códigos de escolaridade de acordo com o SICAP para o funcional do registro
 * Referência: http://portal.sicap.tce.al.gov.br/index.php?option=com_content&view=article&id=170:layout-sicap-web-2021&catid=35:arquivos&Itemid=11
 * O objetivo é ser usado em form-selects
 */
export const escolaridadeSicapList = [
    { value: null, text: "Selecione..." },
    { value: "0", text: "0 - Analfabeto(a)" },
    { value: "1", text: "1 - Fundamental Completo" },
    { value: "2", text: "2 - Fundamental Incompleto" },
    { value: "3", text: "3 - Médio Completo" },
    { value: "4", text: "4 - Médio Incompleto" },
    { value: "5", text: "5 - Superior Completo" },
    { value: "6", text: "6 - Superior Incompleto" },
    { value: "7", text: "7 - Outros" }
]

/**
 * Cria um array dos tipos de previdencia para o funcional do registro
 * O objetivo é ser usado em form-radio-groups
 */
export const optionsPrevidencia = [
    { value: "null", text: "Nenhuma" },
    { value: "0", text: "Geral" },
    { value: "4", text: "Própria" }
]

/**
 * Cria um array dos tipos de enios para o funcional do registro
 * O objetivo é ser usado em form-radio-groups
 */
export const optionsEnios = [
    { value: "0", text: "Nenhum" },
    { value: "1", text: "Anuênio" },
    { value: "3", text: "Triênio" },
    { value: "5", text: "Quiquênio" },
    { value: "10", text: "Decênio" },
]

/**
 * Cria um array dos tipos de quebras de página
 * O objetivo é ser usado em formulários de impressão
 */
export const optionsPageBreak = [
    { value: undefined, text: "Sem Quebra" },
    { value: "ff.id_cad_centros", text: "Centro de Custo" },
    { value: "ff.id_cad_departamentos", text: "Departamento" },
    { value: "ff.id_cad_cargos", text: "Cargo" },
]

/**
 * Cria um array dos tipos de quebras de página
 * O objetivo é ser usado em formulários de impressão
 */
export const optionsInNotIn = [
    { value: 'in', text: "Incluir os itens selecionados acima" },
    { value: "not in", text: "Excluir os itens selecionados acima" },
]