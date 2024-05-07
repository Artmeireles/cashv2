<script setup>
import { onMounted, ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';
// Cookies de usuário
import { userKey } from '@/global';
const json = localStorage.getItem(userKey);
const userData = JSON.parse(json);

const model = ref([{ label: 'Cadastros', items: [{ label: 'Dashboard', icon: 'fa-solid fa-home', to: `/${userData.cliente}/${userData.dominio}` }] }]);

import { baseApiUrl } from '@/env';
import axios from '@/axios-interceptor';
const urlBase = ref(`${baseApiUrl}/users`);
const itemUserData = ref({});
const loadUserData = async () => {
    setTimeout(async () => {
        const url = `${urlBase.value}/${userData.id}`;
        await axios.get(url).then(async (res) => {
            const body = res.data;
            itemUserData.value = body;
            await setMenuByUser();
        });
    }, Math.random() * 1000 + 250);
};

const setMenuByUser = async () => {
    if (itemUserData.value.tipoUsuario == 2 && (itemUserData.value.cad_servidores >= 1 || itemUserData.value.financeiro >= 1 || itemUserData.value.cad_orgao >= 1)) {
        const itemMenu = { label: 'Cadastros', items: [] };
        if (itemUserData.value.cad_servidores >= 1) itemMenu.items.push({ label: 'Gestão de Empregados', to: `/${userData.cliente}/${userData.dominio}/servidores` });
        if (itemUserData.value.financeiro >= 1) itemMenu.items.push({ label: 'Parâmetros Financeiros', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        if (itemUserData.value.cad_orgao >= 1) itemMenu.items.push({ label: 'Empresa', to: `/${userData.cliente}/${userData.dominio}/empresa` });
        model.value.push(itemMenu);
    }
    if (itemUserData.value.tipoUsuario == 2 && itemUserData.value.gestor >= 1) {
        const itemMenu = { label: 'Tabelas', items: [] };
        itemMenu.items.push({ label: 'Rubricas', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        itemMenu.items.push({ label: 'INSS', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        itemMenu.items.push({ label: 'RPPS', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        itemMenu.items.push({ label: 'IRRF', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        model.value.push(itemMenu);
    }
    if (itemUserData.value.tipoUsuario == 2 && itemUserData.value.gestor >= 1) {
        const itemMenu = { label: 'Registros Diversos', items: [] };
        itemMenu.items.push({ label: 'Locações', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        itemMenu.items.push({ label: 'Local de Trabalho', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        itemMenu.items.push({ label: 'Cargos', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        itemMenu.items.push({ label: 'Centros de custo', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        itemMenu.items.push({ label: 'Vinculos', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        itemMenu.items.push({ label: 'PCC', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        itemMenu.items.push({ label: 'Bancos', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        model.value.push(itemMenu);
    }
    if (itemUserData.value.tipoUsuario == 2 && itemUserData.value.esocial >= 1) {
        const itemMenu = { label: 'e-Social', items: [] };
        itemMenu.items.push({ label: 'Envios', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        itemMenu.items.push({ label: 'Rejeições', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        itemMenu.items.push({ label: 'Parâmetros', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        model.value.push(itemMenu);
    }
    if (itemUserData.value.tipoUsuario == 2 && itemUserData.value.exportacoes >= 1) {
        const itemMenu = { label: 'Exportações', items: [] };
        itemMenu.items.push({ label: 'SIAP', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        itemMenu.items.push({ label: 'SEFIP', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        itemMenu.items.push({ label: 'SIOPE', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        itemMenu.items.push({ label: 'RAIS', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        itemMenu.items.push({ label: 'DIRF', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        itemMenu.items.push({ label: 'MANAD', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        itemMenu.items.push({ label: 'Atuarial', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        model.value.push(itemMenu);
    }
    if (itemUserData.value.con_contratos >= 1) {
        const itemMenu = { label: 'Consignações', items: [] };
        if (itemUserData.value.tipoUsuario == 1) itemMenu.items.push({ label: 'Contratos', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        if (itemUserData.value.tipoUsuario == 2) itemMenu.items.push({ label: 'Remessas', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        if (itemUserData.value.tipoUsuario == 2) itemMenu.items.push({ label: 'Recepções', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        itemMenu.items.push({ label: 'Relatórios', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        model.value.push(itemMenu);
    }
    if (itemUserData.value.tipoUsuario == 2) {
        model.value.push({
            label: 'Outros órgãos (link externo)', items: [
                { label: 'eSocial', icon: 'pi pi-fw pi-at', url: 'https://login.esocial.gov.br', target: '_blank' },
                { label: 'Siope', icon: 'pi pi-fw pi-at', url: 'https://www.gov.br/fnde/pt-br/assuntos/sistemas/siope', target: '_blank' },
                { label: 'TCE - AL', icon: 'pi pi-fw pi-at', url: 'https://www.tceal.tc.br/', target: '_blank' }
            ]
        });
    }
    if (itemUserData.value.gestor >= 1) {
        const itemMenu = { label: 'Consignações', items: [] };
        itemMenu.items.push({ label: 'Usuários', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        itemMenu.items.push({ label: 'Log de Eventos', to: `/${userData.cliente}/${userData.dominio}/remun-params` });
        model.value.push(itemMenu);
    }
};

onMounted(async () => {
    await loadUserData();
});
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>
