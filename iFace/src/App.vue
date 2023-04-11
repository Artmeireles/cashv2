<template>
  <div class="container">
    <Toast />
    <DynamicDialog />
    <RouterView />
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
    return {}
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
  },
  computed: {
    ...mapState(useUserStore, ['userStore']),
  },
  watch: {
    userStore() { }
  },
  created() {
    this.validateToken();
  }
}
</script>

<style scoped>
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
</style>
