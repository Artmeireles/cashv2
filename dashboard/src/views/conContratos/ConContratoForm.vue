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
const urlBase = ref(`${baseApiUrl}/con-contrato`);
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
                <h5 v-if="itemData.id_serv">Servidor {{ itemData.id_serv }}</h5>
                <div class="p-fluid formgrid grid">
                    <div class="field col-12 md:col-2">
                        <label for="token">Token</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.token" id="token" type="text" maxlength="6"/>
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="id_user">User</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.id_user" id="id_user" type="text" maxlength="6"/>
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="id_consign">Consignado</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.id_consign" id="id_consign" type="text" maxlength="6"/>
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="id_serv">Servidor</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.id_serv" id="id_serv" type="text" maxlength="6"/>
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="contrato">Contrato</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.contrato" id="contrato" type="text" maxlength="6"/>
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="primeiro_vencimento">Primeiro Vencimento</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.primeiro_vencimento" id="primeiro_vencimento" type="text" maxlength="6"/>
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="valor_parcela">Valor Parcela</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.valor_parcela" id="valor_parcela" type="text" maxlength="6"/>
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="parcela">Parcela</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.parcela" id="parcela" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="parcelas">Parcelas</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.parcelas" id="parcelas" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="valor_total">Valor Total</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.valor_total" id="valor_total" type="text" maxlength="6" />
                    </div> 
                    <div class="field col-12 md:col-2">
                        <label for="valor_liquido">Valor Líquido</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.valor_liquido" id="valor_liquido" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="qmar">Quitação Mínima</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.qmar" id="qmar" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="averbado_online">Averbado Online</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.averbado_online" id="averbado_online" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="data_averbacao">Data Averbação</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.data_averbacao" id="data_averbacao" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-2">
                        <label for="data_liquidacao">Data Liquidação</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.data_liquidacao" id="data_liquidacao" type="text" maxlength="6" />
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
