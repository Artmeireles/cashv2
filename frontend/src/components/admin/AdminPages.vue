<template>
  <div class="admin-pages">
    <PageTitle
      icon="fa fa-cogs"
      main="Administração do Sistema"
      sub="Usuários, Eventos do sistema & Cia"
    />
    <div class="admin-pages-tabs">
      <b-card no-body>
        <b-tabs card>
          <b-tab :title="usersTitle" @click="clickUserAdmin">
            <UserAdmin ref="UserAdmin" />
          </b-tab>
          <b-tab
            title="Eventos"
            @click="clickSisEventsAdmin"
            v-if="this.userParams.gestor"
          >
            <SisEventsAdmin ref="SisEventsAdmin" />
          </b-tab>
        </b-tabs>
      </b-card>
    </div>
  </div>
</template>

<script>
import PageTitle from "../template/PageTitle";
import UserAdmin from "./UserAdmin";
import SisEventsAdmin from "./SisEventsAdmin";
import { mapState } from "vuex";
import axios from "axios";
import { baseApiUrl } from "@/env";

export default {
  name: "AdminPages",
  components: { PageTitle, UserAdmin, SisEventsAdmin },
  data: function () {
    return {
      userParams: {},
      usersTitle: "Usuários",
    };
  },
  methods: {
    clickUserAdmin: function () {
      this.$refs.UserAdmin.reset();
    },
    clickSisEventsAdmin: function () {
      this.$refs.SisEventsAdmin.loadSisEvents();
    },
    setUsersTitle() {

      this.usersTitle = this.userParams.admin > 0 ? "Usuários" : "Perfil";
    },
    loadUserParams() {
      const url = `${baseApiUrl}/users/${this.user.id}`;
      axios.get(url).then((res) => {
        this.userParams = res.data;
      });
    },  
  },
  mounted() {
    this.loadUserParams();
    this.setUsersTitle();
  },
  computed: mapState(["user"]),
};
</script>

<style>
</style>
