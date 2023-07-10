<script setup>
import { ref, computed, onMounted } from 'vue';
import { appName } from '@/global';
import { useRoute, useRouter } from 'vue-router';
import { baseApiUrl } from '@/env';
import axios from '@/axios-interceptor';
import { defaultSuccess, defaultError } from '@/toast';

const router = useRouter();
const route = useRoute();

const idUser = ref('');
const token1 = ref('');
const token2 = ref('');
const token3 = ref('');
const token4 = ref('');
const token5 = ref('');
const token6 = ref('');
const token7 = ref('');
const token8 = ref('');
const password = ref('');
const confirmPassword = ref('');
const tokenTimeMinutesLeft = ref(0);
const tokenTimeLeft = ref(0);
const tokenTimeMessage = ref('');
const tokenTimeLeftMessage = ref('');
const urlUnlock = ref(`${baseApiUrl}/password-reset/`);

const logoUrl = computed(() => {
    return `assets/images/logo-app.svg`;
});

onMounted(async () => {
    idUser.value = route.query.q;
    await getTokenTime();
});

const passReset = async () => {
    const urlTo = `${urlUnlock.value}${idUser.value}`;
    if (token1.value && token2.value && token3.value && token4.value && token5.value && token6.value && token7.value && token8.value) {
        // Se preencheu todos os dados obrigatórios
        if (idUser.value) {
            axios
                .put(urlTo, {
                    token: (token1.value + token2.value + token3.value + token4.value + token5.value + token6.value + token7.value + token8.value).toUpperCase(),
                    password: password.value,
                    confirmPassword: confirmPassword.value
                })
                .then((body) => {
                    const user = body.data;
                    router.push({ path: '/signin' });
                    defaultSuccess(user.msg);
                })
                .catch((error) => {
                    return defaultError(error.response.data);
                });
        }
    }
};

const getTokenTime = async () => {
    const urlTo = `${baseApiUrl}/users/f/gtt?q=${idUser.value}`;
    if (idUser.value) {
        await axios
            .get(urlTo)
            .then((body) => {
                const gtt = body.data.gtt;
                tokenTimeLeft.value = gtt;
                setInterval(() => {
                    if (tokenTimeLeft.value > 0) {
                        tokenTimeLeft.value--;
                        tokenTimeMinutesLeft.value = Math.floor(tokenTimeLeft.value / 60) + 1;
                        if (tokenTimeMinutesLeft.value > 1) {
                            tokenTimeMessage.value = `Dentro de ${tokenTimeMinutesLeft.value} minutos, informe o token enviado por SMS`;
                            tokenTimeLeftMessage.value = `Aguarde ${tokenTimeMinutesLeft.value} minutos para solicitar novo token`;
                        } else {
                            tokenTimeMessage.value = `Dentro de ${tokenTimeLeft.value + 1} segundos, informe o token enviado por SMS`;
                        }
                    } else tokenTimeLeftMessage.value = `Seu token venceu.<br>Clique abaixo para solicitar novo token`;
                }, 1000);
            })
            .catch((error) => {
                const data = error.response.data;
                if (data.isToken == false || data.isTokenValid == false) defaultError(data.msg);
                if (data.isToken == false) return router.push({ path: '/' });
            });
    } else {
        return defaultError('Token de validação não informado');
    }
};

const getNewToken = async () => {
    const urlTo = `${baseApiUrl}/user-sms-unlock`;
    await axios
        .patch(urlTo, { id: idUser.value })
        .then(async (body) => {
            tokenTimeLeftMessage.value = '';
            await getTokenTime();
            defaultSuccess(body.data.msg);
        })
        .catch((error) => {
            return defaultError(error.response.data.msg);
        });
};

const moveToNextInput = (index) => {
    let nextInput = undefined;
    if (typeof index === 'number') {
        nextInput = document.querySelector(`#token${index + 1}`);
    } else {
        nextInput = document.querySelector(`#${index}`);
    }
    if (nextInput !== null) {
        nextInput.focus();
    }
};
</script>

<template>
    <div class="align-items-center justify-content-center">
        <div class="flex flex-column max-w-25rem md:max-w-45rem">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full text-center surface-card py-5 px-5" style="border-radius: 53px">
                    <div class="text-center mb-2">
                        <img :src="logoUrl" :alt="`${appName} logo`" class="mb-2 w-4rem flex-shrink-0" />
                        <div class="text-900 text-3xl font-medium mb-3">
                            Bem vindo ao {{ appName }}<small><sup>&copy;</sup></small>
                        </div>
                    </div>
                    <div v-if="tokenTimeLeft > 0" class="text-center mb-2">
                        <span style="color: chocolate; text-decoration: underline">
                            {{ tokenTimeMessage }}
                        </span>
                    </div>

                    <form @submit.prevent="passReset" class="max-w-30rem">
                        <div class="formgrid grid" v-if="tokenTimeLeft > 0">
                            <div class="field col-12">
                                <label for="token1" class="block text-900 text-xl font-medium mb-2">Seu token</label>
                                <div v-focustrap class="flex flex-wrap justify-content-center card-container blue-container gap-1">
                                    <InputText
                                        autofocus
                                        v-model="token1"
                                        id="token1"
                                        autocomplete="off"
                                        maxlength="1"
                                        :size="1"
                                        @input="moveToNextInput(1)"
                                        pattern="[0-9a-zA-Z]{1}"
                                        class="centered-input"
                                        style="max-width: 30px; text-transform: uppercase"
                                    />
                                    <InputText v-model="token2" id="token2" autocomplete="off" maxlength="1" :size="1" @input="moveToNextInput(2)" pattern="[0-9a-zA-Z]{1}" class="centered-input" style="max-width: 30px; text-transform: uppercase" />
                                    <InputText v-model="token3" id="token3" autocomplete="off" maxlength="1" :size="1" @input="moveToNextInput(3)" pattern="[0-9a-zA-Z]{1}" class="centered-input" style="max-width: 30px; text-transform: uppercase" />
                                    <InputText v-model="token4" id="token4" autocomplete="off" maxlength="1" :size="1" @input="moveToNextInput(4)" pattern="[0-9a-zA-Z]{1}" class="centered-input" style="max-width: 30px; text-transform: uppercase" />
                                    <InputText v-model="token5" id="token5" autocomplete="off" maxlength="1" :size="1" @input="moveToNextInput(5)" pattern="[0-9a-zA-Z]{1}" class="centered-input" style="max-width: 30px; text-transform: uppercase" />
                                    <InputText v-model="token6" id="token6" autocomplete="off" maxlength="1" :size="1" @input="moveToNextInput(6)" pattern="[0-9a-zA-Z]{1}" class="centered-input" style="max-width: 30px; text-transform: uppercase" />
                                    <InputText v-model="token7" id="token7" autocomplete="off" maxlength="1" :size="1" @input="moveToNextInput(7)" pattern="[0-9a-zA-Z]{1}" class="centered-input" style="max-width: 30px; text-transform: uppercase" />
                                    <InputText v-model="token8" id="token8" autocomplete="off" maxlength="1" :size="1" @input="moveToNextInput('password')" class="centered-input" style="max-width: 30px; text-transform: uppercase" />
                                </div>

                                <div class="formgrid grid">
                                    <div class="field col-12 md:col-6 mt-4">
                                        <label for="password">Nova senha</label>
                                        <InputText id="password" type="password" autocomplete="off" class="p-2 w-full" style="padding: 1rem" v-model="password" />
                                    </div>
                                    <div class="field col-12 md:col-6 mt-4">
                                        <label for="confirmPassword">Confirme a senha</label>
                                        <InputText id="confirmPassword" type="password" autocomplete="off" class="p-2 w-full" style="padding: 1rem" v-model="confirmPassword" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="text-center mb-2">
                            <span style="color: chocolate; text-decoration: underline" v-html="tokenTimeLeftMessage" />
                        </div>

                        <div class="flex align-items-center justify-content-between mb-2">
                            <Button link style="color: var(--primary-color)" class="font-medium no-underline ml-2 text-center cursor-pointer" @click="router.push('/signin')">Acessar plataforma&nbsp;<i class="pi pi-sign-in"></i></Button>
                            <Button link style="color: var(--primary-color)" class="font-medium no-underline ml-2 text-center cursor-pointer" @click="router.push('/')">Início</Button>
                        </div>

                        <Button
                            v-if="tokenTimeLeft > 0"
                            rounded
                            label="Registrar"
                            icon="pi pi-sign-in"
                            :disabled="!(token1 && token2 && token3 && token4 && token5 && token6 && token7 && token8)"
                            type="submit"
                            class="w-full p-3 text-xl mt-3 mb-3 gap-5"
                        ></Button>
                        <Button v-else rounded label="Solicite outro token por SMS" icon="pi pi-sign-in" @click="getNewToken" class="w-full p-3 text-xl mt-3 mb-3 gap-5"></Button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.centered-input .p-inputtext {
    text-align: center;
}
</style>
