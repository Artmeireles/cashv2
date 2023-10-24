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
const urlBase = ref(`${baseApiUrl}/siafic`);
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
                    <div class="field col-12 md:col-4">
                        <label for="id_unidade_gestora">Unidade Gestora</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.id_unidade_gestora" id="id_unidade_gestora" type="text" maxlength="14"/>
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="mes">Mês</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.mes" id="mes" type="text" maxlength="10"/>
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="ano">Ano</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.ano" id="ano" type="text" maxlength="10"/>
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="apropriacao_decimo">Apropriação Décimo</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.apropriacao_decimo" id="apropriacao_decimo" type="text" maxlength="10"/>
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="apropriacao_ferias">Apropriação Férias</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.apropriacao_ferias" id="apropriacao_ferias" type="text" maxlength="10"/>
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
