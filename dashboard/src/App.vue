<script setup>
import { useUserStore } from '@/stores/user';
import { userKey, glKey } from '@/global';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const isTokenValid = ref(false);
const validateToken = async () => {
    const json = localStorage.getItem(userKey);
    const userData = JSON.parse(json);
    const jsonGLK = localStorage.getItem(glKey);
    const geoLocationData = JSON.parse(jsonGLK);

    const store = useUserStore();
    await store.validateToken(userData, geoLocationData);
    isTokenValid.value = store.isTokenValid;
    if (!isTokenValid.value) router.push('/');
    if (isTokenValid.value && !(geoLocationData && geoLocationData.geolocation)) open();
};

onMounted(() => {
    validateToken();
});

const display = ref(false);
const open = () => {
    display.value = true;
};
const close = () => {
    display.value = false;
};
</script>

<template>
    <div class="container">
        <router-view />
        <Toast position="bottom-right" v-if="!isTokenValid" />
        <Dialog id="mdlGeoLoc" header="Segurança" v-model:visible="display" :breakpoints="{ '960px': '75vw' }" :style="{ width: '30vw' }" :modal="true">
            <p class="line-height-3 m-0">
                <strong>Atenção!</strong>
                <br />
                Nós cuidamos de sua segurança. Por isso, desse ponto em diante, algumas funcionalidades como <strong>averbar contratos e acessar contracheques</strong> dependem de sua localização.
                <br />
                Se deseja acesso total, permita o acesso à sua localização.
            </p>
            <template #footer>
                <Button label="Ok" @click="close" icon="pi pi-check" class="p-button-outlined" />
            </template>
        </Dialog>
        <ConfirmDialog group="templating">
            <template #message="slotProps">
                <div class="flex p-4">
                    <i :class="slotProps.message.icon" style="font-size: 1.5rem"></i>
                    <p class="pl-2">{{ slotProps.message.message }}</p>
                </div>
            </template>
        </ConfirmDialog>
    </div>
</template>

<style scoped>
.container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background-color: var(--orange-600);
}

.desktopBgn {
    background-image: url('/assets/images/wallpaper.jpg');
    /* Center and scale the image nicely */
    background-attachment: fixed;
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
}

.mobileBgn {
    background-image: url('/assets/images/wallpaperMbl.jpg');
}
</style>
