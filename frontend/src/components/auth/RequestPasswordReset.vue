<template>
  <div class="auth-content">
    <div class="auth-modal">
      <img src="@/assets/logo.png" width="200" alt="Logo" />
      <hr />
      <div class="auth-title">Recuperar a senha</div>

      <input v-model="userReq.cpf" v-on:keyup.enter="requestReset" name="cpf" type="text"
        placeholder="Digite seu CPF" />

      <button @click="requestReset">Recuperar</button>

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

export default {
  name: "RequestPasswordReset",
  data: function () {
    return {
      userReq: {},
    };
  },
  methods: {
    signin() {
      this.$router.push({ path: "/auth" });
    },
    requestReset() {
      axios
        .post(`${baseApiUrl}/request-password-reset`, this.userReq)
        .then((data) => {
          this.$toasted.global.defaultSuccess({ msg: "Por razões de segurança, sua conta foi temporariamente suspensa" });
          this.$toasted.global.defaultSuccess({ msg: data.data.msg });
          setTimeout(() => {
            this.$router.push(`/password-reset/${data.data.token}`)
            // this.signin();
          }, 2000);
        })
        .catch(showError);
    },
  },
  mounted() {
  },
};
</script>

<style scoped>
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
