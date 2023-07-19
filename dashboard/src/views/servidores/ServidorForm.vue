<script setup>
import { onMounted, ref } from 'vue';
import { baseApiUrl } from '@/env';
import axios from '@/axios-interceptor';
import { defaultSuccess, defaultWarn } from '@/toast';

const dropdownItems = ref([
    { name: 'Option 1', code: 'Option 1' },
    { name: 'Option 2', code: 'Option 2' },
    { name: 'Option 3', code: 'Option 3' }
]);
const dropdownItem = ref(null);
const itemData = ref({});
const loading = ref(true);
const urlBase = ref(`${baseApiUrl}/servidores`);
const props = defineProps(['itemData']);

const loadData = async () => {
    console.log(props.itemData);
    const url = `${urlBase.value}/${props.itemData.id}`;
    axios.get(url).then((res) => {
        const body = res.data;
        if (body && body.data.id) {
            itemData.value = body.data;
            loading.value = false;
        } else {
            defaultWarn('Registro não localizado');
            history.back();
        }
    });
};

onMounted(() => {
    loadData();
});
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="p-fluid formgrid grid">
                <div class="field col-12 md:col-6">
                    <label for="nome">Nome</label>
                    <InputText v-model="itemData.nome" id="nome" type="text" />
                </div>
                <div class="field col-12 md:col-6">
                    <label for="lastname2">Lastname</label>
                    <InputText id="lastname2" type="text" />
                </div>
                <div class="field col-12">
                    <label for="address">Address</label>
                    <Textarea id="address" rows="4" />
                </div>
                <div class="field col-12 md:col-6">
                    <label for="city">City</label>
                    <InputText id="city" type="text" />
                </div>
                <div class="field col-12 md:col-3">
                    <label for="state">State</label>
                    <Dropdown id="state" v-model="dropdownItem" :options="dropdownItems" optionLabel="name" placeholder="Select One"></Dropdown>
                </div>
                <div class="field col-12 md:col-3">
                    <label for="zip">Zip</label>
                    <InputText id="zip" type="text" />
                </div>
            </div>
        </div>
    </div>
</template>
