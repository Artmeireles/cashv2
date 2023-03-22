<template>
  <div class="page-title">
    <b-row>
      <b-col :md="['/'].includes($route.path) ? 4 : 12">
        <h1><i v-if="icon" :class="icon"></i> {{ main }}</h1>
        <h2>{{ sub }}</h2>
      </b-col>
      <b-col
        v-if="userParams && userParams.id && ['/'].includes($route.path)"
        :md="(userParams.tipoUsuario == 1 || userParams.admin >= 1) ? '5' : '7'"
        :offset-md="(userParams.tipoUsuario == 1 || userParams.admin >= 1) ? '3' : '1'"
      >
        <b-form
          @submit.stop.prevent="loadCadastros"
          v-if="
            userParams &&
            userParams.id &&
            (userParams.admin >= 1 ||
              userParams.gestor >= 1 ||
              (userParams.tipoUsuario == 1 || userParams.admin >= 1))
          "
        >
          <UserParamsForm v-if="userParams && userParams.id" />
        </b-form>
      </b-col>
    </b-row>
    <hr />
  </div>
</template>

<script>
import { showError } from "@/global";
import { baseApiUrl } from "@/env";
import { capitalizeFirst } from "@/config/globalFacilities";
import UserParamsForm from "./UserParamsForm";
import { mapState } from "vuex";
import axios from "axios";
export default {
  name: "PageTitle",
  props: ["icon", "main", "sub"],
  components: { UserParamsForm },
  data: function () {
    return {
      userParams: {},
      dominios: [],
      keyword: "",
    };
  },
  methods: {
    getParam() {
      const param = {
        meta: "domainName",
        dominio: this.userParams.cliente,
        value: this.userParams.dominio,
        forceDominio: true,
        first: true,
      };
      const url = `${baseApiUrl}/params`;
      axios
        .post(url, param)
        .then((res) => {
          this.clientName =
            " - " +
            (res && res.data && res.data.data[0]
              ? res.data.data[0].label
              : "Nome do cliente");
        })
        .catch(showError);
      return this.clientName;
    },
    loadCadastros() {
      if (this.keyword) {
        if (!["0", "1"].includes(this.userParams.tipoUsuario.toString())) {
          this.$router.push({
            path: `/cadastros`,
            query: { key: this.keyword },
          });
          location.reload();
        } else if (this.userParams.tipoUsuario >= 1) {
          const url = `/servidor-panel/${this.keyword}`;
          this.$router.push({ path: url });
          location.reload();
        }
      }
    },
    getKeySearch() {
      if (this.$route.query.key) this.keyword = this.$route.query.key;
    },
    loadDominios(cliente) {
      const param = {
        dominio: cliente,
        meta: "domainName",
        forceDominio: true,
      };
      axios.post(`${baseApiUrl}/params`, param).then((res) => {
        this.dominios = res.data.data.map((data) => {
          return {
            value: data.value,
            text: capitalizeFirst(data.label.replace("_", " ")),
          };
        });
      });
    },
    loadUserParams() {
      const url = `${baseApiUrl}/users/${this.user.id}`;
      axios.get(url).then((res) => {
        this.userParams = res.data;
        this.loadDominios(this.userParams.cliente);
      });
    },
  },
  mounted() {
    this.getKeySearch();
    if (this.user.id) this.loadUserParams();
  },
  computed: mapState(["user"]),
};
</script>

<style>
.page-title h1 {
  margin: 0px;
  color: #3a1413d8;
}

.page-title h2 {
  color: #3a1413c2;
  margin-top: 5px;
  font-size: 1.3rem;
}

.search {
  max-width: 50%;
}
</style>
