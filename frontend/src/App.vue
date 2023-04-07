<template>
  <header>
    <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld :msg="msg" />

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <RouterLink to="#" v-if="!this.userStore.id" @click.native="showSignin">SignIn</RouterLink>
        <RouterLink to="#" @click.native="logout" v-else>SignOut</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
  <Toast />
  <DynamicDialog />
</template>

<script>
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import { useUserStore } from "@/stores/user"
import { mapState } from 'pinia'
import { userKey } from "@/global"
import SignInView from './views/SignInView.vue'
export default {
  name: "App",
  components: { HelloWorld, RouterLink, RouterView },
  data: function () {
    return {
      msg: 'You did it!',
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
    showSignin() {
      this.$dialog.open(SignInView);
    },
  },
  computed: {
    ...mapState(useUserStore, ['userStore']),
  },
  watch: {
    userStore() {
      if (this.userStore.name) this.msg = `You did it ${this.userStore.name.split(' ')[0]}!`
      else this.msg = 'You did it!'
    }
  },
  created() {
    this.validateToken();
  }
}
</script>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
