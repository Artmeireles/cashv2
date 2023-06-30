import { createRouter, createWebHistory } from 'vue-router'
import { userKey } from '../global'
// import AppLayout from '@/layout/AppLayout.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/pages/Home.vue')
  },
  {
    path: '/landing',
    name: 'landing',
    component: () => import('@/views/pages/Landing.vue')
  },
  {
    path: '/signin',
    name: 'signin',
    component: () => import('@/views/pages/SignIn.vue')
  },
  {
    path: '/modal',
    name: 'modal',
    component: () => import('@/views/pages/Modal.vue')
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('@/views/pages/SignUp.vue')
  },
  {
    path: '/u-token',
    name: 'u-token',
    component: () => import('@/views/pages/UserToken.vue')
  },
  {
    path: '/request-password-reset',
    name: 'request-password-reset',
    component: () => import('@/views/pages/UserRequestPassReset.vue')
  },
  {
    path: '/password-reset',
    name: 'password-reset',
    component: () => import('@/views/pages/UserPassReset.vue')
  },
  {
    path: '/not-found',
    name: 'not-found',
    component: () => import('@/views/pages/NotFound.vue')
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes
})

router.beforeEach((to, from, next) => {
  const nameUnblockedRoutes = ['home', 'signin', 'signup',
    'u-token', 'not-found', 'request-password-reset', 'password-reset']
  const json = localStorage.getItem(userKey)
  const user = JSON.parse(json)
  const paths = []
  routes.forEach(element => {
    paths.push(element.path)
  });
  if (!paths.includes(to.path)) next({ path: '/not-found' })
  else if ((user && user.id) && to.path == '/signin') next({ path: '/' })
  else {
    if (!nameUnblockedRoutes.includes(to.name) && !(user && user.id)) next({ path: '/signin' })
    else next()
  }
})

export default router
