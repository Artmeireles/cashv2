/* eslint-disable vue/no-reserved-component-names */
/* eslint-disable vue/multi-word-component-names */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ToastService from 'primevue/toastservice'
import DynamicDialog from 'primevue/dynamicdialog';
import DialogService from 'primevue/dialogservice';
import Password from 'primevue/password'
import Divider from 'primevue/divider'
import Checkbox from 'primevue/checkbox'
import FocusTrap from 'primevue/focustrap';
import Image from 'primevue/image';
import Menubar from 'primevue/menubar';

import '@/assets/app.css'
import '@/assets/styles.scss';
import 'primeflex/primeflex.scss';
import "primevue/resources/primevue.min.css"
import "primeicons/primeicons.css"

const app = createApp(App)
export const global = app.global

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
    ripple: true,
    inputStyle: 'filled',
    locale: {
        accept: 'Sim',
        reject: 'Não',
    }
})
app.directive('focustrap', FocusTrap);
app.use(ToastService)
app.use(DialogService);

app.component('InputText', InputText)
app.component('Button', Button)
app.component('Toast', Toast)
app.component('DynamicDialog', DynamicDialog)
app.component('Password', Password)
app.component('Divider', Divider)
app.component('Checkbox', Checkbox)
app.component('Image', Image)
app.component('Menubar', Menubar)

app.mount('#app')