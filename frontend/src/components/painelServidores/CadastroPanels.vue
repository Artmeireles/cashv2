<template>
  <div class="cadas-panel">
    <PageTitle
      v-if="!userParams.tipoUsuario == 0"
      icon="fa fa-cogs"
      main="Administração do cadastro"
    />
    <div class="cadas-panel-tabs">
      <div class="client-presentation" v-if="cadastro && cadastro.id"></div>
      <Loading v-if="count < 0" />
      <b-card
        no-body
        id="cadas-panel"
        v-else-if="count == 1 && cadastro && cadastro.id"
      >
        <h2>
          Servidor:
          {{ `${cadastro.nome} (${cadastro.matricula})` }}
          {{ userParams.admin >= 1 ? ` (${cadastro.id})` : "" }}
        </h2>
        <b-tabs card :pills="isBrowser" :vertical="isBrowser">
          <b-tab title="Dados">
            <Cadastro
              ref="Cadastro"
              :cadastroGrid="cadastro"
              :userParams="userParams"
            />
          </b-tab>
          <b-tab title="Funcional">
            <Funcional
              ref="Funcional"
              :cadastroGrid="cadastro"
              :userParams="userParams"
            />
          </b-tab>
          <b-tab title="Financeiro">
            <Financeiro
              ref="Financeiro"
              :cadastroGrid="cadastro"
              :userParams="userParams"
              @click="clickFinanceiro"
            />
          </b-tab>
          <b-tab title="Movimentação">
            <Movimentacao
              ref="Movimentacao"
              :cadastroGrid="cadastro"
              :userParams="userParams"
            />
          </b-tab>
          <b-tab title="Dependentes">
            <Dependentes
              ref="Dependentes"
              :cadastroGrid="cadastro"
              :userParams="userParams"
            />
          </b-tab>
          <b-tab title="Pensões" disabled>
            <!-- <Pensoes              
              ref="Documentos"
              :cadastroGrid="cadastro"
              :userParams="userParams"
            /> -->
          </b-tab>
          <b-tab title="Documentos" disabled>
            <!-- <Documentos
              disabled
              ref="Documentos"
              :cadastroGrid="cadastro"
              :userParams="userParams"
            /> -->
          </b-tab>
          <b-tab lazy title="Consignados" @click="clickCadasContratos">
            <CadasContratos
              ref="CadasContratos"
              :userParams="userParams"
              :cadastros="cadastro"
              :financeiro="financeiro"
            />
          </b-tab>
          <b-tab lazy title="Histórico de descontos" @click="clickConsignHist">
            <ConsignHist
              ref="ConsignHist"
              :userParams="userParams"
              :cadastros="cadastro"
            />
          </b-tab>
          <b-tab
            title="Impressões e Recadastro"
            @click="clickConsignHist"
            v-if="userParams.tipoUsuario == 2"
          >
            <Printings
              ref="Printings"
              :userParams="userParams"
              :cadastros="cadastro"
              :getFull="false"
            />
          </b-tab>
        </b-tabs>
      </b-card>
      <b-row v-else>
        <b-col offset-xl="3" xl="6" offset-lg="2" lg="8" offset-md="1" md="10">
          <b-card title="Registro não localizado">
            <p>
              Não foi localizado um registro com o dado informado para pesquisa
            </p>
            <p>
              <strong>Dado pesquisado:</strong>
              {{
                this.$route.params && this.$route.params.id
                  ? "" + this.$route.params.id
                  : " inválido ou não informado."
              }}
            </p>
            <p>Por favor, verifique e tente novamente.</p>
          </b-card>
        </b-col>
      </b-row>
    </div>
  </div>
</template>

<script>
import { baseApiUrl } from "@/env";
import { titleCase } from "@/config/globalFacilities";
import axios from "axios";
import { mapState } from "vuex";
import Cadastro from "./Cadastro";
import Funcional from "./Funcional";
import Financeiro from "./Financeiro";
import Movimentacao from "./Movimentacao";
import Dependentes from "./Dependentes";
import Printings from "./Printings";
import CadasContratos from "../painelConsignacoes/CadasContratos";
import ConsignHist from "../painelConsignacoes/ConsignHist";
import PageTitle from "../template/PageTitle";
import { showError } from "@/global";
import Loading from "@/components/template/Loading";
import { isBrowser } from "mobile-device-detect";

export default {
  name: "CadasPanel",
  components: {
    Cadastro,
    Funcional,
    Financeiro,
    Movimentacao,
    Dependentes,
    CadasContratos,
    ConsignHist,
    PageTitle,
    Printings,
    Loading,
  },
  data: function () {
    return {
      userParams: {},
      loading: false,
      cadastro: undefined,
      count: -1,
      isBrowser: isBrowser,
      financeiro: {},
      getFull: false,
    };
  },
  methods: {
    loadCadastro() {
      this.loading = !this.loading;
      const url = `${baseApiUrl}/cadastros/${this.$route.params.cpf}/${this.$route.params.matricula}`;
      axios
        .get(url)
        .then((res) => {
          this.count = 1;
          if (res.data.data) {
            this.cadastro = res.data.data;
            this.cadastro.nome = titleCase(this.cadastro.nome);
            this.cadastro.matricula = this.cadastro.matricula
              .toString()
              .padStart(8, "0");
          }
          this.loading = !this.loading;
        })
        .catch((err) => {
          this.count = 0;
          showError(err);
        });
    },
    // clickCadastro: function () {
    //   this.loadCadastro();
    //   if (this.cadastro.id) this.$refs.Cadastro.loadCadastro();
    // },
    clickCadasContratos: function () {
      if (this.$refs.CadasContratos) this.$refs.CadasContratos.getRefresh();
    },
    clickConsignHist: function () {
      if (this.$refs.ConsignHist) this.$refs.ConsignHist.getRefresh();
    },
    clickFinanceiro: function () {
      if (this.cadastro.id) this.$refs.Financeiro.loadFinanceiro();
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
    this.loadCadastro();
  },
  computed: mapState(["user"]),
};
</script>

<style scoped>
.client-presentation {
  padding: 3px;
}
</style>