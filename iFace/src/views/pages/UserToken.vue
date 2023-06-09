<template>
    <div class="align-items-center justify-content-center ">
        <div class="flex flex-column align-items-center justify-content-center">
            <p>{{ idUser }}</p>
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

                    <form @submit.prevent="signup" class="max-w-30rem">
                        <div class="formgrid grid" v-if="tokenTimeLeft > 0">
                            <div class="field col-12">
                                <label for="token" class="block text-900 text-xl font-medium mb-2">Seu token</label>
                                <InputMask id="celular" type="text" mask="********" placeholder="Seu token enviado por SMS"
                                    class="text-base text-color surface-overlay p-2 border-1 border-solid surface-border 
                                border-round appearance-none outline-none focus:border-primary w-full"
                                    style="padding: 1rem" v-model="token" />
                            </div>
                        </div>

                        <Button v-if="tokenTimeLeft > 0" rounded label="Registrar" icon="pi pi-sign-in" :disabled="!(token)"
                            type="submit" class="w-full p-3 text-xl mt-3 mb-3 gap-5"></Button>
                        <Button v-else rounded label="Solicite outro token por SMS" icon="pi pi-sign-in" type="submit"
                            class="w-full p-3 text-xl mt-3 mb-3 gap-5"></Button>
                        <Button link style="color: var(--primary-color)"
                            class="font-medium no-underline ml-2 text-center cursor-pointer" @click="router.push('/')"><i
                                class="pi pi-backward"></i>&nbsp;Início</Button>
                        <Button link style="color: var(--primary-color)"
                            class="font-medium no-underline ml-2 text-center cursor-pointer"
                            @click="router.push('/forgot')">Esqueceu a senha?</Button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>
               
<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { appName } from "@/global"
import { useRoute, useRouter } from 'vue-router'
import { baseApiUrl } from "@/env"
import axios from '@/axios-interceptor'
import { useToast } from 'primevue/usetoast';

const router = useRouter()
const route = useRoute()
const toast = useToast();

const idUser = ref('');
const token = ref('');
const tokenTimeMinutesLeft = ref(2)
const tokenTimeLeft = ref(tokenTimeMinutesLeft.value * 60)
const tokenTimeMessage = ref('')
const urlUnlock = ref(`${baseApiUrl}/user-unlock/`)

const logoUrl = computed(() => {
    return `assets/images/logo-app.svg`;
});


onMounted(() => {
    setInterval(() => {
        if (tokenTimeLeft.value > 0) {
            tokenTimeLeft.value--
            tokenTimeMinutesLeft.value = Math.floor(tokenTimeLeft.value / 60)
            if (tokenTimeMinutesLeft.value >= 1)
                tokenTimeMessage.value = `Dentro de ${tokenTimeMinutesLeft.value + 1} minutos, informe o token enviado por SMS`
            else
                tokenTimeMessage.value = `Dentro de ${tokenTimeLeft.value + 1} segundos, informe o token enviado por SMS`
        }
    }, 1000);
    idUser.value = route.query.q
})

const signup = async () => {
    const urlTo = `${urlUnlock.value}${route.query.q}`
    if (token.value) {
        // Se preencheu todos os dados obrigatórios
        if (!!token.value && !!route.query.q) {
            axios.post(urlTo, {
                token: token.value
            })
                .then((body) => {
                    const user = body.data
                    const msgTimeLife = user.msg.split(' ').length
                    toast.add({ severity: 'success', detail: user.msg, life: msgTimeLife * 500 })
                    router.push({ name: 'signin' })
                })
                .catch((error) => {
                    toast.removeAllGroups();
                    const msg = error.response.data.msg
                    const msgTimeLife = msg.split(' ').length
                    return toast.add({ severity: 'error', detail: msg, life: msgTimeLife * 500 })
                })
        }
    }
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
                            