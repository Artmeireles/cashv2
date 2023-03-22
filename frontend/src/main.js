import Vue from 'vue'
import { BootstrapVueIcons } from 'bootstrap-vue'


import App from './App'
import VueCookies from 'vue-cookies'

import ViaCep from 'vue-viacep'
import money from 'v-money'

import './config/bootstrap'
import './config/msgs'
import './config/axios'
import './config/mq'

import store from './config/store'
import router from './config/router'
import VueConfirmDialog from 'vue-confirm-dialog'
import vSelect from 'vue-select'

Vue.use(BootstrapVueIcons)
Vue.use(VueConfirmDialog)
Vue.component('vue-confirm-dialog', VueConfirmDialog.default)
Vue.component('v-select', vSelect)
Vue.use(ViaCep);
Vue.use(money, {
    decimal: ",",
    thousands: ".",
    prefix: "",
    suffix: "",
    precision: 2,
    masked: false,
});
Vue.config.productionTip = false
Vue.use(VueCookies)

new Vue({
    store,
    router,
    render: h => h(App)
}).$mount('#app')