<script setup>
import { useUserStore } from '@/stores/user';
import { userKey } from '@/global';
import { onMounted, ref } from 'vue';
const isTokenValid = ref(false);
const validateToken = async () => {
    const json = localStorage.getItem(userKey);
    const userData = JSON.parse(json);

    const store = useUserStore();
    await store.validateToken(userData);
    isTokenValid.value = store.isTokenValid;
};

onMounted(() => {
    validateToken();
});
</script>

<template>
    <div class="container">
        <router-view />
        <Toast position="bottom-right" v-if="!isTokenValid" />
        <!-- <DynamicDialog /> -->
    </div>
</template>

<style scoped>
.container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background-color: var(--orange-700);
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
