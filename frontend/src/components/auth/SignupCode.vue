<template>
  <div class="auth-content">
    <b-overlay :show="loading" rounded="sm">
      <!-- <Loading v-if="loading" /> -->
      <div class="auth-modal">
        <img src="@/assets/logo.png" width="200" alt="Logo" />
        <hr />
        <div class="auth-title">{{ showSignup ? "Cadastro" : "Login" }}</div>
        <div class="saudation" v-if="userAuth.name">
          <p v-html="saudation"></p>
          <p v-html="saudation2"></p>
        </div>
        <the-mask v-if="showSignup" id="userAuth-cpf" :class="`form-control ${!cpfValid ? 'is-invalid' : cpfValid ? 'is-valid' : ''
        }`" type="text" v-model="userAuth.cpf" :mask="['###########']" @input="getUserByCpf"
          placeholder="Informe o CPF do usuário" />
        <input v-if="showSignup" ref="inputName" v-model="userAuth.name"
          v-on:keyup.enter="$event.target.nextElementSibling.focus()" type="text" placeholder="Nome"
          class="form-control" />
        <input v-if="!userAuth.id || showSignup" v-model="userAuth.email" ref="inputEmail"
          v-on:keyup.enter="$event.target.nextElementSibling.focus()" name="email" type="text" :placeholder="`Informe e-mail${showSignup ? ' de usuário' : ' ou CPF de SERVIDOR'
          }`" />
        <the-mask v-if="showSignup" id="userAuth-telefone" class="form-control" type="text" v-model="userAuth.telefone"
          :mask="['(##) #########']" placeholder="Informe o Telefone do usuário" />
        <input v-if="userAuth.id || showSignup" v-model="userAuth.password" ref="inputPass" class="form-control"
          name="password" type="password" placeholder="Senha" v-on:keyup.enter="
            showSignup ? $event.target.nextElementSibling.focus() : signin()
          " />
        <input v-if="showSignup" v-model="userAuth.confirmPassword" type="password" class="form-control"
          placeholder="Confirme a Senha" v-on:keyup.enter="showSignup ? signup() : signin()" />
        <button v-if="showSignup" @click="signup" :disabled="!cpfValid">
          Registrar
        </button>
        <button v-else @click="signin">Entrar</button>
        <a href @click.prevent="setShowSignUp">
          <span v-if="showSignup">Já tem cadastro? Acesse o Login!</span>
          <span v-else>Não tem cadastro? Registre-se aqui!</span>
        </a>
        <a href @click.prevent="requestReset">
          <span>Perdeu sua senha?</span>
        </a>
        <a href @click.prevent="restart" v-if="userAuth.id">
          <span>Recomeçar</span>
        </a>
      </div>
      <template #overlay>
        <div class="text-center">
          <Loading />
        </div>
      </template>
    </b-overlay>
  </div>
</template>

<script>
import { userKey, showError } from "@/global";
import { baseApiUrl } from "@/env";
import { titleCase } from "@/config/globalFacilities";
import axios from "axios";
import { TheMask } from "vue-the-mask";
import { cpf } from "cpf-cnpj-validator";
import { mapState } from "vuex";
import Loading from "@/components/template/Loading";

export default {
  name: "Auth",
  components: { TheMask, Loading },
  data: function () {
    return {
      showSignup: false,
      userAuth: {},
      saudation: "",
      saudation2: "",
      cpfValid: false,
      emailValid: false,
      loading: false,
    };
  },
  methods: {
    validatePhone(phone) {
      const regex = /^\(?([0-9]{2})\)?[-. ]?([0-9]{5})[-. ]?([0-9]{4})$/;
      const res = regex.test(phone)
      return res
    },
    isUser() {
      if (this.user) this.$router.push({ path: "/" });
    },
    setShowSignUp() {
      this.userAuth = {};
      this.showSignup = !this.showSignup;
    },
    reSendSignupToken(user) {
      this.loading = true;
      axios
        .post(`${baseApiUrl}/user-resend-unlock`, user)
        .then((res) => {
          this.$toasted.global.defaultSuccess({ msg: res.data });
          this.loading = false;
        })
        .catch(showError);
    },
    signin() {
      axios
        .post(`${baseApiUrl}/signin`, this.userAuth)
        .then((res) => {
          if (res.data.user && res.data.user.status == 0) {
            this.$confirm({
              message: `${res.data.msg} Gostaria de receber novamente instruções de liberação`,
              button: { no: "Não", yes: "Confirmo" },
              callback: (confirm) => {
                if (confirm) {
                  this.$confirm({
                    message: `Escolha abaixo uma opção para liberar seu acesso`,
                    button: { no: "Código via SMS", yes: "Link no e-mail" },
                    callback: (confirm) => {
                      if (confirm) {
                        this.reSendSignupToken(res.data.user);
                      } else {
                        showError(res.data.msg);
                        return;
                      }
                    },
                  })
                } else {
                  showError(res.data.msg);
                  return;
                }
              },
            });
          } else if (
            (res.data.idCadas || (res.data.id && res.data.name)) &&
            !this.userAuth.password
          ) {
            this.userAuth = res.data;
            this.userAuth.name = titleCase(this.userAuth.name);
            if (this.userAuth.cpf) {
              this.setValidCpf();
              this.showSignup = !res.data.id;
            }
            this.getSaudation();
          } else {
            this.$store.commit("setUser", res.data);
            localStorage.setItem(userKey, JSON.stringify(res.data));
            const noUserRoute = this.$cookies.get("noUserRoute");
            this.$cookies.remove("noUserRoute");
            this.$router.push({ path: noUserRoute ? noUserRoute : "/" });
          }
        })
        .catch(showError);
    },
    signup() {
      delete this.userAuth.id;
      if (!this.userAuth.telefone) { showError("Necessário informar o celular"); return }
      if (!this.validatePhone(this.userAuth.telefone)) { showError("Número celular inválido"); return }
      if (!this.userAuth.password) { showError("Necessário informar a senha"); return }
      if (!this.userAuth.confirmPassword) { showError("Necessário informar a confirmação da senha"); return }
      if (this.userAuth.password != this.userAuth.confirmPassword) { showError("Senha e confirmação precisam ser iguais"); return }
      axios
        .post(`${baseApiUrl}/signup`, this.userAuth)
        .then(() => {
          this.$toasted.global.defaultSuccess({
            msg: "Por favor verifique seu email<br>para concluir o registro",
          });
          this.userAuth = {};
          this.showSignup = false;
        })
        .catch(showError);
    },
    requestReset() {
      this.$router.push({ path: "request-password-reset" });
    },
    restartSignin() {
      this.userAuth = {};
    },
    setValidCpf() {
      if (this.userAuth.cpf.length == 11) {
        // valida o CPF
        this.cpfValid = cpf.isValid(this.userAuth.cpf);
      } else this.cpfValid = false;
    },
    getUserByCpf() {
      this.setValidCpf();
      if (this.cpfValid && this.showSignup) {
        this.userAuth = { email: this.userAuth.cpf };
        this.signin();
        if (!this.userAuth.idCadas)
          this.userAuth = { cpf: this.userAuth.email };
      } else {
        this.userAuth = { cpf: this.userAuth.cpf };
      }
    },
    restart() {
      this.userAuth = {};
      this.showSignup = false;
    },
    getSaudation() {
      this.saudation = `Olá <b class='marked'>${this.userAuth.name}</b>`;
      switch (this.userAuth.status) {
        case 0:
          this.saudation2 = `<p>Estávamos te aguardando &#128512</p>Se você trabalha para <b class='marked'>${titleCase(
            this.userAuth.clientName
          )}</b> então por favor prossiga com seu cadastro`;
          break;
        case 99:
          this.saudation2 = `Seu usuário está bloqueado. Por favor solicite suporte`;
          break;
        default:
          this.saudation2 = `Seja bem vindo de volta`;
          break;
      }
    },
  },
  mounted() {
    this.isUser();
  },
  computed: mapState(["user"]),
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

.saudation {
  /* margin-top: 10px;
  margin-bottom: 15px; */
  text-align: center;
}

.marked {
  background-color: yellow;
}

.auth-modal input {
  border: 1px solid #bbb;
  width: 100%;
  margin-bottom: 15px;
  padding: 3px 8px;
  outline: none;
}

.auth-modal button {
  align-self: flex-end;
  background-color: #2460ae;
  color: #fff;
  padding: 5px 15px;
}

/* .auth-modal a {
  margin-top: 35px;
} */

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
