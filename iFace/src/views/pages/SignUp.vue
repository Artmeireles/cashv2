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
                        <span class="text-600 font-medium" v-if="!store.userStore.id">Informe seu CPF para começar</span>
                        <code class="text-center mb-2"
          v-if="showSignup">Para sua segurança, seus dados pessoais devem ser confirmados no RH/DP de seu município</code>
                    </div>

                    <form @submit.prevent="signup">
                        <div class="text-center mb-2">
                            <h2 v-if="store.userStore.name">Olá {{ store.userStore.name }}</h2>
                            <span class="text-600 font-medium" v-if="store.userStore.id">Agora digite sua senha para
                                acessar</span>
                        </div>
                        <div v-if="!store.userStore.id" class="flex flex-column gap-2 mb-5">
                            <label for="email1" class="block text-900 text-xl font-medium mb-2">CPF</label>
                            <InputText id="email1" type="text" placeholder="Seu CPF" class="w-full md:w-30rem "
                                style="padding: 1rem" v-model="email" />
                            <small id="username-help">Informe seu CPF para começar.</small>
                        </div>
                        <div v-else class="flex flex-column gap-2 mb-3">
                            <!-- <Password id="password1" v-model="password" placeholder="Sua senha" :toggleMask="true"
                                class="w-full" inputClass="w-full"></Password> -->
                            <InputText id="password1" type="password" placeholder="Sua senha" class="w-full md:w-30rem "
                                style="padding: 1rem" v-model="password" />
                            <small id="username-help">Informe sua senha e clique em Acessar.</small>
                        </div>

                        <div class="flex align-items-center justify-content-between mb-5 gap-5">
                            <Button link style="color: var(--primary-color)"
                                class="font-medium no-underline ml-2 text-center cursor-pointer"
                                @click="this.$router.push('/signup')">Novo por aqui?</Button>
                            <Button link style="color: var(--primary-color)"
                                class="font-medium no-underline ml-2 text-center cursor-pointer"
                                @click="this.$router.push('/')"><i class="pi pi-backward"></i>&nbsp;Início</Button>
                            <Button link style="color: var(--primary-color)"
                                class="font-medium no-underline ml-2 text-center cursor-pointer"
                                @click="this.$router.push('/forgot')">Esqueceu a senha?</Button>
                        </div>
                        <Button rounded label="Acessar" icon="pi pi-sign-in" :disabled="!(email)" type="submit"
                            class="w-full p-3 text-xl"></Button>
                        <!-- </div> -->
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
import { useToast } from "primevue/usetoast"
import { useRouter } from 'vue-router'
const store = useUserStore()

const toast = useToast();
const router = useRouter()

const email = ref('');
const cpf = ref('');
const telefone = ref('');
const password = ref('');
const password = ref('');

const logoUrl = computed(() => {
    return `assets/images/logo-app.svg`;
});

const signup = async () => {
    if (email.value && password.value) {
        await store.registerUser(email.value, password.value)
        if (store.userStore && store.userStore.id) {
            router.push({ path: "/" });
            toast.add({ severity: 'success', detail: `Seja bem vindo ${store.userStore.name}!`, life: 3000 });
        } else {
            toast.add({ severity: 'error', detail: `Combinação de usuário e senha não localizado!`, life: 3000 });
        }
    } else {
        await store.findUser(email.value)
        if (store.userStore && store.userStore.id) {
            email.value = store.userStore.email
        } else {
            // email.value = undefined
            toast.add({ severity: 'warn', detail: `Não localizamos o e-mail ou CPF informado`, life: 5000 });
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
                            