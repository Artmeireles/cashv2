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
// Campos de formulário mascarados
const itemDataMasked = ref({});
// Url base do form action
const urlBase = ref(`${baseApiUrl}/ben-vinculos`);
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
    itemData.value.id_benef = route.params.id
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
                <div class="p-fluid formgrid grid">
                    <!-- <div class="field col-12 md:col-4">
                        <label for="id_benef">Beneficiário</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.id_benef" id="id_benef" type="text" maxlength="10" />
                    </div> -->
                    <div class="field col-12 md:col-4">
                        <label for="nr_beneficio">Nº Benefício</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.nr_beneficio" id="nr_beneficio" type="text" maxlength="30" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="dt_ini_benef">Data Benefício</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-maska data-maska="##/##/####" v-model="itemData.dt_ini_benef" id="dt_ini_benef" type="text" maxlength="10" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="id_param_tp_benef">Tipo de Benefício</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.id_param_tp_benef" id="id_param_tp_benef" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-3">
                        <label for="tp_plan_rp">Plano Segregação</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.tp_plan_rp" id="tp_plan_rp" type="text" maxlength="1" />
                    </div>
                    <div class="field col-12 md:col-3">
                        <label for="tp_pen_morte">Tipo Pensão</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.tp_pen_morte" id="tp_pen_morte" type="text" maxlength="1" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="id_serv_inst">CPF Instituidor</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.id_serv_inst" id="id_serv_inst" type="text" maxlength="11" />
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="dt_inst">Data Óbito</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-maska data-maska="##/##/####" v-model="itemData.dt_inst" id="dt_inst" type="text" maxlength="10" />
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
