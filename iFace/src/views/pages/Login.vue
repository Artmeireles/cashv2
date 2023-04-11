<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, computed } from 'vue';
import { appName } from "@/global"
import { useUserStore } from "@/stores/user"
import { useToast } from "primevue/usetoast"
import { useRouter } from 'vue-router'

const toast = useToast();
const router = useRouter()

const email = ref('');
const password = ref('');

const logoUrl = computed(() => {
    return `assets/images/logo-app.svg`;
});

const signin = async () => {
    const store = useUserStore()
    await store.registerUser(email.value, password.value)
    if (store.userStore && store.userStore.id) {
        router.push({ path: "/" });
        toast.add({ severity: 'success', detail: `Seja bem vindo ${store.userStore.name}!`, life: 3000 });
    } else {
        toast.add({ severity: 'error', detail: `Combinação de usuário e senha não localizado!`, life: 3000 });
    }
}
</script>

<template>
    <div class="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
        <div class="flex flex-column align-items-center justify-content-center">
            <img :src="logoUrl" :alt="`${appName} logo`" class="mb-5 w-6rem flex-shrink-0" />
            <div
                style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full surface-card py-8 px-5 sm:px-8" style="border-radius: 53px">
                    <div class="text-center mb-5">
                        <div class="text-900 text-3xl font-medium mb-3">
                            Bem vindo ao {{ appName }}<small><sup>&copy;</sup></small>
                        </div>
                        <span class="text-600 font-medium">Faça login para continuar</span>
                    </div>

                    <div>
                        <label for="email1" class="block text-900 text-xl font-medium mb-2">Email ou CPF</label>
                        <InputText id="email1" type="text" placeholder="Email address" class="w-full md:w-30rem mb-5"
                            style="padding: 1rem" v-model="email" />

                        <label for="password1" class="block text-900 font-medium text-xl mb-2">Senha</label>
                        <Password id="password1" v-model="password" placeholder="Password" :toggleMask="true"
                            class="w-full mb-3" inputClass="w-full"></Password>

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
                        <Button label="Acessar" @click="signin" class="w-full p-3 text-xl"></Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

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
