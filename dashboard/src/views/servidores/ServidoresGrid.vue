<script setup>
import { ref, onBeforeMount, onMounted } from 'vue';
import { FilterMatchMode, FilterOperator } from 'primevue/api';
import { baseApiUrl } from '@/env';
import axios from '@/axios-interceptor';
import { defaultSuccess, defaultWarn } from '@/toast';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
const store = useUserStore();

const router = useRouter();

const filters = ref(null);
const menu = ref();
const gridData = ref(null);
const itemData = ref(null);
const loading = ref(true);
const urlBase = ref(`${baseApiUrl}/servidores`);

const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        matricula: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        nome: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        cpf_trab: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] }
    };
};

initFilters();
const clearFilter = () => {
    initFilters();
};

// const formatDate = (value) => {
//     return value.toLocaleDateString('pt-BR', {
//         day: '2-digit',
//         month: '2-digit',
//         year: 'numeric'
//     });
// };
// const formatCurrency = (value) => {
//     return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
// };
// const getSeverity = (status) => {
//     switch (status) {
//         case 'unqualified':
//             return 'danger';

//         case 'qualified':
//             return 'success';

//         case 'new':
//             return 'info';

//         case 'negotiation':
//             return 'warning';

//         case 'renewal':
//             return null;
//     }
// };
const itemsButtons = ref([
    {
        label: 'Editar',
        icon: 'pi pi-pencil',
        command: () => {
            router.push({ path: `/${store.userStore.cliente}/${store.userStore.dominio}/servidores/${itemData.value.id}` });
        }
    },
    {
        label: 'Excluir',
        icon: 'pi pi-trash',
        command: () => {
            defaultWarn('Excluir registro (ID): ' + itemData.value.id);
        }
    },
    {
        label: 'Documentos',
        icon: 'pi pi-upload',
        command: () => {
            defaultSuccess('documentos registro (ID): ' + itemData.value.id);
        }
    }
]);
const toggle = (event) => {
    menu.value.toggle(event);
};
const getItem = (data) => {
    itemData.value = data;
};
const loadData = () => {
    axios.get(`${urlBase.value}`).then((axiosRes) => {
        gridData.value = axiosRes.data.data;
        loading.value = false;
    });
};
onBeforeMount(() => {
    initFilters();
    loadData();
});
// onMounted(() => {
//     loadData();
// });
</script>

<template>
    <div class="card">
        <DataTable :value="gridData" v-if="loading">
            <Column field="matricula" header="Matricula" style="min-width: 14rem">
                <template #body>
                    <Skeleton></Skeleton>
                </template>
            </Column>
            <Column field="nome" header="Nome" style="min-width: 25rem">
                <template #body>
                    <Skeleton></Skeleton>
                </template>
            </Column>
            <Column field="cpf_trab" header="CPF" style="min-width: 14rem">
                <template #body>
                    <Skeleton></Skeleton>
                </template>
            </Column>
            <Column headerStyle="width: 5rem; text-align: center">
                <template #body>
                    <Skeleton></Skeleton>
                </template>
            </Column>
        </DataTable>
        <DataTable
            v-else
            :value="gridData"
            :paginator="true"
            class="p-datatable-gridlines"
            :rows="10"
            dataKey="id"
            :rowHover="true"
            v-model:filters="filters"
            filterDisplay="menu"
            :loading="loading"
            :filters="filters"
            responsiveLayout="scroll"
            :globalFilterFields="['matricula', 'nome', 'cpf_trab']"
        >
            <template #header>
                <div class="flex justify-content-between">
                    <Button type="button" icon="pi pi-filter-slash" label="Limpar filtro" outlined @click="clearFilter()" />
                    <span class="p-input-icon-left">
                        <i class="pi pi-search" />
                        <InputText v-model="filters['global'].value" placeholder="Pesquise..." />
                    </span>
                </div>
            </template>
            <!-- <template #empty> Sem registros por enquanto. </template> -->
            <Column field="matricula" header="Matricula" sortable style="min-width: 14rem">
                <template #body="{ data }">
                    {{ data.matricula }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Localize por matricula" />
                </template>
            </Column>
            <Column field="nome" header="Nome" sortable style="min-width: 25rem">
                <template #body="{ data }">
                    {{ data.nome }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Localize por nome" />
                </template>
            </Column>
            <Column field="cpf_trab" header="CPF" sortable style="min-width: 14rem">
                <template #body="{ data }">
                    {{ data.cpf_trab }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Localize por CPF" />
                </template>
            </Column>
            <Column headerStyle="width: 5rem; text-align: center" bodyStyle="text-align: center; overflow: visible">
                <template #body="{ data }">
                    <Button type="button" icon="pi pi-bars" rounded v-on:click="getItem(data)" @click="toggle" aria-haspopup="true" aria-controls="overlay_menu" class="p-button-outlined" />
                    <Menu ref="menu" id="overlay_menu" :model="itemsButtons" :popup="true" />
                </template>
            </Column>
        </DataTable>
    </div>
</template>
