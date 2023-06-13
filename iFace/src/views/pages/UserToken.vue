<template>
    <div class="align-items-center justify-content-center">
        <div class="flex flex-column max-w-25rem md:max-w-45rem ">
            <div
                style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full text-center surface-card py-5 px-5" style="border-radius: 53px">
                    <div class="text-center mb-2">
                        <img :src="logoUrl" :alt="`${appName} logo`" class="mb-2 w-4rem flex-shrink-0" />
                        <div class="text-900 text-3xl font-medium mb-3">
                            Bem vindo ao {{ appName }}<small><sup>&copy;</sup></small>
                        </div>
                        <span class="text-600 font-medium" v-if="tokenTimeLeft > 0">Informe seu token</span>
                    </div>
                    <div v-if="tokenTimeLeft > 0" class="text-center mb-2">
                        <span style="color: chocolate; text-decoration: underline; ">
                            {{ tokenTimeMessage }}
                        </span>
                    </div>

                    <form @submit.prevent="unlock" class="max-w-30rem">
                        <div class="formgrid grid" v-if="tokenTimeLeft > 0">
                            <div class="field col-12">
                                <label for="token1" class="block text-900 text-xl font-medium mb-2">Seu token</label>
                                <div v-focustrap
                                    class="flex flex-wrap justify-content-center card-container blue-container gap-1">
                                    <InputText autofocus v-model="token1" id="token1" autocomplete="off" maxlength="1"
                                        :size="1" @input="moveToNextInput(1)" pattern="[0-9a-zA-Z]{1}"
                                        class="centered-input" style="max-width: 30px; text-transform:uppercase" />
                                    <InputText v-model="token2" id="token2" autocomplete="off" maxlength="1" :size="1"
                                        @input="moveToNextInput(2)" pattern="[0-9a-zA-Z]{1}" class="centered-input"
                                        style="max-width: 30px; text-transform:uppercase" />
                                    <InputText v-model="token3" id="token3" autocomplete="off" maxlength="1" :size="1"
                                        @input="moveToNextInput(3)" pattern="[0-9a-zA-Z]{1}" class="centered-input"
                                        style="max-width: 30px; text-transform:uppercase" />
                                    <InputText v-model="token4" id="token4" autocomplete="off" maxlength="1" :size="1"
                                        @input="moveToNextInput(4)" pattern="[0-9a-zA-Z]{1}" class="centered-input"
                                        style="max-width: 30px; text-transform:uppercase" />
                                    <InputText v-model="token5" id="token5" autocomplete="off" maxlength="1" :size="1"
                                        @input="moveToNextInput(5)" pattern="[0-9a-zA-Z]{1}" class="centered-input"
                                        style="max-width: 30px; text-transform:uppercase" />
                                    <InputText v-model="token6" id="token6" autocomplete="off" maxlength="1" :size="1"
                                        @input="moveToNextInput(6)" pattern="[0-9a-zA-Z]{1}" class="centered-input"
                                        style="max-width: 30px; text-transform:uppercase" />
                                    <InputText v-model="token7" id="token7" autocomplete="off" maxlength="1" :size="1"
                                        @input="moveToNextInput(7)" pattern="[0-9a-zA-Z]{1}" class="centered-input"
                                        style="max-width: 30px; text-transform:uppercase" />
                                    <InputText v-model="token8" id="token8" autocomplete="off" maxlength="1" :size="1"
                                        @input="unlock" class="centered-input"
                                        style="max-width: 30px; text-transform:uppercase" />
                                </div>
                            </div>
                        </div>

                        <Button v-if="tokenTimeLeft > 0" rounded label="Registrar" icon="pi pi-sign-in"
                            :disabled="!(token1 && token2 && token3 && token4 && token5 && token6 && token7 && token8)"
                            type="submit" class="w-full p-3 text-xl mt-3 mb-3 gap-5"></Button>
                        <Button v-else rounded label="Solicite outro token por SMS" icon="pi pi-sign-in"
                            @click="getNewToken" class="w-full p-3 text-xl mt-3 mb-3 gap-5"></Button>
                    </form>
                    <Button link style="color: var(--primary-color)"
                        class="font-medium no-underline ml-2 text-center cursor-pointer" @click="router.push('/')"><i
                            class="pi pi-backward"></i>&nbsp;Início</Button>
                    <Button link style="color: var(--primary-color)"
                        class="font-medium no-underline ml-2 text-center cursor-pointer"
                        @click="router.push('/forgot')">Esqueceu a senha?</Button>
                </div>
            </div>
        </div>
    </div>
</template>
               
<script setup>
import { ref, computed, onMounted } from 'vue';
import { appName } from "@/global"
import { useRoute, useRouter } from 'vue-router'
import { baseApiUrl } from "@/env"
import axios from '@/axios-interceptor'
import { defaultSuccess, defaultError } from "@/toast"

const router = useRouter()
const route = useRoute()

const idUser = ref('');
const token1 = ref('');
const token2 = ref('');
const token3 = ref('');
const token4 = ref('');
const token5 = ref('');
const token6 = ref('');
const token7 = ref('');
const token8 = ref('');
const tokenTimeMinutesLeft = ref(0)
const tokenTimeLeft = ref(0)
const tokenTimeMessage = ref('')
const urlUnlock = ref(`${baseApiUrl}/user-unlock/`)

const logoUrl = computed(() => {
    return `assets/images/logo-app.svg`;
});


onMounted(async () => {
    idUser.value = route.query.q
    await getTokenTime()
})

const unlock = async () => {
    const urlTo = `${urlUnlock.value}${idUser.value}`
    if (token1.value && token2.value && token3.value && token4.value && token5.value && token6.value && token7.value && token8.value) {
        // Se preencheu todos os dados obrigatórios
        if (!!token1.value && !!idUser.value) {
            axios.post(urlTo, {
                token: token1.value
            })
                .then((body) => {
                    const user = body.data
                    defaultSuccess(user.msg)
                    router.push({ name: 'signin' })
                })
                .catch((error) => {
                    return defaultError(error.response.data.msg)
                })
        }
    }
}

const getTokenTime = async () => {
    const urlTo = `${baseApiUrl}/users/f/gtt?q=${idUser.value}`
    if (idUser.value) {
        await axios.get(urlTo)
            .then((body) => {
                const gtt = body.data.gtt
                tokenTimeLeft.value = gtt
                setInterval(() => {
                    if (tokenTimeLeft.value > 0) {
                        tokenTimeLeft.value--
                        tokenTimeMinutesLeft.value = Math.floor(tokenTimeLeft.value / 60) + 1
                        if (tokenTimeMinutesLeft.value > 1)
                            tokenTimeMessage.value = `Dentro de ${tokenTimeMinutesLeft.value} minutos, informe o token enviado por SMS`
                        else
                            tokenTimeMessage.value = `Dentro de ${tokenTimeLeft.value + 1} segundos, informe o token enviado por SMS`
                    }
                }, 1000);
            })
            .catch((error) => {
                const data = error.response.data
                if (data.isToken == false || data.isTokenValid == false) defaultError(data.msg)
                if (data.isToken == false) return router.push({ path: "/" })
            })
    } else {
        return defaultError("Token de validação não informado")
    }
}

const getNewToken = async () => {
    const urlTo = `${baseApiUrl}/user-sms-unlock`
    await axios.patch(urlTo, { id: idUser.value })
        .then(async (body) => {
            await getTokenTime()
            defaultSuccess(body.data.msg)
        })
        .catch((error) => {
            return defaultError(error.response.data.msg)
        })
}

const moveToNextInput = (index) => {
    const nextInput = document.querySelector(`#token${index + 1}`);
    if (nextInput !== null) {
        nextInput.focus();
    }
}

</script>
                            
<style scoped>
.centered-input .p-inputtext {
    text-align: center;
}
</style>
                            