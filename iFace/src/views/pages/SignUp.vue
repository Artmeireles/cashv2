<template>
    <div class="align-items-center justify-content-center ">
        <div class="flex flex-column align-items-center justify-content-center">
            <div
                style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full surface-card py-5 px-5" style="border-radius: 53px">
                    <div class="text-center mb-2">
                        <img :src="logoUrl" :alt="`${appName} logo`" class="mb-2 w-4rem flex-shrink-0" />
                        <div class="text-900 text-3xl font-medium mb-3">
                            Bem vindo ao {{ appName }}<small><sup>&copy;</sup></small>
                        </div>
                        <span class="text-600 font-medium" v-if="!store.userStore.id">Informe seu CPF</span>
                        <p class="text-center mt-2" style="color: chocolate; text-decoration: underline; ">
                            Os dados pessoais só podem ser alterados no RH/DP de seu município
                        </p>
                    </div>

                    <form @submit.prevent="signup" class="max-w-30rem">
                        <div v-if="isNewUser" class="formgrid grid">
                            <div class="field col-12">
                                <label for="name" class="block text-900 text-xl font-medium mb-2">Seu nome</label>
                                <InputText id="name" type="text" placeholder="Seu nome" class="text-base text-color surface-overlay p-2 border-1 border-solid surface-border 
                                border-round appearance-none outline-none focus:border-primary w-full"
                                    style="padding: 1rem" v-model="name" />
                                <small id="username-help">Informe seu nome</small>
                            </div>
                            <div class="field col-12">
                                <label for="email" class="block text-900 text-xl font-medium mb-2">Seu e-mail</label>
                                <InputText id="email" type="text" placeholder="Seu e-mail" class="text-base text-color surface-overlay p-2 border-1 border-solid surface-border 
                                border-round appearance-none outline-none focus:border-primary w-full"
                                    style="padding: 1rem" v-model="email" />
                                <small id="username-help">Informe seu e-mail</small>
                            </div>
                            <div class="field col-12 md:col-6">
                                <label for="celular" class="block text-900 text-xl font-medium mb-2">Seu celular</label>
                                <InputMask id="celular" type="text" mask="(99) 99999-9999" placeholder="(99) 99999-9999"
                                    class="text-base text-color surface-overlay p-2 border-1 border-solid surface-border 
                                border-round appearance-none outline-none focus:border-primary w-full"
                                    style="padding: 1rem" v-model="celular" />
                                <small id="username-help">Informe seu celular</small>
                            </div>
                            <div class="field col-12 md:col-6">
                                <label for="cpf" class="block text-900 text-xl font-medium mb-2">Seu CPF</label>
                                <InputText id="cpf" type="text" placeholder="Seu CPF" class="text-base text-color surface-overlay p-2 border-1 border-solid surface-border 
                                border-round appearance-none outline-none focus:border-primary w-full"
                                    style="padding: 1rem" v-model="cpf" />
                                <small id="username-help">Informe seu CPF</small>
                            </div>
                            <div class="field col-12 md:col-6">
                                <label for="password" class="block text-900 text-xl font-medium mb-2">Sua senha</label>
                                <InputText id="password" type="password" placeholder="Sua senha" class="text-base text-color surface-overlay p-2 border-1 border-solid surface-border 
                                border-round appearance-none outline-none focus:border-primary w-full"
                                    style="padding: 1rem" v-model="password" />
                                <small id="username-help">Informe sua senha</small>
                            </div>
                            <div class="field col-12 md:col-6">
                                <label for="confirmPassword" class="block text-900 text-xl font-medium mb-2">Confirme sua
                                    senha</label>
                                <InputText id="confirmPassword" type="password" placeholder="Sua senha" class="text-base text-color surface-overlay p-2 border-1 border-solid surface-border 
                                border-round appearance-none outline-none focus:border-primary w-full"
                                    style="padding: 1rem" v-model="confirmPassword" />
                                <small id="username-help">Confirme sua senha</small>
                            </div>
                        </div>
                        <div v-if="!store.userStore.id && !isNewUser" class="flex flex-column gap-2 mb-2">
                            <label for="cpf" class="block text-900 text-xl font-medium mb-1">CPF</label>
                            <InputText id="cpf" type="text" placeholder="Seu CPF" class="w-full md:w-30rem "
                                style="padding: 1rem" v-model="cpf" />
                            <small id="username-help">Informe seu CPF para começar</small>
                        </div>

                        <Button rounded label="Registrar" icon="pi pi-sign-in" :disabled="!(cpf || click)" type="submit"
                            class="w-full p-3 text-xl mt-5 mb-5"></Button>
                        <div class="flex align-items-center justify-content-between mb-5 gap-5">
                            <Button link style="color: var(--primary-color)"
                                class="font-medium no-underline ml-2 text-center cursor-pointer"
                                @click="router.push('/')"><i class="pi pi-backward"></i>&nbsp;Início</Button>
                            <Button link style="color: var(--primary-color)"
                                class="font-medium no-underline ml-2 text-center cursor-pointer"
                                @click="router.push('/forgot')">Esqueceu a senha?</Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>
               
<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, computed } from 'vue';
import { appName } from "@/global"
import { useUserStore } from "@/stores/user"
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router'
import { baseApiUrl } from "@/env"
import axios from '@/axios-interceptor'

const store = useUserStore()

const toast = useToast();
const router = useRouter()

const cpf = ref('');
const name = ref('');
const email = ref('');
const celular = ref('');
const password = ref('');
const confirmPassword = ref('');
// const cpf = ref('38790440404');
// const name = ref('Outro servidor');
// const email = ref('tommendes@hotmail.com');
// const celular = ref('81982807245');
// const password = ref('141108@Le');
// const confirmPassword = ref('141108@Le');
const isNewUser = ref(false);
const url = ref(`${baseApiUrl}/signup`)
const click = ref(false)

const logoUrl = computed(() => {
    return `assets/images/logo-app.svg`;
});

const signup = async () => {
    if (cpf.value) {
    click.value = true
        const userFound = await findUserSignUp(cpf.value)
        // Se preencheu todos os dados obrigatórios
        if (!!cpf.value && !!name.value && !!celular.value && !!password.value && !!confirmPassword.value) {
            axios.post(url.value, {
                isNewUser: isNewUser.value,
                cpf: cpf.value,
                email: email.value,
                name: name.value,
                celular: celular.value,
                password: password.value,
                confirmPassword: confirmPassword.value,
            })
                .then((body) => {
                    const user = body.data
                    if (user.data.id) {
                        if (typeof (user.msg) == 'object') {

                            const lengths = []
                            user.msg.forEach(element => {
                                lengths.push(element.split(' ').length)
                            })
                            const msgTimeLife = Math.max(...lengths) * 500
                            user.msg.forEach(element => {
                                toast.add({ severity: 'success', detail: element, life: msgTimeLife * 500 })
                            });
                        } else {
                            const msgTimeLife = user.msg.split(' ').length
                            toast.add({ severity: 'success', detail: user.msg, life: msgTimeLife * 500 })
                        }
                        router.push({ path: '/u-token', query: { q: user.data.id } })
                    }
                })
                .catch((error) => {
                    toast.removeAllGroups();
                    const msg = error.response.data.msg
                    const msgTimeLife = msg.split(' ').length
                    return toast.add({ severity: 'error', detail: msg, life: msgTimeLife * 500 })
                })
        } else
            // #3 - Se não tem perfil e não é localizado nos schemas dos clientes todos os dados tornam-se obrigatórios exceto o id
            if (userFound.data.isNewUser) {
                isNewUser.value = true
                console.log('3: ', userFound);
                toast.removeAllGroups();
                const msgTimeLife = userFound.data.msg.split(' ').length
                return toast.add({ severity: 'info', detail: `${userFound.data.msg}`, life: msgTimeLife * 500 });
            } else
                // #1 - Se o solicitante já tem perfil
                if (userFound.data.registered) {
                    router.push({ path: "/signin" });
                    toast.removeAllGroups();
                    const msgTimeLife = userFound.data.msg.split(' ').length
                    return toast.add({ severity: 'warn', detail: `${userFound.data.msg}`, life: msgTimeLife * 500 });
                } else {
                    // #2 - O solicitante não tem perfil mas foi localizado dos dados nos schemas dos clientes
                    //    a) Celular inválido
                    if (!userFound.data.isCelularValid) {
                        const msgTimeLife = userFound.data.msg.split(' ').length
                        return toast.add({ severity: 'warn', detail: `${userFound.data.msg}`, life: msgTimeLife * 500 });
                    }
                    else {
                        const userFoundData = userFound.data
                        cpf.value = userFoundData.cpf;
                        name.value = userFoundData.name;
                        email.value = userFoundData.email;
                        celular.value = userFoundData.celular;
                        password.value = ref('141108@Le');
                        confirmPassword.value = ref('141108@Le');
                    }
                }
    click.value = false
    }
}

const findUserSignUp = async () => {
    const user = await axios.post(url.value, { cpf: cpf.value })
    return user
}
</script>
                            
<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
                            