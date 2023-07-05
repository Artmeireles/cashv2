<script setup>
import { ref, computed } from 'vue';
import { appName } from '@/global';
import { defaultSuccess, defaultInfo, defaultWarn } from '@/toast';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';
import { baseApiUrl } from '@/env';
import axios from '@/axios-interceptor';

const store = useUserStore();

const router = useRouter();

const id = ref('');
const cpf = ref('');
const name = ref('');
const email = ref('');
const celular = ref('');
const password = ref('');
const confirmPassword = ref('');
const isNewUser = ref(false);
const canEditData = ref(false);
const url = ref(`${baseApiUrl}/signup`);
const click = ref(false);

const logoUrl = computed(() => {
    return `assets/images/logo-app.svg`;
});

const signup = async () => {
    if (cpf.value) {
        click.value = true;
        const userFound = await findUserSignUp(cpf.value);
        // Se preencheu todos os dados obrigatórios
        if (!!cpf.value && !!name.value && !!celular.value && !!password.value && !!confirmPassword.value) {
            axios
                .post(url.value, {
                    isNewUser: isNewUser.value,
                    id: id.value,
                    cpf: cpf.value,
                    email: email.value,
                    name: name.value,
                    celular: celular.value,
                    password: password.value,
                    confirmPassword: confirmPassword.value
                })
                .then((body) => {
                    const user = body.data;
                    if (user.data.id) {
                        defaultSuccess(user.msg);
                        router.push({ path: '/u-token', query: { q: user.data.id } });
                    }
                })
                .catch((error) => {
                    return defaultWarn(error.response.data.msg);
                });
        }
        // #3 - Se não tem perfil e não é localizado nos schemas dos clientes todos os dados tornam-se obrigatórios exceto o id
        else if (userFound.data.isNewUser) {
            isNewUser.value = true;
            canEditData.value = true;
            defaultInfo(userFound.data.msg);
        }
        // #1 - Se o solicitante já tem perfil
        else if (userFound.data.registered) {
            router.push({ path: '/signin' });
            defaultWarn(userFound.data.msg);
        } else {
            // #2 - O solicitante não tem perfil mas foi localizado nos schemas dos clientes
            //    a) Celular inválido
            if (!userFound.data.isCelularValid) {
                defaultWarn(userFound.data.msg);
            }
            //    a) Celular válido
            else {
                const userFoundData = userFound.data;
                id.value = userFoundData.id;
                cpf.value = userFoundData.cpf;
                name.value = userFoundData.nome;
                email.value = userFoundData.email;
                celular.value = userFoundData.celular;
                isNewUser.value = true;
                canEditData.value = false;
                delete password.value;
                delete confirmPassword.value;
            }
        }
        click.value = false;
    }
};

const findUserSignUp = async () => {
    const user = await axios.post(url.value, { cpf: cpf.value });
    return user;
};
</script>

<!-- eslint-disable vue/multi-word-component-names -->
<template>
    <div class="align-items-center justify-content-center">
        <div class="flex flex-column max-w-25rem md:max-w-30rem">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full surface-card py-5 px-5" style="border-radius: 53px">
                    <div class="text-center mb-2">
                        <img :src="logoUrl" :alt="`${appName} logo`" class="mb-2 w-4rem flex-shrink-0" />
                        <div class="text-900 text-3xl font-medium mb-2">
                            Bem vindo ao {{ appName }}<small><sup>&copy;</sup></small>
                        </div>
                        <p class="text-600 font-medium">Informe a seguir os dados solicitados</p>
                        <p v-if="!store.userStore.id && !isNewUser" class="text-center mt-2 text-xlg font-bold" style="color: chocolate; text-decoration: underline">Os dados pessoais só podem ser alterados<br />no RH/DP de seu município</p>
                    </div>

                    <form @submit.prevent="signup">
                        <div v-if="isNewUser" class="formgrid grid">
                            <div class="field col-12" :class="canEditData ? ' mt-3' : ' mt-2'">
                                <span v-if="canEditData" class="p-float-label">
                                    <InputText
                                        id="name"
                                        type="text"
                                        class="text-base text-color surface-overlay p-2 border-1 border-solid surface-border border-round appearance-none outline-none focus:border-primary w-full"
                                        style="padding: 1rem"
                                        v-model="name"
                                    />
                                    <label for="name">Seu nome</label>
                                </span>
                                <div v-else>
                                    <label for="name" class="block text-900 text-xl font-medium mb-2">Seu nome</label>
                                    <InputText class="shadow-4 p-2 w-full surface-500 text-white font-bold border-round" disabled style="padding: 1rem" :value="name" />
                                </div>
                            </div>
                            <div class="field col-12" :class="canEditData ? ' mt-3' : ' mt-2'">
                                <span v-if="canEditData" class="p-float-label">
                                    <InputText id="email" type="text" class="p-2 w-full" style="padding: 1rem" v-model="email" />
                                    <label for="email">Seu e-mail</label>
                                </span>
                                <div v-else>
                                    <label for="email" class="block text-900 text-xl font-medium mb-2">Seu e-mail</label>
                                    <InputText class="shadow-4 p-2 w-full surface-500 text-white font-bold border-round" disabled style="padding: 1rem" :value="email" />
                                </div>
                            </div>
                            <div class="field col-12 md:col-6" :class="canEditData ? ' mt-3' : ' mt-2'">
                                <span v-if="canEditData" class="p-float-label">
                                    <InputMask id="celular" type="text" mask="(99) 99999-9999" class="p-2 w-full" style="padding: 1rem" v-model="celular" />
                                    <label for="celular">Seu celular</label>
                                </span>
                                <div v-else>
                                    <label for="name" class="block text-900 text-xl font-medium mb-2">Seu celular</label>
                                    <InputText class="shadow-4 p-2 w-full surface-500 text-white font-bold border-round" disabled style="padding: 1rem" :value="celular" />
                                </div>
                            </div>
                            <div class="field col-12 md:col-6" :class="canEditData ? ' mt-3' : ' mt-2'">
                                <span v-if="canEditData" class="p-float-label">
                                    <InputText id="cpf" type="text" class="p-2 w-full" style="padding: 1rem" v-model="cpf" />
                                    <label for="cpf">Seu CPF</label>
                                </span>
                                <div v-else>
                                    <label for="cpf" class="block text-900 text-xl font-medium mb-2">Seu CPF</label>
                                    <InputText class="shadow-4 p-2 w-full surface-500 text-white font-bold border-round" disabled style="padding: 1rem" :value="cpf" />
                                </div>
                            </div>
                            <div class="field col-12 md:col-6" :class="canEditData ? ' mt-3' : ' mt-2'">
                                <span class="p-float-label">
                                    <InputText id="password" type="password" autocomplete="off" class="p-2 w-full" style="padding: 1rem" v-model="password" />
                                    <label for="password">Sua senha</label>
                                </span>
                            </div>
                            <div class="field col-12 md:col-6" :class="canEditData ? ' mt-3' : ' mt-2'">
                                <span class="p-float-label">
                                    <InputText id="confirmPassword" type="password" autocomplete="off" class="p-2 w-full" style="padding: 1rem" v-model="confirmPassword" />
                                    <label for="confirmPassword">Confirme sua senha</label>
                                </span>
                            </div>
                        </div>
                        <div v-if="!store.userStore.id && !isNewUser" class="flex flex-column mb-2">
                            <label for="cpf" class="block text-900 text-xl font-medium mb-1">CPF</label>
                            <InputText id="cpf" type="text" placeholder="Seu CPF" class="w-full" style="padding: 1rem" v-model="cpf" />
                        </div>
                        <small v-if="!store.userStore.id && !isNewUser" id="username-help">Informe seu CPF para começar</small>

                        <div class="flex align-items-center justify-content-between mb-2">
                            <Button link style="color: var(--primary-color)" class="font-medium no-underline ml-2 text-center cursor-pointer" @click="router.push('/signin')">Acessar plataforma&nbsp;<i class="pi pi-sign-in"></i></Button>
                            <Button link style="color: var(--primary-color)" class="font-medium no-underline ml-2 text-center cursor-pointer" @click="router.push('/')">Início</Button>
                            <Button link style="color: var(--primary-color)" class="font-medium no-underline ml-2 text-center cursor-pointer" @click="router.push('/request-password-reset')">Trocar/Recuperar a senha?</Button>
                        </div>
                        <Button rounded label="Registrar" icon="pi pi-sign-in" :loading="click" :disabled="!cpf" type="submit" class="w-full p-3 text-xl"></Button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>
