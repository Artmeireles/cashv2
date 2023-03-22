import Vue from 'vue'
import VueRouter from 'vue-router'

import Home from '@/components/home/Home'
import Presentation from '@/components/home/Presentation'
import AdminPages from '@/components/admin/AdminPages'
import PrintingPages from '@/components/printing/PrintingPages'
import ConAdminPanels from '@/components/consignacoesAdmin/ConAdminPanels'
import ContrAdminPanels from '@/components/contratosConsigAdmin/ContrAdminPanels'
import CadastrosGrid from '@/components/painelServidores/CadastrosGrid'
import CadastroPanels from '@/components/painelServidores/CadastroPanels'
import CadasPanels from '@/components/painelConsignacoes/CadasPanels'
import Validator from '@/components/template/Validator'
import Auth from '@/components/auth/Auth'
import PasswordReset from '@/components/auth/PasswordReset'
import RequestPasswordReset from '@/components/auth/RequestPasswordReset'
import { showError, noPermissAccess } from "@/global";
import { capitalizeFirst } from "@/config/globalFacilities";

import { userKey } from '@/global'

Vue.use(VueRouter)

/**
 * Rotas que dispensam validação de usuário devem ser 
 * acrescentadas ao const alternates em App.vue
 */

const routes = [{
    name: 'home',
    path: '/',
    component: Home
}, {
    name: 'user-unlock',
    path: '/user-unlock/:id/:token',
}, {
    name: 'cadastro',
    path: '/cadastros/:cpf/:matricula',
    component: CadastroPanels,
    meta: { requiresTipoUsuario2: true }
}, {
    name: 'cadastros',
    path: '/cadastros',
    component: CadastrosGrid,
    meta: { requiresTipoUsuario1: true, requiresTipoUsuario2: true }
}, {
    name: 'Painel de servidor',
    path: '/servidor-panel/:id',
    component: CadasPanels,
}, {
    name: 'validator',
    path: '/validator/:tk',
    component: Validator,
}, {
    name: 'adminPages',
    path: '/admin',
    component: AdminPages,
}, {
    name: 'printingPages',
    path: '/relatorios',
    component: PrintingPages,
}, {
    name: 'AdministracaConsignados',
    path: '/admin-consignacoes',
    component: ConAdminPanels,
    meta: { requiresGestor: true }
}, {
    name: 'AdministrarContratos',
    path: '/admin-contratos',
    component: ContrAdminPanels,
    meta: { requiresGestor: false }
}, {
    name: 'apresentacao',
    path: '/apresentacao',
    component: Presentation
}, {
    name: 'auth',
    path: '/auth',
    component: Auth
}, {
    name: 'password-reset',
    path: '/password-reset/:token',
    component: PasswordReset
}, {
    name: 'request-password-reset',
    path: '/request-password-reset',
    component: RequestPasswordReset
}]

const router = new VueRouter({
    mode: 'history',
    routes
})

// router.beforeEach((to, from, next) => {
//     const json = localStorage.getItem(userKey)
//     const user = JSON.parse(json)
//     if (!(user && user.id)) next({ path: '/auth' })
//     else next()
// })

router.beforeEach((to, from, next) => {
    const json = localStorage.getItem(userKey)
    const user = JSON.parse(json)
    if (user && to.matched.some(record => record.meta.requiresTipoUsuario1 || record.meta.requiresTipoUsuario2)) {
        if (user.tipoUsuario >= 1) next()
        else {
            // showError(`Ops!!! Parece que você não tem acesso a esta funcionalidade "${capitalizeFirst(to.name)}"`)
            showError(`${noPermissAccess} "${capitalizeFirst(to.name)}"`)
            next({ path: '/' })
        }
    } else if (user && to.matched.some(record => record.meta.requiresGestor)) {
        if (user.gestor >= 1) next()
        else {
            showError(`${noPermissAccess} "${capitalizeFirst(to.name)}"`)
            next({ path: '/' })
        }
    } else {
        next()
    }
})

export default router