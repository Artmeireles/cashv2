<template>
  <div class="container">
    <RouterView />
    <Toast />
    <DynamicDialog />
  </div>
</template>



<script setup>
import { useUserStore } from "@/stores/user"
import { userKey } from "@/global"
import { onMounted } from "vue";

const validateToken = async () => {
  const json = localStorage.getItem(userKey);
  const userData = JSON.parse(json);

  const store = useUserStore()
  await store.validateToken(userData)
}

onMounted(() => {
  validateToken()
})
</script>

<style>
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: var(--red-900);
}

.desktopBgn {
  background-image: url("/assets/images/wallpaper.jpg");
  /* Center and scale the image nicely */
  background-attachment: fixed;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

.mobileBgn {
  background-image: url("/assets/images/wallpaperMbl.jpg");
}
</style>
