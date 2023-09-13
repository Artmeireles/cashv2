<script setup>
import { ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';
import { useUserStore } from '@/stores/user';

const store = useUserStore();

const model = ref([
    {
        // label: 'Home',
        items: [{ label: 'Início', icon: 'pi pi-fw pi-home', to: `/${store.userStore.cliente}/${store.userStore.dominio}` }]
    },
    {
        label: 'Cadastros',
        items: [
            { label: 'Gestão de Empregados', to: `/${store.userStore.cliente}/${store.userStore.dominio}/servidores` },
            { label: 'Parâmetros Financeiros', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
            { label: 'Orgão', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
            { label: 'Rubricas', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
            { label: 'INSS', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
            { label: 'RPPS', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
            { label: 'IRRF', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
        ]
    },
    {
        label: 'Diversos',
        items: [
            { label: 'Locações', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
            { label: 'Local de Trabalho', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
            { label: 'Cargos', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
            { label: 'Centros de custo', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
            { label: 'Vinculos', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
            { label: 'PCC', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
            { label: 'Bancos', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
        ]
    },
    {
        label: 'e-Social',
        items: [
            { label: 'Parâmetros', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
            { label: 'Envios', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
            { label: 'Rejeições', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
        ]
    },
    {
        label: 'Diversos',
        items: [
            { label: 'Relatórios', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
            { label: 'Remessas', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
            { label: 'Consignações', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
        ]
    },
    {
        label: 'Exportações',
        items: [
            { label: 'SIAP', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
            { label: 'SEFIP', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
            { label: 'SIOPE', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
            { label: 'RAIS', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
            { label: 'DIRF', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
            { label: 'MANAD', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
            { label: 'Atuarial', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
        ]
    },
    {
        label: 'Outros órgãos (link externo)',
        items: [
            { label: 'eSocial', icon: 'pi pi-fw pi-at', url: 'https://login.esocial.gov.br', target: '_blank' },
            { label: 'Siope', icon: 'pi pi-fw pi-at', url: 'https://www.gov.br/fnde/pt-br/assuntos/sistemas/siope', target: '_blank' },
            { label: 'TCE - AL', icon: 'pi pi-fw pi-at', url: 'https://www.tceal.tc.br/', target: '_blank' }
        ]
    },
    {
        label: 'Administração',
        items: [
            { label: 'Usuários', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
            { label: 'Log de Eventos', to: `/${store.userStore.cliente}/${store.userStore.dominio}/remun-params` },
        ]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
        <!-- <li>
            <a href="https://www.primefaces.org/primeblocks-vue/#/" target="_blank">
                <img src="/layout/images/banner-primeblocks.png" alt="Prime Blocks" class="w-full mt-3" />
            </a>
        </li> -->
    </ul>
</template>

<style lang="scss" scoped></style>
