<template>
  <div id="app">
    <vue-confirm-dialog></vue-confirm-dialog>
    <Header title="Cash" :hideUserDropdown="!user" id="header" />
    <Loading v-if="validatingToken" />
    <Content v-else />
    <Footer />
  </div>
</template>

<script>
import axios from "axios";
import { userKey } from "@/global";
import { baseApiUrl } from "@/env";
import { mapState } from "vuex";
import Header from "@/components/template/Header";
import Content from "@/components/template/Content";
import Footer from "@/components/template/Footer";
import Loading from "@/components/template/Loading";

export default {
  name: "App",
  components: { Header, Content, Footer, Loading },
  computed: mapState(["user"]),
  data: function () {
    return {
      validatingToken: true,
    };
  },
  methods: {
    async validateToken() {
      this.validatingToken = true;

      const json = localStorage.getItem(userKey);
      const userData = JSON.parse(json);
      this.$store.commit("setUser", null);

      // Declarar rotas alternativas criadas em router.js
      // As rotas alternativas dispensam validação de usuário
      const alternates = [
        "auth",
        "apresentacao",
        "validator",
        "request-password-reset",
        "password-reset",
      ];

      // rota primária
      if (!userData && this.$route.name === "user-unlock") {
        const res = await axios.get(
          `${baseApiUrl}/${this.$route.name}/${this.$route.params.id}/${this.$route.params.token}`
        );

        this.$toasted.global.defaultSuccess({ msg: res.data });
        this.$router.push({ name: alternates[0] });
      }

      if (!userData && alternates.indexOf(this.$route.name) < 0) {
        this.$cookies.set("noUserRoute", this.$route.fullPath);
        this.validatingToken = false;
        this.$router.push({ name: alternates[0] });
        return;
      } else {
        const res = await axios.post(`${baseApiUrl}/validateToken`, userData);

        if (res.data) {
          this.$store.commit("setUser", userData);
        } else {
          localStorage.removeItem(userKey);
          if (alternates.indexOf(this.$route.name) < 0)
            this.$router.push({ name: alternates[0] });
        }

        this.validatingToken = false;
      }
    },
  },
  created() {
    this.validateToken();
    this.$cookies.set("uLast", this.$route.fullPath);
  },
};
</script>

<style>
* {
  font-family: "Lato", sans-serif;
}

body {
  margin: 0;
}

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  height: 100vh;
  display: grid;
  grid-template-rows: 60px 1fr 40px;
  grid-template-columns: 300px 1fr;
  grid-template-areas:
    "header header"
    "content content"
    "footer footer";
}
</style>