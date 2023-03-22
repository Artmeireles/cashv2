<template>
  <div class="home">
    <PageTitle icon="" main="" sub="" v-if="uMsgStatusActive"/>
    <CadasPanels v-if="uMsgStatusActive && userParams.tipoUsuario == '0'" icon="fa fa-home" main="Dashboard" :sub="subTitle" />
    <div class="float-right" v-if="uMsgStatusActive && userParams.tipoUsuario >= '1' || userParams.admin >= '1'">
      <Stat :class="statsBrowser" v-if="stat.contratos.count >= 1" title="Consignados ativos"
        :value="stat.contratos.count" icon="fa fa-folder" color="#3bc480" />
      <Stat :class="statsBrowser" v-if="stat.contratos.nAverbs.length > 0"
        :title="`Consignados a averbar (${stat.contratos.nAverbs.length})`" v-b-tooltip.hover
        :items="stat.contratos.nAverbs.items" icon="fa fa-file-signature" color="#d54d50" />
    </div>
    <div v-if="userMsg">
      <b-alert show :variant="msg.msg_variant || 'success'" v-for="msg in userMsg" :key="msg.id">
        <h4 class="alert-heading" v-html="msg.titl"></h4>
        <span v-html="msg.info"></span>
      </b-alert>
    </div>
  </div>
</template>

<script>
import PageTitle from "../template/PageTitle";
import CadasPanels from "../painelConsignacoes/CadasPanels";
import Stat from "./Stat";
import { appName } from "@/global";
import { mapState } from "vuex";
import { baseApiUrl } from "@/env";
import axios from "axios";
import { isBrowser } from "mobile-device-detect";
import { showError } from '../../global'
import moment from 'moment'

export default {
  name: "Home",
  components: { PageTitle, CadasPanels, Stat },
  data: function () {
    return {
      userParams: {},
      userMsg: [],
      uMsgStatusActive: true,
      stat: {},
      statsBrowser: '',
      title: appName,
      subTitle: `Consignados e Pagamentos Online`,
    };
  },
  methods: {
    loadUserMsgS() {
      const url = `${baseApiUrl}/users/f-a/gss`;
      axios.get(url).then((res) => {
        this.uMsgStatusActive = res.data;
      })
        .catch(showError)
    },
    loadUserMsg() {
      const url = `${baseApiUrl}/users/f-a/gsm`;
      axios.get(url).then((res) => {
        this.userMsg = res.data;
        this.userMsg.forEach(element => {
          if (element.valid_from > moment().format()) {
            element.info = element.msg
            element.titl = element.title
          }
          else if (element.valid_from <= moment().format()) {
            element.info = element.msg_future
            element.titl = element.title_future
          }
        });
      })
        .catch(showError)
    },
    loadUserParams() {
      const url = `${baseApiUrl}/users/${this.user.id}`;
      axios.get(url).then((res) => {
        this.userParams = res.data;
      });
    },
    loadStats() {
      if (this.user && this.user.dominio && this.user.cliente) {
        const body = { _status: 10 };
        const url = `${baseApiUrl}/contratos/f-a/gcc`;
        axios.post(url, body).then((res) => {
          this.stat.contratos = res.data.data;
          this.stat.contratos.nAverbs.items = this.stat.contratos.nAverbs.map(
            (data) => {
              return {
                id: data.id_contrato,
                link: `/servidor-panel/${data.matricula}`,
                contrato: data.contrato,
              };
            }
          );
        });
      }
    },
    setStatsBrowserClass() {
      if (isBrowser) this.statsBrowser = "stats-desktop";
    },
  },
  mounted() {
    setTimeout(() => {
      this.loadUserParams();
      this.loadUserMsg()
      this.loadUserMsgS()
    }, 1000);
    this.loadStats();
    this.setStatsBrowserClass()
  },
  computed: mapState(["user"]),
};
</script>

<style>
.stats {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}

/* .stats-desktop {
  max-width: 25%;
} */
</style>
