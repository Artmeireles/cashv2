import { createRouter, createWebHistory } from 'vue-router'
import { userKey } from '../global'
import AppLayout from '@/layout/AppLayout.vue'

const routes = [
  {
    path: '/app',
    component: AppLayout,
    children: [
      {
        path: '/',
        name: 'home',
        component: () => import('@/components/HomeView.vue')
      },
    ]
  },
  {
    path: '/',
    name: 'home',
    // component: () => import('@/views/pages/Empty.vue')
    // component: () => import('@/views/pages/Landing.vue')
    component: () => import('@/views/pages/Home.vue')
  },
  {
    path: '/signin',
    name: 'signin',
    component: () => import('@/views/pages/SignIn.vue')
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('@/views/pages/SignUp.vue')
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
  const json = localStorage.getItem(userKey)
  const user = JSON.parse(json)
  const paths = []
  routes.forEach(element => {
    paths.push(element.path)
  });
  if (!paths.includes(to.path)) next({ path: '/not-found' })
  else if ((user && user.id) && to.path == '/signin') next({ path: '/' })
  else {
    if (!['/', '/signin', '/signup', '/not-found'].includes(to.path) && !(user && user.id)) next({ path: '/signin' })
    else next()
  }
})

export default router
