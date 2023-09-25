<script setup>
import { ref, onBeforeMount, provide } from 'vue';
import { FilterMatchMode, FilterOperator } from 'primevue/api';
import { baseApiUrl } from '@/env';
import axios from '@/axios-interceptor';
import { defaultSuccess } from '@/toast';
import FinRubricaForm from './FinRubricaForm.vue';
import { useConfirm } from 'primevue/useconfirm';
import { useUserStore } from '@/stores/user'
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
const urlBase = ref(`${baseApiUrl}/fin-rubricas`);
// Inicializa os filtros
const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        cod_rubr: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        ini_valid: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        dsc_rubr: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] }
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
//Carrrega os dados
const loadData = () => {
    axios.get(`${urlBase.value}/${store.userStore.id_emp}`).then((axiosRes) => {
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
    const dataAtual = new Date();
    const mes = dataAtual.getMonth(); // Obtém o mês atual (0-11)
    const ano = dataAtual.getFullYear(); // Obtém o ano atual (4 dígitos)
    itemData.value = {
        id_emp: store.userStore.id_emp,
        cod_rubr: "",
        ini_valid: `${ano}-${String(mes + 1).padStart(2, '0')}`,
        dsc_rubr: "",
        id_param_nat_rubr: 0,
        id_param_tipo: 0,
        id_param_cod_inc_cp: 0,
        id_param_cod_inc_irrf: 0,
        id_param_cod_inc_fgts: 0,
        id_param_cod_inc_cprp: 0,
        teto_remun: 0,
        consignado: 0,
        consignavel: 0,
        observacao: ""
    };
    mode.value = 'new';
};
</script>

<template>
    <div class="card">
        <FinRubricaForm @changed="loadData" v-if="['new', 'edit'].includes(mode)" />
        <DataTable ref="dt" :value="gridData" :paginator="true" :rowsPerPageOptions="[5, 10, 20, 50]"
            tableStyle="min-width: 50rem" :rows="5" dataKey="id" :rowHover="true" v-model:filters="filters"
            filterDisplay="menu" :filters="filters" :globalFilterFields="['cod_rubr', 'ini_valid', 'dsc_rubr']"
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
            <Column field="cod_rubr" header="Cod Rubrica" sortable>
                <template #body="{ data }">
                    {{ data.cod_rubr }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter"
                        placeholder="Localize por Cod Rubrica" />
                </template>
            </Column>
            <Column field="ini_valid" header="Inicio Válidade" sortable>
                <template #body="{ data }">
                    {{ data.ini_valid }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter"
                        placeholder="Localize por Inicio Válidade" />
                </template>
            </Column>
            <Column field="dsc_rubr" header="Descrição" sortable>
                <template #body="{ data }">
                    {{ data.dsc_rubr }}
                </template>
                <template #filter="{ filterModel }">
                    <InputText v-model="filterModel.value" type="text" class="p-column-filter"
                        placeholder="Localize por Descrição" />
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
