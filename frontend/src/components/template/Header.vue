<template>
  <header id="header">
    <b-navbar toggleable="lg" class="navbar navbar-expand-md fixed-top header">
      <b-navbar-brand :to="`${userParams && userParams.id ? '/' : '/apresentacao'}`">
        <img :src="photoPath" alt="Cash - Consignados e Pagamentos Online" class="logoCash" />
      </b-navbar-brand>

      <b-navbar-toggle target="nav-collapse" v-if="userParams"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav v-if="userParams">
        <b-navbar-nav>
          <b-nav-item to="/cadastros" v-b-tooltip.hover title="Administrar cadastros"
            v-if="userParams.cad_servidores >= 1 && uMsgStatusActive">
            <i class="fas fa-user-edit"></i> Servidores
          </b-nav-item>

          <b-nav-item to="/relatorios" v-if="userParams.tipoUsuario >= 2 && uMsgStatusActive" v-b-tooltip.hover
            title="Relatórios e exportações">
            <i class="fas fa-print"></i> Relatórios
          </b-nav-item>

          <b-nav-item-dropdown ref="dropdown" v-if="userParams.id && uMsgStatusActive && (userParams.gestor >= 1 || userParams.tipoUsuario >= 1)"
            icon="arrow-up">
            <template slot="button-content">
              <i class="fas fa-cogs"></i> Diversos
            </template>
            <b-dropdown-item to="/admin-consignacoes" v-if="userParams.admin >= 1">
              <i class="fas fa-file-invoice-dollar"></i> Administrar consignados
            </b-dropdown-item>
            <b-dropdown-item to="/admin-contratos"
              v-if="userParams.admin >= 1 || (userParams.tipoUsuario >= 1 || userParams.gestor >= 1)">
              <i class="far fa-file-alt"></i> Administrar contratos
            </b-dropdown-item>
          </b-nav-item-dropdown>
        </b-navbar-nav>
        <b-navbar-nav class="ml-auto" v-if="userParams && !['/'].includes($route.path)">
          <UserParamsForm v-if="
            userParams.admin >= 1 ||
            userParams.gestor >= 1 ||
            (userParams.tipoUsuario == 1 || userParams.admin >= 1)
          " />
        </b-navbar-nav>
        <b-navbar-nav class="ml-auto user-dropdown">
          <b-nav-item @click="support" v-if="userParams.tipoUsuario >= 1" v-b-tooltip.hover title="Suporte">
            <i class="fa fa-whatsapp" aria-hidden="true"></i>
          </b-nav-item>
          <b-nav-item to="/apresentacao" v-if="!userParams.id">
            Apresentação
          </b-nav-item>
          <b-nav-item to="/auth" v-if="!(userParams.id || ['/auth'].includes($route.path))">
            Acessar
          </b-nav-item>
          <b-nav-item-dropdown ref="dropdown" right v-if="userParams.id">
            <template slot="button-content">
              <i class="far fa-user-circle"></i>
              {{ nameInitials(userParams.name) }}
            </template>
            <b-dropdown-item to="/admin" v-if="uMsgStatusActive"><i class="fa fa-cogs"></i>
              {{
              userParams.admin >= 1 ? "Administração" : "Perfil"
              }}</b-dropdown-item>
            <b-dropdown-item href @click.prevent="logout"><i class="fa fa-sign-out"></i> Sair</b-dropdown-item>
          </b-nav-item-dropdown>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
  </header>
</template>
 
<script>
import { userKey } from "@/global";
import { baseApiUrl } from "@/env";
import axios from "axios";
import UserParamsForm from "./UserParamsForm";
import { mapState } from "vuex";
import { showError } from "../../global";

export default {
  name: "Header",
  components: { UserParamsForm },
  data: function () {
    return {
      clientName: "",
      photoPath: "",
      userParams: {},
      uMsgStatusActive: true,
      admTitle: "Administração",
    };
  },
  props: {
    title: String,
  },
  methods: {
    support() {
      window.open(`https://api.whatsapp.com/send/?phone=5582981499024&text=Ol%C3%A1!%20${this.user.name}%20aqui!%20Preciso%20de%20seu%20suporte.%20Pode%20me%20ajudar?&type=phone_number&app_absent=0`);
    },
    loadUserMsgS() {
      const url = `${baseApiUrl}/users/f-a/gss`;
      axios.get(url).then((res) => {
        this.uMsgStatusActive = res.data;
      })
        .catch(showError)
    },
    nameInitials(name) {
      const names = name.split(" ");
      let ret = "";
      names.forEach((nameElement) => {
        ret += nameElement.substring(0, 1).toUpperCase();
      });
      return ret.substring(0, 2);
    },
    logout() {
      localStorage.removeItem(userKey);
      this.$store.commit("setUser", null);
      this.userParams = {};
      this.$router.push({ name: "auth" });
    },
    setAdmTitle() {
      this.admTitle = this.userParams.admin >= 1 ? "Administração" : "Perfil";
    },
  },
  watch: {
    user: function () {
      const url = `${baseApiUrl}/users/${this.user.id}`;
      axios.get(url).then((res) => {
        this.userParams = res.data;
        this.loadUserMsgS()
      });
    },
  },
  mounted() {
    this.photoPath = require(`@/assets/imgs/logo_cash-full-no-bg-maroom.png`);
    this.setAdmTitle();
  },
  computed: mapState(["user"]),
};
</script>

<style>
.logoCash {
  max-height: 35px;
}

.center-cropped img {
  object-fit: none;
  /* Do not scale the image */
  object-position: center;
  /* Center the image within the element */
  height: 350px;
  width: 350px;
}

.foundMark {
  background-color: yellow;
  padding: 0;
}

.header {
  grid-area: header;
  /* background: rgba(0, 0, 0, 0.2); */
  /* background: transparent; */
  background: linear-gradient(50deg, #b4b4b4, #d3d3d3, #b4b4b4);
  display: flex;
  justify-content: center;
  align-items: center;
}

.form-inline .search {
  min-width: 300px;
}

.title {
  font-size: 1.2rem;
  color: #3a1413;
  font-weight: 100;
  flex-grow: 1;
  text-align: center;
}

.title a {
  color: #3a1413;
  text-decoration: none;
}

.title a:hover {
  color: #3a1413;
  text-decoration: none;
}

header.header>a.toggle {
  width: 60px;
  height: 100%;
  color: #3a1413;
  justify-self: flex-start;
  text-decoration: none;
  display: flex;
  justify-content: center;
  align-items: center;
}

header.header>a.toggle:hover {
  color: #3a1413;
  background-color: rgba(0, 0, 0, 0.2);
}

.dropdown-menu li:hover .sub-menu {
  visibility: visible;
}

.dropdown:hover .dropdown-menu {
  display: block;
}

.col-actions2 {
  min-width: 90px;
}

.col-actions3 {
  min-width: 130px;
}

.col-value {
  min-width: 120px;
  text-align: right;
}

.valor-field-right {
  text-align: right;
}

.valor-field-center {
  text-align: center;
}

/* algumas sobrescritas para sistema de grids do bootstrap */
.col-1,
.col-2,
.col-3,
.col-4,
.col-5,
.col-6,
.col-7,
.col-8,
.col-9,
.col-10,
.col-11,
.col-12,
.col,
.col-auto,
.col-sm-1,
.col-sm-2,
.col-sm-3,
.col-sm-4,
.col-sm-5,
.col-sm-6,
.col-sm-7,
.col-sm-8,
.col-sm-9,
.col-sm-10,
.col-sm-11,
.col-sm-12,
.col-sm,
.col-sm-auto,
.col-md-1,
.col-md-2,
.col-md-3,
.col-md-4,
.col-md-5,
.col-md-6,
.col-md-7,
.col-md-8,
.col-md-9,
.col-md-10,
.col-md-11,
.col-md-12,
.col-md,
.col-md-auto,
.col-lg-1,
.col-lg-2,
.col-lg-3,
.col-lg-4,
.col-lg-5,
.col-lg-6,
.col-lg-7,
.col-lg-8,
.col-lg-9,
.col-lg-10,
.col-lg-11,
.col-lg-12,
.col-lg,
.col-lg-auto,
.col-xl-1,
.col-xl-2,
.col-xl-3,
.col-xl-4,
.col-xl-5,
.col-xl-6,
.col-xl-7,
.col-xl-8,
.col-xl-9,
.col-xl-10,
.col-xl-11,
.col-xl-12,
.col-xl,
.col-xl-auto {
  padding-right: 8px;
  padding-left: 8px;
}

.modal-body {
  padding: 1.5rem;
}

.invis {
  color: white;
}

.invis .no-bottom-margim {
  margin-bottom: 0.1rem;
}
</style>
