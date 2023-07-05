<script setup>
import { ref, onBeforeMount } from 'vue';
import { FilterMatchMode, FilterOperator } from 'primevue/api';
import { useToast } from 'primevue/usetoast';
import { baseApiUrl } from '@/env';
import axios from '@/axios-interceptor';

const toast = useToast();

const filters = ref(null);
const menu = ref();
const gridData = ref(null);
const loading = ref(null);
const urlBase = ref(`${baseApiUrl}/cadastros`);

const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        matricula: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        nome: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        cpf: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] }
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
const items = ref([
    {
        label: 'Add',
        icon: 'pi pi-pencil',
        command: () => {
            toast.add({ severity: 'info', summary: 'Add', detail: 'Data Added' });
        }
    },
    {
        label: 'Update',
        icon: 'pi pi-refresh',
        command: () => {
            toast.add({ severity: 'success', summary: 'Update', detail: 'Data Updated' });
        }
    },
    {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => {
            toast.add({ severity: 'error', summary: 'Delete', detail: 'Data Deleted' });
        }
    },
    {
        label: 'Upload',
        icon: 'pi pi-upload',
        command: () => {
            toast.add({ severity: 'error', summary: 'Upload', detail: 'File Upload' });
        }
    },
    {
        label: 'Vue Website',
        icon: 'pi pi-external-link',
        command: () => {
            window.location.href = 'https://vuejs.org/';
        }
    }
]);
const toggle = (event) => {
    menu.value.toggle(event);
};
const loadData = async () => {
    const axiosRes = await axios.get(urlBase.value);
    gridData.value = axiosRes.data.data;
    gridData.value.forEach((element) => {
        element.matricula = element.matricula.toString().padStart(8, '0');
    });
};
onBeforeMount(() => {
    loadData();
    loading.value = false;
    initFilters();
});
</script>

<template>
    <div class="card">
        <DataTable
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
            :globalFilterFields="['matricula', 'nome', 'cpf']"
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
            <template #empty> Sem registros por enquanto. </template>
            <!-- <Column selectionMode="multiple" headerStyle="width: 3rem"></Column> -->
            <Column field="matricula" header="Matricula" sortable style="min-width: 14rem">
                <template #body="{ data }">
                    {{ data.matricula }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Localize por matricula" />
                </template>
                <Skeleton></Skeleton>
            </Column>
            <Column field="nome" header="Nome" sortable style="min-width: 14rem">
                <template #body="{ data }">
                    {{ data.nome }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Localize por nome" />
                </template>
                <Skeleton></Skeleton>
            </Column>
            <Column field="cpf" header="CPF" sortable style="min-width: 14rem">
                <template #body="{ data }">
                    {{ data.cpf }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter" placeholder="Localize por CPF" />
                </template>
                <Skeleton></Skeleton>
            </Column>
            <Column headerStyle="width: 5rem; text-align: center" bodyStyle="text-align: center; overflow: visible">
                <template #body>
                    <Button type="button" icon="pi pi-cog" rounded @click="toggle" aria-haspopup="true" aria-controls="overlay_menu" />
                    <Menu ref="menu" id="overlay_menu" :model="items" :popup="true" />
                </template>
                <Skeleton></Skeleton>
            </Column>
        </DataTable>
    </div>
</template>
