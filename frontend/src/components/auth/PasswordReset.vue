<template>
  <div class="auth-content">
    <div class="auth-modal">
      <img src="@/assets/logo.png" width="200" alt="Logo" />
      <hr />
      <div class="auth-title">Olá, {{ userFind.name }} &#128515;</div>
      <p class="instructions">Preencha e confirme abaixo sua nova senha</p>

      <input v-model="userRes.sms_token" name="token" type="text" placeholder="Token" ref="token" autocomplete="off" />
      <input v-model="userRes.password" name="password" type="password" placeholder="Senha" autocomplete="new-password" />
      <input v-model="userRes.confirmPassword" type="password" placeholder="Confirme a Senha" autocomplete="new-password" />

      <button @click="reset">Resetar</button>

      <a href @click.prevent="signin">
        <span>Voltar para a página principal!</span>
      </a>
    </div>
  </div>
</template>

<script>
import { showError } from "@/global";
import { baseApiUrl } from "@/env";
import axios from "axios";
import { mapState } from "vuex";

export default {
  name: "PasswordReset",
  data: function () {
    return {
      userRes: {},
      userFind: {},
    };
  },
  methods: {
    signin() {
      this.$router.push({ path: "/auth" });
    },
    reset() {
      axios
        .put(
          `${baseApiUrl}/password-reset/${this.$route.params.token}`,
          this.userRes
        )
        .then(() => {
          this.$toasted.global.defaultSuccess({
            msg: "Troca da senha realizada com sucesso",
          });
          setTimeout(() => {
            if (!this.user) this.$router.push({ path: "/auth" });
            else this.$router.push({ path: "/" });
          }, 2000);
        })
        .catch(showError);
    },
    loadUser() {
      axios
        .get(`${baseApiUrl}/user-token/${this.$route.params.token}`)
        .then((res) => {
          this.userFind = res.data;
        })
        .catch(() => {
          this.$toasted.global.defaultError({ msg: "Token não localizado" });
        });
    },
  },
  mounted() {
    this.loadUser();
    this.$refs.token.focus()
  },
  computed: mapState(["user"]),
};
</script>

<style scoped>
.instructions {
  text-align: center;
}

.auth-content {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.auth-modal {
  background-color: #fff;
  width: 350px;
  padding: 35px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.15);

  display: flex;
  flex-direction: column;
  align-items: center;
}

.auth-title {
  font-size: 1.2rem;
  font-weight: 100;
  margin-top: 10px;
  margin-bottom: 15px;
}

.auth-modal input {
  border: 1px solid #bbb;
  border-radius: 5px;
  width: 100%;
  margin-bottom: 15px;
  padding: 3px 8px;
  outline: none;
}

.auth-modal a {
  margin-top: 10px;
}

.auth-modal button {
  align-self: flex-end;
  background-color: #2460ae;
  color: #fff;
  padding: 5px 15px;
}

.auth-modal hr {
  border: 0;
  width: 100%;
  height: 1px;
  background-image: linear-gradient(to right,
      rgba(120, 120, 120, 0),
      rgba(120, 120, 120, 0.75),
      rgba(120, 120, 120, 0));
}
</style>
