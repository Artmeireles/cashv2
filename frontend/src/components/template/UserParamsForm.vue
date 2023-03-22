<template>
  <div id="user-params-form">
    <b-form @submit.stop.prevent="loadCadastros" inline class="float-right">
      <b-input-group>
        <b-form-input
          aria-label="Input"
          :class="`input-group-${
            userParams &&
            userParams.tipoUsuario &&
            userParams.tipoUsuario.toString() == '2'
              ? '20'
              : '50'
          }`"
          v-model="keyword"
          placeholder="Pesquise..."
          :title="`Pesquise inserindo ${
            userParams &&
            userParams.tipoUsuario &&
            !['0', '1'].includes(userParams.tipoUsuario.toString())
              ? 'parte do nome, '
              : ''
          }o CPF ou a MATRÍCULA de um servidor`"
          v-b-tooltip.hover
        ></b-form-input>
        <b-button
          type="submit"
          :title="`Pesquise inserindo ${
            userParams &&
            userParams.tipoUsuario &&
            !['0', '1'].includes(userParams.tipoUsuario.toString())
              ? 'parte do nome, '
              : ''
          }o CPF ou a MATRÍCULA de um servidor`"
          v-b-tooltip.hover
          ><i class="fab fa-searchengin"></i
        ></b-button>
        <b-form-select
          :class="`input-group-flex-${
            userParams &&
            userParams.tipoUsuario &&
            userParams.tipoUsuario.toString() == '2'
              ? '25'
              : '40'
          }`"
          id="header-user-dominio"
          :options="dominios"
          @change="save"
          v-model="userParams.domainCli"
          v-if="userParams.multiCliente > 0 && dominios.length > 1"
        />
        <b-form-select
          class="input-group-flex-15"
          id="header-user-f_ano"
          :options="optionYears"
          @change="save"
          v-model="userParams.f_ano"
          v-if="userParams.tipoUsuario >= 1 && optionYears.length > 1"
        />
        <b-form-select
          class="input-group-flex-10"
          id="header-user-f_mes"
          :options="optionMonths"
          @change="save"
          v-model="userParams.f_mes"
          v-if="userParams.tipoUsuario >= 1 && optionMonths.length > 1"
        />
        <span
          v-else-if="userParams.tipoUsuario >= 2"
          class="form-control singlePayroll input-group-flex-10"
          >{{ userParams.f_mes }}</span
        >
        <b-form-select
          class="input-group-flex-10"
          id="header-user-f_complementar"
          :options="optionComplementaries"
          @change="save"
          v-model="userParams.f_complementar"
          v-if="userParams.tipoUsuario >= 2 && optionComplementaries.length > 1"
        />
        <span
          v-else-if="userParams.tipoUsuario >= 2"
          class="form-control singlePayroll input-group-flex-10"
          >{{ userParams.f_complementar }}</span
        >
      </b-input-group>
    </b-form>
  </div>
</template>
 
<script>
import { showError } from "@/global";
import { baseApiUrl } from "@/env";
import { capitalizeFirst } from "@/config/globalFacilities";
import axios from "axios";
import { mapState } from "vuex";

export default {
  name: "UserParamsForm",
  components: {},
  data: function () {
    return {
      clientes: [],
      dominios: [],
      optionYears: [],
      optionMonths: [],
      optionComplementaries: [],
      clientName: "",
      userParams: {},
      keyword: "",
    };
  },
  props: {
    title: String,
  },
  methods: {
    loadCadastros() {
      if (this.keyword) {
        if (
          this.userParams &&
          this.userParams.tipoUsuario &&
          !["0", "1"].includes(this.userParams.tipoUsuario.toString())
        ) {
          this.$router.push({
            path: `/cadastros`,
            query: { key: this.keyword },
          });
        } else if (this.userParams.tipoUsuario >= 1) {
          const url = `/servidor-panel/${this.keyword}`;
          this.$router.push({ path: url });
        }
        location.reload();
      }
    },
    getKeySearch() {
      if (this.$route.query.key) this.keyword = this.$route.query.key;
    },
    loadClientes() {
      if (this.userParams.multiCliente > 1) {
        const param = {
          dominio: "root",
          meta: "clientName",
          forceDominio: true,
          order: "value",
        };
        axios.post(`${baseApiUrl}/params`, param).then((res) => {
          res.data.data.forEach((element) => {
            this.loadDominios(element.value);
          });
        });
      } else {
        this.loadDominios(this.userParams.cliente);
      }
    },
    loadDominios(cliente) {
      const param = {
        dominio: cliente,
        meta: "domainName",
        forceDominio: true,
      };
      axios.post(`${baseApiUrl}/params`, param).then((res) => {
        res.data.data.map((data) => {
          this.dominios.push({
            value: `${data.dominio}_${data.value}`,
            text: capitalizeFirst(data.label.replace("_", " ")),
          });
        });
      });
    },
    getYearParams() {
      this.optionYears = [];
      const url = `${baseApiUrl}/fin-params/f/ano`;
      axios.get(url).then((res) => {
        this.optionYears = res.data.data.map((data) => {
          return { value: data.field, text: data.field };
        });
      });
    },
    getMonthParams() {
      this.optionMonths = [];
      const url = `${baseApiUrl}/fin-params/f/mes`;
      axios.get(url).then((res) => {
        this.optionMonths = res.data.data.map((data) => {
          return { value: data.field, text: data.field };
        });
      });
    },
    getComplementaryParams() {
      this.optionComplementaries = [];
      const url = `${baseApiUrl}/fin-params/f/complementar`;
      axios.get(url).then((res) => {
        this.optionComplementaries = res.data.data.map((data) => {
          return { value: data.field, text: data.field };
        });
      });
    },
    save() {
      this.$cookies.set("userRoute", this.$route.fullPath);
      const url = `${baseApiUrl}/users/${this.userParams.id}`;
      const userTo = {
        cliente: this.userParams.domainCli.split("_")[0],
        dominio: this.userParams.domainCli.split("_")[1],
        email: this.userParams.email,
        cpf: this.userParams.cpf,
        name: this.userParams.name,
        telefone: this.userParams.telefone,
        f_ano: this.userParams.f_ano,
        f_mes: this.userParams.f_mes,
        f_complementar: this.userParams.f_complementar,
      };
      axios
        .put(url, userTo)
        .then(() => {
          this.$toasted.global.defaultSuccess({
            msg: "Parâmetro alterado com sucesso",
          });
          location.reload();
        })
        .catch((err) => {
          showError(err);
        });
    },
    loadUserParams() {
      const url = `${baseApiUrl}/users/${this.user.id}`;
      axios.get(url).then((res) => {
        this.userParams = res.data;
        this.userParams.domainCli = `${this.userParams.cliente}_${this.userParams.dominio}`;
        this.loadClientes();
        this.getYearParams();
        this.getMonthParams();
        this.getComplementaryParams();
      });
    },
  },
  watch: {
    user: function () {
      this.loadUserParams();
    },
  },
  mounted() {
    this.loadUserParams();
    this.getKeySearch();
  },
  computed: mapState(["user"]),
};
</script>

<style scoped>
.singlePayroll {
  background-color: #fff;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem 0.25rem 0.5rem;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  color: #495057;
  width: auto;
  vertical-align: middle;
}
.input-group .input-group-25 {
  width: 25%;
}
.input-group .input-group-30 {
  width: 30%;
}
.input-group .input-group-40 {
  width: 40%;
}
.input-group .input-group-60 {
  width: 60%;
}
.input-group .input-group-70 {
  width: 70%;
}
.input-group .input-group-80 {
  width: 80%;
}
.input-group > .input-group-flex-10 {
  flex: 0 0 10%;
}
.input-group > .input-group-flex-15 {
  flex: 0 0 15%;
}
.input-group > .input-group-flex-20 {
  flex: 0 0 20%;
}
.input-group > .input-group-flex-25 {
  flex: 0 0 25%;
}
.input-group > .input-group-flex-30 {
  flex: 0 0 30%;
}
.input-group > .input-group-flex-40 {
  flex: 0 0 40%;
}
</style>
