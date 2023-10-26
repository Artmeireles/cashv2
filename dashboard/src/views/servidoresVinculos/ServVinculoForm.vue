<script setup>
import { inject, onBeforeMount, ref, watchEffect } from 'vue';
import { baseApiUrl } from '@/env';
import axios from '@/axios-interceptor';
import { defaultSuccess, defaultWarn } from '@/toast';
import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();
// Cookies de usuário
import { useUserStore } from '@/stores/user';
const store = useUserStore();
// Campos de formulário
const itemData = inject('itemData');
// Modo do formulário
const mode = inject('mode');
const loading = ref(false);
// Modelo de dados usado para comparação
const itemDataComparision = ref({});
// Aceite do formulário
const accept = ref(false);
// Mensages de erro
const errorMessages = ref({});
// Emit do template
const emit = defineEmits(['changed']);
// Url base do form action
const urlBase = ref(`${baseApiUrl}/serv-vinculos`);
// Carragamento de dados do form
const loadData = async () => {
    if (itemData.value && itemData.value.id) {
        const url = `${urlBase.value}/${route.params.id}/${itemData.value.id}`;
        loading.value = true;
        await axios.get(url).then((res) => {
            const body = res.data;
            if (body && body.id) {
                body.id = String(body.id);
                itemData.value = body;
                itemDataComparision.value = { ...body };
                loading.value = false;
            } else {
                defaultWarn('Registro não localizado');
                router.push({ path: urlBase.value });
            }
        });
    }
    itemData.value.id_serv = route.params.id
};
// Salvar dados do formulário
const saveData = async () => {
    if (formIsValid()) {
        const method = itemData.value.id ? 'put' : 'post';
        const id = itemData.value.id ? `/${itemData.value.id}` : '';
        const url = `${urlBase.value}/${route.params.id}${id}`;
        axios[method](url, itemData.value)
            .then((res) => {
                const body = res.data;
                if (body && body.id) {
                    defaultSuccess('Registro salvo com sucesso');
                    mode.value = 'view';
                } else {
                    defaultWarn('Erro ao salvar registro');
                }
                emit('changed');
            })
            .catch((err) => {
                defaultWarn(err.response.data);
            });
    }
};
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
// Validar formulário
const formIsValid = () => {
    return formAccepted();
};
// Carregar dados do formulário
onBeforeMount(() => {
    loadData();
});
// Observar alterações nos dados do formulário
watchEffect(() => {
    isItemDataChanged();
});
</script>

<template>
    <div class="grid">
        <form @submit.prevent="saveData">
            <div class="col-12">
                <h5 v-if="itemData.matricula">Matrícula {{ itemData.matricula }}</h5>
                <div class="p-fluid formgrid grid">
                    <div class="field col-12 md:col-4">
                        <label for="ini_valid">Inicio de Validade</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.ini_valid" id="ini_valid" type="text" maxlength="10" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="id_vinc_principal">Vinculo Principal</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.id_vinc_principal" id="id_vinc_principal" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="matricula">Matricula</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.matricula" id="matricula" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="sit_func">Situação Funcional</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.sit_func" id="sit_func" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="tp_reg_trab">Regime Trabalhista</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.tp_reg_trab" id="tp_reg_trab" type="text" maxlength="11" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="tp_reg_prev">Regime Previdenciário</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.tp_reg_prev" id="tp_reg_prev" type="text" maxlength="7" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="id_param_tp_prov">Tipo Provimento</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.id_param_tp_prov" id="id_param_tp_prov" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="data_exercicio">Data Exercicio</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-maska data-maska="##/##/####" v-model="itemData.data_exercicio" id="data_exercicio" type="text" maxlength="25" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="tp_plan_rp">Plano Segregação da Massa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.tp_plan_rp" id="tp_plan_rp" type="text" maxlength="500" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="teto_rgps">Teto RGPS</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.teto_rgps" id="teto_rgps" type="text" maxlength="1" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="abono_perm">Abono Permanência</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.abono_perm" id="abono_perm" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="d_inicio_abono">Data Inicio Abono</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-maska data-maska="##/##/####" v-model="itemData.d_inicio_abono" id="d_inicio_abono" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="d_ing_cargo">Data de Ingressão no Cargo</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-maska data-maska="##/##/####" v-model="itemData.d_ing_cargo" id="d_ing_cargo" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="id_cargo">Cargo</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.id_cargo" id="id_cargo" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="acum_cargo">Cargo Acumulável</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.acum_cargo" id="acum_cargo" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="id_param_cod_categ">Código da Categoria</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.id_param_cod_categ" id="id_param_cod_categ" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="qtd_hr_sem">Quantidade Horas Semanais</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.qtd_hr_sem" id="qtd_hr_sem" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="id_param_tp_jor">Tipo de Jornada</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.id_param_tp_jor" id="id_param_tp_jor" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="id_param_tmp_parc">Tempo Parcial</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.id_param_tmp_parc" id="id_param_tmp_parc" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="hr_noturno">Horário Noturno </label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.hr_noturno" id="hr_noturno" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-12">
                        <label for="desc_jornd">Descrição de Jornada</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.desc_jornd" id="desc_jornd" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="pis">PIS</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.pis" id="pis" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="dt_pis">Data do PIS</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-maska data-maska="##/##/####" v-model="itemData.dt_pis" id="dt_pis" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="tempo_servico">Tempo de Serviço</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.tempo_servico" id="tempo_servico" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="tempo_final">Tempo Final</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.tempo_final" id="tempo_final" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="titulo">Titulo</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.titulo" id="titulo" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="tit_uf">UF Titulo</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.tit_uf" id="tit_uf" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="tit_zona">Zona Titulo</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.tit_zona" id="tit_zona" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="tit_secao">Seção Titulo</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.tit_secao" id="tit_secao" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="dt_nomeacao">Data Nomeação</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-maska data-maska="##/##/####" v-model="itemData.dt_nomeacao" id="dt_nomeacao" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="nom_edital">Nome Edital</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.nom_edital" id="nom_edital" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="nom_nr_inscr">Nº da Inscrição</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.nom_nr_inscr" id="nom_nr_inscr" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="id_siap_pub">Publicação</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.id_siap_pub" id="id_siap_pub" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="id_param_grau_exp">Grau de Exposição</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.id_param_grau_exp" id="id_param_grau_exp" type="text" maxlength="255" />
                    </div>
                </div>
                <div class="card flex justify-content-center flex-wrap gap-3">
                    <div v-if="mode != 'view' && isItemDataChanged()">Desejo registrar os dados inseridos.<br />Os dados serão transferidos para o eSocial ao salvar</div>
                    <InputSwitch v-model="accept" @input="formAccepted" v-if="mode != 'view' && isItemDataChanged()" :class="{ 'p-invalid': errorMessages.accepted }" aria-describedby="text-error" />
                    <small id="text-error" class="p-error">{{ errorMessages.accepted || '&nbsp;' }}</small>
                    <Button type="button" v-if="mode == 'view'" label="Editar" icon="pi pi-pencil" text raised @click="mode = 'edit'" />
                    <Button type="submit" v-if="mode != 'view'" label="Salvar" icon="pi pi-save" severity="success" text raised :disabled="!isItemDataChanged() || !formIsValid()" />
                    <Button type="button" v-if="mode != 'view'" label="Cancelar" icon="pi pi-ban" severity="danger" text raised @click="mode = 'view'" />
                </div>
            </div>
        </form>
    </div>
</template>
