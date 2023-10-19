<script setup>
import { ref, onBeforeMount, provide } from 'vue';
import { FilterMatchMode, FilterOperator } from 'primevue/api';
import { baseApiUrl } from '@/env';
import axios from '@/axios-interceptor';
import { defaultSuccess } from '@/toast';
import ConConsignForm from './ConConsignForm.vue';
import { useConfirm } from 'primevue/useconfirm';
import { useUserStore } from '@/stores/user';
const store = useUserStore();

const confirm = useConfirm();
const filters = ref(null);
const menu = ref();
// Modo da grid
const mode = ref('grid');
// Dados da grid
const gridData = ref([]);
// Dados do item selecionado
const itemData = ref({});
// Url base das requisições
const urlBase = ref(`${baseApiUrl}/con-consign`);
// Inicializa os filtros
const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        agencia: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        qmar: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        qmp: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] }
    };
};
// Ref do gridData
const dt = ref(null);
// inicializa os filtros
initFilters();
// Limpa os filtros
const clearFilter = () => {
    initFilters();
};
// Itens do menu de contexto
const itemsButtons = ref([
    {
        label: 'Editar',
        icon: 'pi pi-pencil',
        command: () => {
            mode.value = 'edit';
        }
    },
    {
        label: 'Excluir',
        icon: 'pi pi-trash',
        command: ($event) => {
            deleteRow($event);
        }
    }
]);
// Exclui o registro
const deleteRow = () => {
    confirm.require({
        group: 'templating',
        header: 'Corfirmar exclusão',
        message: 'Você tem certeza que deseja excluir este registro?',
        icon: 'pi pi-question-circle',
        acceptIcon: 'pi pi-check',
        rejectIcon: 'pi pi-times',
        acceptClass: 'p-button-danger',
        accept: () => {
            axios.delete(`${urlBase.value}/${itemData.value.id}`).then(() => {
                defaultSuccess('Registro excluído com sucesso!');
                loadData();
            });
        },
        reject: () => {
            return false;
        }
    });
};

// Aciona o menu de contexto
const toggle = (event) => {
    menu.value.toggle(event);
};
// Seleciona o item
const getItem = (data) => {
    itemData.value = { ...data };
};
// Carrrega os dados
const loadData = () => {
    axios.get(`${urlBase.value}`).then((axiosRes) => {
        gridData.value = axiosRes.data.data;
    });
};

// Exporta os dados
const exportCSV = () => {
    dt.value.exportCSV();
};
// Carrega os dados do formulário
provide('itemData', itemData);
// Carrega o modo do formulário
provide('mode', mode);
// Executar ações antes do componente ser montado
onBeforeMount(() => {
    initFilters();
    loadData();
});
const novoRegistro = () => {
    itemData.value = {
        id_cad_bancos:"",
        agencia: "",
        qmar: "",
        qmp: "",
        averbar_online: 0,
        apenas_efetivos: 0
    };
    mode.value = 'new';
};
</script>

<template>
    <div class="card">
        <ConConsignForm @changed="loadData" v-if="['new', 'edit'].includes(mode)" />
        <DataTable ref="dt" :value="gridData" :paginator="true" :rowsPerPageOptions="[5, 10, 20, 50]"
            tableStyle="min-width: 50rem" :rows="5" dataKey="id" :rowHover="true" v-model:filters="filters"
            filterDisplay="menu" :filters="filters" :globalFilterFields="['agencia', 'qmar', 'qmp']"
            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
            currentPageReportTemplate="{first} a {last} de {totalRecords} registros" scrollable scrollHeight="415px">
            <template #header>
                <div class="flex justify-content-end gap-3">
                    <Button icon="pi pi-external-link" label="Exportar" @click="exportCSV($event)" />
                    <Button type="button" icon="pi pi-filter-slash" label="Limpar filtro" outlined @click="clearFilter()" />
                    <Button type="button" icon="pi pi-plus" label="Novo Registro" outlined @click="novoRegistro()" />
                    <span class="p-input-icon-left">
                        <i class="pi pi-search" />
                        <InputText v-model.lazy="filters['global'].value" placeholder="Pesquise..." />
                    </span>
                </div>
            </template>
            <Column field="agencia" header="Agência" sortable>
                <template #body="{ data }">
                    {{ data.agencia }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter"
                        placeholder="Localize por Agência" />
                </template>
            </Column>
            <Column field="qmar" header="Quitação" sortable>
                <template #body="{ data }">
                    {{ data.qmar }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter"
                        placeholder="Localize por Quitação" />
                </template>
            </Column>
            <Column field="qmp" header="Quantidade" sortable>
                <template #body="{ data }">
                    {{ data.qmp }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter"
                        placeholder="Localize por Quantidade" />
                </template>
            </Column>
            <Column headerStyle="width: 5rem; text-align: center" bodyStyle="text-align: center; overflow: visible">
                <template #body="{ data }">
                    <Button type="button" icon="pi pi-bars" rounded v-on:click="getItem(data)" @click="toggle"
                        aria-haspopup="true" aria-controls="overlay_menu" class="p-button-outlined" />
                    <Menu ref="menu" id="overlay_menu" :model="itemsButtons" :popup="true" />
                </template>
            </Column>
        </DataTable>
    </div>
</template>
