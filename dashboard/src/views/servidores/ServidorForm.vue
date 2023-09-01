<script setup>
import { onBeforeMount, ref, watch, watchEffect } from 'vue';
import { baseApiUrl } from '@/env';
import axios from '@/axios-interceptor';
import { defaultSuccess, defaultWarn } from '@/toast';
import { UFS, titleCase, isValidEmail, validarDataPTBR } from '@/global';
import moment from 'moment';

import { Mask } from 'maska';
const masks = ref({
    telefone: new Mask({
        mask: '(##) #####-####'
    }),
    cep: new Mask({
        mask: '##.###-###'
    }),
    cpf_trab: new Mask({
        mask: '###.###.###-##'
    }),
    dt_nascto: new Mask({
        mask: '##/##/####'
    })
});

import { useRoute } from 'vue-router';
const route = useRoute();

import { useRouter } from 'vue-router';
const router = useRouter();

// Cookies de usuário
import { useUserStore } from '@/stores/user';

const store = useUserStore();

// Campos de formulário
const itemData = ref({});
// Modelo de dados usado para comparação
const itemDataComparision = ref({});
// Campos de formulário mascarados
const itemDataMasked = ref({});
// Modo do formulário
const mode = ref('view');
// Aceite do formulário
const accept = ref(false);
// Mensages de erro
const errorMessages = ref({});
// Dropdowns
const dropdownSexo = ref([]);
const dropdownRacaCor = ref([]);
const dropdownEstCivil = ref([]);
const dropdownGrauInstr = ref([]);
const dropdownPaisNascim = ref([]);
const dropdownTpLograd = ref([]);
const dropdownUfs = ref([]);
let dropdownCidades = ref([]);
// Loadings
const loading = ref({
    accepted: null,
    email: null,
    telefone: null
});
// Url base do form action
const urlBase = ref(`${baseApiUrl}/servidores`);
// Carragamento de dados do form
const loadData = async () => {
    itemData.value.id = route.params.id;
    const url = `${urlBase.value}/${itemData.value.id}`;
    await axios.get(url).then((res) => {
        const body = res.data;
        if (body && body.id) {
            body.id = String(body.id);
            body.def_fisica = isTrue(body.def_fisica);
            body.def_visual = isTrue(body.def_visual);
            body.def_auditiva = isTrue(body.def_auditiva);
            body.def_mental = isTrue(body.def_mental);
            body.def_intelectual = isTrue(body.def_intelectual);
            body.reab_readap = isTrue(body.reab_readap);

            itemData.value = body;
            itemDataComparision.value = { ...body };
            if (itemData.value.cpf_trab) itemDataMasked.value.cpf_trab = masks.value.cpf_trab.masked(itemData.value.cpf_trab);
            if (itemData.value.telefone) itemDataMasked.value.telefone = masks.value.telefone.masked(itemData.value.telefone);
            if (itemData.value.cep) itemDataMasked.value.cep = masks.value.cep.masked(itemData.value.cep);
            if (itemData.value.dt_nascto) itemDataMasked.value.dt_nascto = masks.value.dt_nascto.masked(moment(itemData.value.dt_nascto).format('DD/MM/YYYY'));
            getUF();
            loading.value.form = false;
        } else {
            defaultWarn('Registro não localizado');
            router.push({ path: `/${store.userStore.cliente}/${store.userStore.dominio}/servidores` });
        }
    });
};
// Converte 1 ou 0 para boolean
const isTrue = (value) => value === 1;
// Verifica se houve alteração nos dados do formulário
const isItemDataChanged = () => {
    const ret = JSON.stringify(itemData.value) !== JSON.stringify(itemDataComparision.value);
    if (!ret) {
        accept.value = false;
        errorMessages.value = {};
    }
    return ret;
};
// Verifica se o inputSwitch de edições do formulário foi aceito
const formAccepted = () => {
    if (isItemDataChanged() && !accept.value) errorMessages.value.accepted = 'Você deve concordar para prosseguir';
    else errorMessages.value.accepted = null;
    return !errorMessages.value.accepted;
};
// Validar email
const validateEmail = () => {
    if (itemData.value.email && !isValidEmail(itemData.value.email)) {
        errorMessages.value.email = 'Formato de email inválido';
    } else errorMessages.value.email = null;
    return !errorMessages.value.email;
};
// Validar CPF
const validateCPF = () => {
    if (itemDataMasked.value.cpf_trab && itemDataMasked.value.cpf_trab.length > 0 && !masks.value.cpf_trab.completed(itemDataMasked.value.cpf_trab)) {
        errorMessages.value.cpf_trab = 'Formato de CPF inválido';
    } else errorMessages.value.cpf_trab = null;
    return !errorMessages.value.cpf_trab;
};
// Validar telefone
const validateTelefone = () => {
    if (itemDataMasked.value.telefone && itemDataMasked.value.telefone.length > 0 && !masks.value.telefone.completed(itemDataMasked.value.telefone)) {
        errorMessages.value.telefone = 'Formato de telefone inválido';
    } else errorMessages.value.telefone = null;
    return !errorMessages.value.telefone;
};
// Validar Cep
const validateCEP = () => {
    if (itemDataMasked.value.cep && itemDataMasked.value.cep.length > 0 && !masks.value.cep.completed(itemDataMasked.value.cep)) {
        errorMessages.value.cep = 'Formato de CEP inválido';
    } else errorMessages.value.cep = null;
    return !errorMessages.value.cep;
};
// Validar data de nascimento
const validateDtNascto = () => {
    if (itemDataMasked.value.dt_nascto && itemDataMasked.value.dt_nascto.length > 0 && !(masks.value.dt_nascto.completed(itemDataMasked.value.dt_nascto) && moment(itemDataMasked.value.dt_nascto, 'DD/MM/YYYY').isValid())) {
        errorMessages.value.dt_nascto = 'Formato de data inválido';
    } else errorMessages.value.dt_nascto = null;
    return !errorMessages.value.dt_nascto;
};
// Validar formulário
const formIsValid = () => {
    return formAccepted() && validateEmail() && validateTelefone() && validateCEP() && validateDtNascto() && validateCPF();
};
// Setar campos não mascarados
const setUnMasked = (field) => {
    switch (field) {
        case 'cpf_trab':
            if (validateCPF()) itemData.value.cpf_trab = masks.value.cpf_trab.unmasked(itemDataMasked.value.cpf_trab);
            else {
                itemData.value.cpf_trab = itemDataComparision.value.cpf_trab;
                itemDataMasked.value.cpf_trab = masks.value.cpf_trab.masked(itemDataComparision.value.cpf_trab);
            }
            break;
        case 'telefone':
            if (validateTelefone()) itemData.value.telefone = masks.value.telefone.unmasked(itemDataMasked.value.telefone);
            else {
                itemData.value.telefone = itemDataComparision.value.telefone;
                itemDataMasked.value.telefone = masks.value.telefone.masked(itemDataComparision.value.telefone);
            }
            break;
        case 'cep':
            if (validateCEP()) {
                itemData.value.cep = masks.value.cep.unmasked(itemDataMasked.value.cep);
                consultarCep();
            } else {
                itemData.value.cep = itemDataComparision.value.cep;34
                itemDataMasked.value.cep = masks.value.cep.masked(itemDataComparision.value.cep);
            }
            break;
        case 'dt_nascto':
            if (validateDtNascto()) itemData.value.dt_nascto = moment(itemDataMasked.value.dt_nascto, 'DD/MM/YYYY').format('YYYY-MM-DD');
            else {
                itemData.value.dt_nascto = itemDataComparision.value.dt_nascto;
                itemDataMasked.value.dt_nascto = moment(itemDataComparision.value.dt_nascto).format('DD/MM/YYYY');
            }
            break;
        case 'email':
            if (!validateEmail()) itemData.value.email = itemDataComparision.value.email;
            break;
        default:
            true;
            break;
    }
};
// Salvar dados do formulário
const saveData = async () => {
    if (formIsValid()) {
        const url = `${urlBase.value}/${itemData.value.id}`;
        axios
            .put(url, itemData.value)
            .then((res) => {
                const body = res.data;
                if (body && body.id) {
                    defaultSuccess('Registro salvo com sucesso');
                    mode.value = 'view';
                } else {
                    defaultWarn('Erro ao salvar registro');
                }
                reload();
            })
            .catch((err) => {
                defaultWarn(err.response.data);
            });
    }
};
// Recarregar dados do formulário
const reload = () => {
    mode.value = 'view';
    accept.value = false;
    itemDataMasked.value = {};
    errorMessages.value = {};
    loadData();
};
// Obter parâmetros do BD
const optionParams = async (query) => {
    itemData.value.id = route.params.id;
    const selects = query.select ? `&slct=${query.select}` : undefined;
    const url = `${baseApiUrl}/params/f-a/gbf?fld=${query.field}&vl=${query.value}${selects}`;
    return await axios.get(url);
};
// Carregar opções do formulário
const loadOptions = async () => {
    // Sexo
    await optionParams({ field: 'meta', value: 'sexo', select: 'id,label' }).then((res) => {
        res.data.data.map((item) => {
            dropdownSexo.value.push({ value: item.id, label: item.label });
        });
    });
    // Raça
    await optionParams({ field: 'meta', value: 'racaCor', select: 'id,label' }).then((res) => {
        res.data.data.map((item) => {
            dropdownRacaCor.value.push({ value: item.id, label: item.label });
        });
    });
    // Estado Civil
    await optionParams({ field: 'meta', value: 'estCiv', select: 'id,label' }).then((res) => {
        res.data.data.map((item) => {
            dropdownEstCivil.value.push({ value: item.id, label: item.label });
        });
    });
    // Grau instrução
    await optionParams({ field: 'meta', value: 'grauInstr', select: 'id,label' }).then((res) => {
        res.data.data.map((item) => {
            dropdownGrauInstr.value.push({ value: item.id, label: item.label });
        });
    });
    // Pais nascimento
    await optionParams({ field: 'meta', value: 'pais', select: 'id,label' }).then((res) => {
        res.data.data.map((item) => {
            dropdownPaisNascim.value.push({ value: item.id, label: item.label });
        });
    });
    // Tipo logradouro
    await optionParams({ field: 'meta', value: 'tpLograd', select: 'id,label' }).then((res) => {
        res.data.data.map((item) => {
            dropdownTpLograd.value.push({ value: item.id, label: item.label });
        });
    });
};
// Obter cidades
const getCidades = async () => {
    loading.value.cidades = true;
    dropdownCidades = ref([]);
    if (itemData.value.uf) {
        const url = `${baseApiUrl}/cidades/?uf=${itemData.value.uf}`;
        await axios.get(url).then((res) => {
            res.data.data.map((item) => {
                dropdownCidades.value.push({ value: item.id, label: titleCase(item.municipio_nome) });
            });
            loading.value.cidades = false;
        });
    }
};
// Obter UF
const getUF = async () => {
    if (itemData.value.id_cidade) {
        const url = `${baseApiUrl}/cidades-uf?cidade=${itemData.value.id_cidade}`;
        await axios.get(url).then((res) => {
            itemData.value.uf = res.data.uf_abrev;
            itemDataComparision.value.uf = res.data.uf_abrev;
            loading.value.cidades = false;
        });
    }
};
// Consultar CEP
const consultarCep = async () => {
    const cep = itemData.value.cep.replace(/\D/g, '');
    if (cep && cep.length == 8) {
        const url = `https://viacep.com.br/ws/${cep}/json/`;
        await axios.get(url).then((res) => {
            const body = res.data;
            if (body && body.erro) {
                defaultWarn('CEP não localizado');
            } else {
                itemData.value.logradouro = body.logradouro;
                itemData.value.bairro = body.bairro;
                itemData.value.complemento = body.complemento;
                itemData.value.id_param_tp_lograd = dropdownTpLograd.value.find((item) => item.label == body.logradouro).value;
                itemData.value.uf = dropdownUfs.value.find((item) => item.label == body.uf).value;
                itemData.value.id_cidade = dropdownCidades.value.find((item) => item.label == body.localidade).value;
            }
        });
    }
};
// Carregar dados do formulário
onBeforeMount(() => {
    loadData();
    loadOptions();
});
// Observar alterações nos dados do formulário
watchEffect(() => {
    isItemDataChanged();
});
// Observar alterações no campo uf do formulário
watch(
    () => itemData.value.uf,
    () => {
        getCidades();
    }
);
</script>

<template>
    <div class="grid">
        <form @submit="saveData">
            <div class="col-12">
                <div class="p-fluid formgrid grid">
                    <div class="field col-12 md:col-6">
                        <label for="nome">Nome</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.nome" id="nome" type="text" />
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="nome_social">Nome Social</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.nome_social" id="nome_social" type="text" />
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="cpf_trab">CPF</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-maska data-maska="###.###.###-##" v-model="itemDataMasked.cpf_trab" id="cep" type="text" @input="validateCPF()" @blur="setUnMasked('cpf_trab')" />
                        <small id="text-error" class="p-error">{{ errorMessages.cpf_trab || '&nbsp;' }}</small>
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="id_param_sexo">Sexo</label>
                        <Dropdown id="id_param_sexo" optionLabel="label" optionValue="value" :disabled="mode == 'view'" v-model="itemData.id_param_sexo" :options="dropdownSexo" placeholder="Selecione..."></Dropdown>
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="id_param_raca_cor">Raça</label>
                        <Dropdown id="id_param_raca_cor" optionLabel="label" optionValue="value" :disabled="mode == 'view'" v-model="itemData.id_param_raca_cor" :options="dropdownRacaCor" placeholder="Selecione..."> </Dropdown>
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="id_param_est_civ">Estado Civil</label>
                        <Dropdown id="id_param_est_civ" optionLabel="label" optionValue="value" :disabled="mode == 'view'" v-model="itemData.id_param_est_civ" :options="dropdownEstCivil" placeholder="Selecione..."> </Dropdown>
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="dt_nascto">Nascimento</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-maska data-maska="##/##/####" v-model="itemDataMasked.dt_nascto" id="cep" type="text" @input="validateDtNascto()" @blur="setUnMasked('dt_nascto')" />
                        <small id="text-error" class="p-error">{{ errorMessages.dt_nascto || '&nbsp;' }}</small>
                        <p>{{ itemDataMasked.dt_nascto ? validarDataPTBR(itemDataMasked.dt_nascto) : '' }}</p>
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="id_param_p_nascto">País de Nascimento</label>
                        <Dropdown id="id_param_p_nascto" optionLabel="label" optionValue="value" :disabled="mode == 'view'" v-model="itemData.id_param_p_nascto" :options="dropdownPaisNascim" placeholder="Selecione..."> </Dropdown>
                    </div>
                    <div class="field col-12 md:col-8">
                        <label for="id_param_grau_instr">Instrução</label>
                        <Dropdown id="id_param_grau_instr" optionLabel="label" optionValue="value" :disabled="mode == 'view'" v-model="itemData.id_param_grau_instr" :options="dropdownGrauInstr" placeholder="Selecione..."> </Dropdown>
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="id_param_p_nacld">País de Nacionalidade</label>
                        <Dropdown id="id_param_p_nacld" optionLabel="label" optionValue="value" :disabled="mode == 'view'" v-model="itemData.id_param_p_nacld" :options="dropdownPaisNascim" placeholder="Selecione..."> </Dropdown>
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="id_param_tplograd">Tipo de Logradouro</label>
                        <Dropdown id="id_param_tplograd" optionLabel="label" optionValue="value" :disabled="mode == 'view'" v-model="itemData.id_param_tplograd" :options="dropdownTpLograd" placeholder="Selecione..."> </Dropdown>
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="cep">CEP</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-maska data-maska="##.###-###" v-model="itemDataMasked.cep" id="cep" type="text" @input="validateCEP()" @blur="setUnMasked('cep')" />
                        <small id="text-error" class="p-error">{{ errorMessages.cep || '&nbsp;' }}</small>
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="uf">UF</label>
                        <Dropdown id="uf" filter showClear optionLabel="label" optionValue="value" :disabled="mode == 'view'" v-model="itemData.uf" :options="UFS" @input="alert(itemData.uf)" placeholder="Selecione..."> </Dropdown>
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="id_cidade">Cidade</label>
                        <Dropdown id="id_cidade" filter showClear optionLabel="label" optionValue="value" :disabled="mode == 'view'" v-model="itemData.id_cidade" :loading="loading.cidades" :options="dropdownCidades" placeholder="Selecione...">
                        </Dropdown>
                    </div>
                    <div class="field col-12 md:col-3">
                        <label for="logradouro">Logradouro</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.logradouro" id="logradouro" type="text" />
                    </div>
                    <div class="field col-12 md:col-1">
                        <label for="nr">Número</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.nr" id="nr" type="text" />
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="complemento">Complemento</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.complemento" id="complemento" type="text" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="mae">Mãe</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.mae" id="mae" type="text" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="pai">Pai</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.pai" id="pai" type="text" />
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="naturalidade">Naturalidade</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.naturalidade" id="naturalidade" type="text" />
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="telefone">Telefone</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-maska data-maska="(##) #####-####" v-model="itemDataMasked.telefone" id="telefone" type="text" @input="validateTelefone()" @blur="setUnMasked('telefone')" />
                        <small id="text-error" class="p-error">{{ errorMessages.telefone || '&nbsp;' }}</small>
                    </div>
                    <div class="field col-12 md:col-3">
                        <label for="email">Email</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.email" id="email" type="text" @input="validateEmail()" @blur="setUnMasked('email')" />
                        <small id="text-error" class="p-error">{{ errorMessages.email || '&nbsp;' }}</small>
                    </div>
                    <div class="field col-12 md:col-9">
                        <label for="observacao">Observação</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.observacao" id="observacao" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-12">
                        <div class="card">
                            <h5>Deficiências e/ou Readaptação</h5>
                            <div class="p-card-content flex justify-content-center flex-wrap gap-3">
                                <label for="def_fisica">Física</label>
                                <InputSwitch :disabled="mode == 'view'" v-model="itemData.def_fisica" />
                                <label for="def_visual">Visual</label>
                                <InputSwitch :disabled="mode == 'view'" v-model="itemData.def_visual" />
                                <label for="def_auditiva">Auditiva</label>
                                <InputSwitch :disabled="mode == 'view'" v-model="itemData.def_auditiva" />
                                <label for="def_mental">Mental</label>
                                <InputSwitch :disabled="mode == 'view'" v-model="itemData.def_mental" />
                                <label for="def_intelectual">Intelectual</label>
                                <InputSwitch :disabled="mode == 'view'" v-model="itemData.def_intelectual" />
                                <label for="reab_readap">Readaptação</label>
                                <InputSwitch :disabled="mode == 'view'" v-model="itemData.reab_readap" />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card flex justify-content-center flex-wrap gap-3">
                    <div v-if="mode != 'view' && isItemDataChanged()">Desejo registrar os dados inseridos.<br />Os dados serão transferidos para o eSocial ao salvar</div>
                    <InputSwitch v-model="accept" @input="formAccepted" v-if="mode != 'view' && isItemDataChanged()" :class="{ 'p-invalid': errorMessages.accepted }" aria-describedby="text-error" />
                    <small id="text-error" class="p-error">{{ errorMessages.accepted || '&nbsp;' }}</small>
                    <Button type="button" v-if="mode == 'view'" label="Editar" icon="pi pi-pencil" text raised @click="mode = 'edit'" />
                    <Button type="submit" v-if="mode != 'view'" label="Salvar" icon="pi pi-save" severity="success" text raised :disabled="!isItemDataChanged() || !formIsValid()" />
                    <Button type="button" v-if="mode != 'view'" label="Cancelar" icon="pi pi-ban" severity="danger" text raised @click="reload" />
                </div>
            </div>
        </form>
    </div>
</template>
