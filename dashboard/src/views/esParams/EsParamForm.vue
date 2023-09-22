<script setup>
import { inject, onBeforeMount, ref, watchEffect } from 'vue';
import { baseApiUrl } from '@/env';
import axios from '@/axios-interceptor';
import { defaultSuccess, defaultWarn } from '@/toast';
import { useRouter } from 'vue-router';
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
const urlBase = ref(`${baseApiUrl}/es-params/${store.userStore.id_emp}`);
// Carragamento de dados do form
const loadData = async () => {
    if (itemData.value && itemData.value.id) {
        const url = `${urlBase.value}/${itemData.value.id}`;
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
};
// Salvar dados do formulário
const saveData = async () => {
    if (formIsValid()) {
        const method = itemData.value.id ? 'put' : 'post';
        const id = itemData.value.id ? `/${itemData.value.id}` : '';
        const url = `${urlBase.value}${id}`;
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
                    <div class="field col-12 md:col-6">
                        <label for="id_emp">Empresa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.id_emp" id="id_emp" type="text" maxlength="10" />
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="ambiente">Ambiente</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.ambiente" id="ambiente" type="text" maxlength="10" />
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="cnpj_sh">CNPJ SH</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.cnpj_sh" id="cnpj_sh" type="text" maxlength="18" />
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="token_sh">Token SH</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.token_sh" id="token_sh" type="text" maxlength="3" />
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="cnpj_transmissor">CNPJ Transmissor</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.cnpj_transmissor" id="cnpj_transmissor" type="text" maxlength="18" />
                    </div>
                    <div class="field col-12 md:col-6">
                        <label for="cnpj_efr">CNPJ EFR</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.cnpj_efr" id="cnpj_efr" type="text" maxlength="18" />
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="ver_process">Versão do Processo</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.ver_process" id="ver_process" type="text" maxlength="3" />
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
