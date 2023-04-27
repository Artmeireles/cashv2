<template>
  <div :class="userStore.id ? formatClass : 'container'">
    <RouterView />
    <Toast />
    <DynamicDialog />
  </div>
</template>

<script >
import { useUserStore } from "@/stores/user"
import { mapState } from 'pinia'
import { userKey } from "@/global"

export default {
  name: "App",
  components: {},
  data: function () {
    return {
      // formatClass: "container desktopBgn"
      formatClass: "container"
    }
  },
  methods: {
    logout() {
      this.$router.push({ path: "/" });
      useUserStore().logout()
    },
    async validateToken() {
      const json = localStorage.getItem(userKey);
      const userData = JSON.parse(json);

      const store = useUserStore()
      await store.validateToken(userData)
    },
    getMainClass() {
      // if (isMobileOnly) this.formatClass = "content mobileBgn";
      // else 
      this.formatClass = "content desktopBgn";
    },
  },
  computed: {
    ...mapState(useUserStore, ['userStore']),
    ...mapState(useCounterStore, ['userTimeToLogOut']),
  },
  watch: {
    userStore() { }
    userStore() { }
  },
  created() {
    this.validateToken();
  }
}
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
