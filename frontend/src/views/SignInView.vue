<template>
  <div class="">
    <h1>Seja bem vindo ao {{ this.appName }}</h1>
    <form @submit.prevent="this.signin">
      <input placeholder="Seu nome" v-model="userAuth.email">
      <input type="password" placeholder="Sua senha" v-model="userAuth.password">
      <button>Acessar</button>
    </form>
  </div>
</template>

<script>
import { appName, userKey } from "@/global"
import { baseApiUrl } from "@/env"
import { useUserStore } from "@/stores/user"
import axios from 'axios'
export default {
  name: "SignInView",
  data: () => {
    return {
      appName: appName,
      userAuth: {},
    }
  },
  methods: {
    signin() {
      const store = useUserStore()
      store.registerUser(this.userAuth.email, this.userAuth.password)
      this.$router.push({ path: "/" });
    }
  }
}
</script>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
