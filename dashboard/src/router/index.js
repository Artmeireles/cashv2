import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from '@/layout/AppLayout.vue';
import { userKey } from '../global';

const routes = [
    {
        path: '/',
        component: AppLayout,
        children: [
            {
                path: '/:client/:domain',
                name: 'dashboard',
                component: () => import('@/views/Dashboard.vue')
            },
            {
                path: '/:client/:domain/servidores',
                name: 'servidores',
                component: () => import('@/views/servidores/ServidoresGrid.vue')
            },
            {
                path: '/:client/:domain/servidores/:id',
                name: 'servidor',
                component: () => import('@/views/servidores/ServidorPanel.vue')
            },
            {
                path: '/:client/:domain/serv-vinculos/:id_serv_vinc',
                name: 'serv-vinculos',
                component: () => import('@/views/servidoresVinculos/ServVinculosGrid.vue')
            },
            {
                path: '/:client/:domain/empresa',
                name: 'empresa',
                component: () => import('@/views/empresa/EmpresaForm.vue')
            },
            {
                path: '/:client/:domain/empresas',
                name: 'empresas',
                component: () => import('@/views/empresa/EmpresasGrid.vue')
            },
            {
                path: '/:client/:domain/aux-cargos',
                name: 'aux-cargos',
                component: () => import('@/views/auxCargos/AuxCargosGrid.vue')
            },
            {
                path: '/:client/:domain/fin-rubricas/:id_emp',
                name: 'fin-rubricas',
                component: () => import('@/views/finRubricas/FinRubricasGrid.vue')
            },
            {
                path: '/:client/:domain/cad-bancos',
                name: 'cad-bancos',
                component: () => import('@/views/cadBancos/CadBancosGrid.vue')
            },
            //remuneração            
            {
                path: '/:client/:domain/remun-params',
                name: 'remun-params',
                component: () => import('@/views/remuneracaoParams/ParametrosGrid.vue')
            },
            {
                path: '/:client/:domain/remuneracao/:id_serv_vinc',
                name: 'remuneracao',
                component: () => import('@/views/remuneracao/RemuneracaoGrid.vue')
            },
            {
                path: '/:client/:domain/remun-adfg',
                name: 'remun-adfg',
                component: () => import('@/views/remunADFG/RemunADFGGrid.vue')
            },
            //e-social
            {
                path: '/:client/:domain/es-params/:id_emp',
                name: 'es-params',
                component: () => import('@/views/esParams/EsParamsGrid.vue')
            },
            {
                path: '/:client/:domain/es-envios',
                name: 'es-envios',
                component: () => import('@/views/esEnvios/EsEnviosGrid.vue')
            },
            {
                path: '/:client/:domain/es-rejeicoes',
                name: 'es-rejeicoes',
                component: () => import('@/views/esRejeicoes/EsRejeicoesGrid.vue')
            },
            {
                path: '/:client/:domain/tabelas-cc',
                name: 'tabelas-cc',
                component: () => import('@/views/tabelasCC/TabelasCCGrid.vue')
            },
            {
                path: '/:client/:domain/tabelas/:id_emp',
                name: 'tabelas',
                component: () => import('@/views/tabelas/TabelasGrid.vue')
            }       
        ]
    },
    {
        path: '/welcome',
        name: 'welcome',
        component: () => import('@/views/pages/Home.vue')
    },
    {
        path: '/not-found',
        name: 'notfound',
        component: () => import('@/views/pages/NotFound.vue')
    },
    {
        path: '/signin',
        name: 'signin',
        component: () => import('@/views/pages/auth/SignIn.vue')
    },
    {
        path: '/signup',
        name: 'signup',
        component: () => import('@/views/pages/auth/SignUp.vue')
    },
    {
        path: '/password-reset',
        name: 'password-reset',
        component: () => import('@/views/pages/auth/UserPassReset.vue')
    },
    {
        path: '/request-password-reset',
        name: 'request-password-reset',
        component: () => import('@/views/pages/auth/UserRequestPassReset.vue')
    },
    {
        path: '/u-token',
        name: 'u-token',
        component: () => import('@/views/pages/auth/UserToken.vue')
    }
];
const router = createRouter({
    history: createWebHistory(),
    routes: routes
});

router.beforeEach((to, from, next) => {
    const nameUnblockedRoutes = ['welcome', 'signin', 'signup', 'u-token', 'not-found', 'request-password-reset', 'password-reset'];
    const json = localStorage.getItem(userKey);
    const user = JSON.parse(json);
    const paths = [];
    routes.forEach((element) => {
        // console.log(element.path);
        if (element.children)
            element.children.forEach((element) => {
                paths.push(element.path);
            });
        paths.push(element.path);
    });
    const matchSize = to.matched.length - 1;
    if (matchSize < 0 || !paths.includes(to.matched[matchSize].path)) next({ path: '/not-found' });
    else if (user && user.id && (to.path == '/signin' || !to.path.startsWith(`/${user.cliente}/${user.dominio}`))) {
        next({ path: `/${user.cliente}/${user.dominio}/` });
    } else {
        if (!nameUnblockedRoutes.includes(to.name) && !(user && user.id)) next({ path: '/welcome' });
        else next();
    }
});

export default router;
