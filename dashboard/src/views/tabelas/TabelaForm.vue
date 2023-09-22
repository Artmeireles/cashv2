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
const urlBase = ref(`${baseApiUrl}/tabelas/${store.userStore.id_emp}`);
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
                        <label for="id_emp">Empresa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.id_emp" id="id_emp" type="text" maxlength="6"/>
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="tipo_tabela">Tipo da Tabela</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.tipo_tabela" id="tipo_tabela" type="text" maxlength="1"/>
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="cod_tabela">Código da Tabela</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.cod_tabela" id="cod_tabela" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-12">
                        <label for="dsc_tabela">Descrição da Tabela</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.dsc_tabela" id="dsc_tabela" type="text" maxlength="255" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="inicial1">Valor inicial da faixa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.inicial1" id="inicial1" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="final1">Valor final da faixa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.final1" id="final1" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="aliquota1">Aliquota da faixa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.aliquota1" id="aliquota1" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="deduzir1">Valor a deduzir da faixa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.deduzir1" id="deduzir1" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="inicial2">Valor inicial da faixa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.inicial2" id="inicial2" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="final2">Valor final da faixa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.final2" id="final2" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="aliquota2">Aliquota da faixa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.aliquota2" id="aliquota2" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="deduzir2">Valor a deduzir da faixa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.deduzir2" id="deduzir2" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="inicial3">Valor inicial da faixa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.inicial3" id="inicial3" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="final3">Valor final da faixa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.final3" id="final3" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="aliquota3">Aliquota da faixa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.aliquota3" id="aliquota3" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="deduzir3">Valor a deduzir da faixa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.deduzir3" id="deduzir3" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="inicial4">Valor inicial da faixa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.inicial4" id="inicial4" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="final4">Valor final da faixa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.final4" id="final4" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="aliquota4">Aliquota da faixa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.aliquota4" id="aliquota4" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="deduzir4">Valor a deduzir da faixa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.deduzir4" id="deduzir4" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="inicial5">Valor inicial da faixa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.inicial5" id="inicial5" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="final5">Valor final da faixa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.final5" id="final5" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="aliquota5">Aliquota da faixa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.aliquota5" id="aliquota5" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="deduzir5">Valor a deduzir da faixa</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.deduzir5" id="deduzir5" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="patronal">Aliquota patronal</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.patronal" id="patronal" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="patronal_e1">Aliquota patronal</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.patronal_e1" id="patronal_e1" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="patronal_e2">Aliquota patronal</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.patronal_e2" id="patronal_e2" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="teto">Teto do INSS</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.teto" id="teto" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="rat">Aliquota RAT</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.rat" id="rat" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="fap">Aliquota FAP</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.fap" id="fap" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="deducao_dependente">Valor da dedução por dependente</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.deducao_dependente" id="deducao_dependente" type="text" maxlength="6" />
                    </div>
                    <div class="field col-12 md:col-4">
                        <label for="ini_valid">Início da Validade das Informações</label>
                        <InputText autocomplete="no" :disabled="mode == 'view'" v-model="itemData.ini_valid" id="ini_valid" type="text" maxlength="6" />
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
