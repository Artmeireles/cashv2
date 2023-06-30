<template>
    <div class="align-items-center justify-content-center">
        <div class="flex flex-column max-w-25rem md:max-w-30rem  ">
            <div
                style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full surface-card py-5 px-5" style="border-radius: 53px">
                    <div class="text-center mb-2">
                        <img :src="logoUrl" :alt="`${appName} logo`" class="mb-2 w-4rem flex-shrink-0" />
                        <div class="text-900 text-3xl font-medium mb-3">
                            Bem vindo ao {{ appName }}<small><sup>&copy;</sup></small>
                        </div>
                        <span class="text-600 font-medium" v-if="!store.userStore.id">Faça login para continuar</span>
                    </div>

                    <form @submit.prevent="signin" class="">
                        <div class="text-center mb-2">
                            <h2 v-if="store.userStore.name">Olá {{ store.userStore.name.split(' ')[0] }}</h2>
                            <span class="text-600 font-medium" v-if="store.userStore.id">Agora digite sua senha para
                                acessar</span>
                        </div>
                        <div v-if="!store.userStore.id" class="flex flex-column mb-2">
                            <label for="email1" class="block text-900 text-xl font-medium mb-2">E-mail ou CPF</label>
                            <InputText id="email1" type="text" placeholder="Seu e-mail ou CPF" class="w-full"
                                style="padding: 1rem" v-model="email" />
                            <small id="username-help">Informe seu e-mail ou CPF para acessar.</small>
                        </div>
                        <div v-else class="flex flex-column mb-2">
                            <InputText id="password1" type="password" autocomplete="off" placeholder="Sua senha"
                                class="w-full" style="padding: 1rem" v-model="password" />
                            <small id="username-help">Informe sua senha e clique em Acessar.</small>
                        </div>

                        <div class="flex align-items-center justify-content-between mb-2">
                            <Button link style="color: var(--primary-color)"
                                class="font-medium no-underline ml-2 text-center cursor-pointer"
                                @click="router.push('/signup')">Novo por aqui?</Button>
                            <Button link style="color: var(--primary-color)"
                                class="font-medium no-underline ml-2 text-center cursor-pointer"
                                @click="router.push('/')">Início</Button>
                            <Button link style="color: var(--primary-color)"
                                class="font-medium no-underline ml-2 text-center cursor-pointer"
                                @click="router.push('/request-password-reset')">Trocar/Recuperar a senha?</Button>
                        </div>
                        <Button rounded label="Acessar" icon="pi pi-sign-in" :loading="click" :disabled="!email"
                            type="submit" class="w-full p-3 text-xl"></Button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>
               
<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, computed, } from 'vue';
import {
    appName, STATUS_WAITING, STATUS_SUSPENDED_BY_TKN,
    // STATUS_INACTIVE, STATUS_SUSPENDED, STATUS_ACTIVE,
    // STATUS_PASS_EXPIRED, STATUS_DELETE, MINIMUM_KEYS_BEFORE_CHANGE,
    // TOKEN_VALIDE_MINUTES
} from "@/global"
import { defaultSuccess, defaultError } from "@/toast"
import { useUserStore } from "@/stores/user"
import { useRouter } from 'vue-router'

const store = useUserStore()

const router = useRouter()

const email = ref('');
const password = ref('');
const click = ref(false)

const logoUrl = computed(() => {
    return `assets/images/logo-app.svg`;
});


const signin = async () => {
    if (email.value && password.value) {
        try {
            click.value = !click.value
            await store.registerUser(email.value, password.value)
            if (store.userStore && store.userStore.isMatch) {
                router.push({ path: "/" });
                defaultSuccess(store.userStore.msg)
            } else {
                defaultError(store.userStore.msg)
            }
        } catch (error) {
            defaultError('Aparentemente houve um erro ao tentar logar no sistema. Tente novamente...')
        }
        click.value = false
    } else {
        await store.findUser(email.value)
        if (store.userStore && store.userStore.id && store.userStore.isStatusActive) {
            email.value = store.userStore.email
        } else if (store.userStore && store.userStore.msg) {
            defaultError(store.userStore.msg)
            if ([STATUS_WAITING, STATUS_SUSPENDED_BY_TKN].includes(store.userStore.status))
                return router.push({ path: '/u-token', query: { q: store.userStore.id } })
            // if ([STATUS_WAITING, STATUS_SUSPENDED_BY_TKN].includes(store.userStore.status))
            //     return router.push({ path: '/u-token', query: { q: store.userStore.id } })
        }
    }
}
</script>
                            
<style scoped></style>
                            