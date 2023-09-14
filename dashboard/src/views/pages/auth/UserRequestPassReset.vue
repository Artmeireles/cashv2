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
                        <span class="text-600 font-medium">Para trocar/recuperar sua senha,
                            digite abaixo seu e-mail ou CPF</span>
                    </div>

                    <form @submit.prevent="passRequest" class="">
                        <div class="flex flex-column mb-2">
                            <label for="cpf1" class="block text-900 text-xl font-medium mb-2">E-mail ou CPF</label>
                            <InputText id="cpf1" type="text" placeholder="Seu e-mail ou CPF" class="w-full"
                                style="padding: 1rem" v-model="cpf" />
                            <small id="username-help">Informe seu e-mail ou CPF para receber o token.</small>
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
                                @click="router.push('/signin')">Acessar plataforma</Button>
                        </div>
                        <Button rounded label="Acessar" icon="pi pi-sign-in" :loading="click" :disabled="!cpf" type="submit"
                            class="w-full p-3 text-xl"></Button>
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
    appName,
    // STATUS_WAITING, STATUS_SUSPENDED_BY_TKN,
    // STATUS_INACTIVE, STATUS_SUSPENDED, STATUS_ACTIVE,
    // STATUS_PASS_EXPIRED, STATUS_DELETE, MINIMUM_KEYS_BEFORE_CHANGE,
    // TOKEN_VALIDE_MINUTES
} from "@/global"
import { defaultSuccess, defaultError, defaultWarn } from "@/toast"
import { useRouter } from 'vue-router'
import axios from '@/axios-interceptor'
import { baseApiUrl } from "@/env"
const router = useRouter()

const cpf = ref('');
const click = ref(false)
const urlRequest = ref(`${baseApiUrl}/request-password-reset/`)

const logoUrl = computed(() => {
    return `/assets/images/logo-app.svg`;
});


const passRequest = async () => {
    if (cpf.value) {
        await axios.post(urlRequest.value, { cpf: cpf.value })
            .then(body => {
                if (body.data.id) {
                    router.push({ path: "password-reset", query: { q: body.data.id } });
                    defaultSuccess(body.data.msg)
                } else
                    defaultWarn("Ops! Parece que houve um erro ao executar sua solicitação. Por favor tente de novo")
            })
            .catch(error => {
                defaultError(error)
            })
    }
}
</script>
                            
<style scoped></style>
                            