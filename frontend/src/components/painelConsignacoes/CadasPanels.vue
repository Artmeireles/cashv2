<template>
  <div class="cadas-panel">
    <PageTitle v-if="!userParams.tipoUsuario == 0" icon="fa fa-cogs" main="Administração dos cadastros"
      sub="Dados, Contratos & Cia" />
    <div class="cadas-panel-tabs">
      <Loading v-if="count < 0" />
      <b-card no-body id="cadas-panel" v-else-if="count > 0 && cadastro && cadastro.id">
        <b-tabs card>
          <b-tab title="Dados" @click="clickCadasDados">
            <CadasDados ref="CadasDados" :userParams="userParams" :cadastros="cadastro" :financeiro="financeiro"
              @click="clickCadasDados" />
          </b-tab>
          <b-tab v-if="[1, 4, 5, 6, 9].includes(Number(cadastro.id_vinculo))" title="Contratos"
            @click="clickCadasContratos" lazy>
            <CadasContratos ref="CadasContratos" :userParams="userParams" :cadastros="cadastro" :financeiro="financeiro"
              @somaContratos="setSomaContratos" />
          </b-tab>
          <!-- <b-tab
            v-if="[1, 4, 5, 6, 9].includes(Number(cadastro.id_vinculo)) && (userParams.tipoUsuario == 0 || userParams.tipoUsuario == 2)"
            lazy title="Histórico de descontos" @click="clickConsignHist">
            <ConsignHist ref="ConsignHist" :userParams="userParams" :cadastros="cadastro" />
          </b-tab> -->
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
import CadasDados from "./CadasDados";
import CadasContratos from "./CadasContratos";
// import ConsignHist from "./ConsignHist";
import StringMask from "string-mask";
import PageTitle from "../template/PageTitle";
import { showError } from "@/global";
import { cpf } from "cpf-cnpj-validator";
import Loading from "@/components/template/Loading";

export default {
  name: "CadasPanel",
  components: { CadasDados, CadasContratos,/* ConsignHist,*/ PageTitle, Loading },
  data: function () {
    return {
      userParams: {},
      loading: false,
      cadastro: {
        id: "",
        cpfMasked: "00*.***.**0-00",
      },
      cpfKey: undefined,
      keySearch: undefined,
      count: -1,
      financeiro: {},
    };
  },
  methods: {
    loadCadastro() {
      this.loading = !this.loading;
      const url = `${baseApiUrl}/cadastrosByKeySearch?key=${this.keySearch}`;
      axios.get(url).then((res) => {
        this.count = res.data.count;
        if (res.data.data) {
          this.cadastro = res.data.data;
          this.cadastro.nome = titleCase(this.cadastro.nome);
          const cpf = this.cadastro.cpf;
          var formatter = new StringMask("##*.***.**#-##");
          this.cadastro.cpfMasked = formatter.apply(
            `${cpf.substring(0, 2)}${cpf.substring(8)}`
          );
          this.cadastro.matricula = this.cadastro.matricula
            .toString()
            .padStart(8, "0");
          this.getMargem(this.cadastro);
          this.financeiro.maxFolha = {
            ano: this.cadastro.ano,
            mes: this.cadastro.mes,
            complementar: this.cadastro.complementar,
          };
        }
        this.loading = !this.loading;
      });
    },
    getMargem(cadastro) {
      this.loading = !this.loading;
      const body = { id_cad_servidores: cadastro.id };
      const url = `${baseApiUrl}/contratos/f-a/gmc`;
      axios.post(url, body).then((res) => {
        this.financeiro.limiteMargem = res.data.data;
        this.loading = !this.loading;
      });
    },
    clickCadasDados: function () {
      this.loadCadastro();
      if (this.cadastro.id) this.$refs.CadasDados.loadCadastro();
    },
    // clickConsignHist: function () {
    //   this.$refs.ConsignHist.getRefresh();
    // },
    clickCadasContratos: function () {
      if (this.$refs.CadasContratos) this.$refs.CadasContratos.getRefresh();
    },
    setSomaContratos(valor) {
      this.loadCadastro();

      this.$refs.CadasDados.financeiro.somaContratos = valor;
    },
    getKeySearch() {
      if (this.user.tipoUsuario == 0 && this.user.cpf) {
        this.keySearch = this.user.cpf;
      } else if (this.$route.params.id) {
        this.keySearch = this.$route.params.id;
      } else {
        if (
          this.cpfKey &&
          this.cpfKey.length == 11 &&
          !cpf.isValid(this.cpfKey.replace(/([^\d])+/gim, ""))
        ) {
          showError(`${this.cpfKey} não é um CPF válido. Tente novamente`);
        }
      }
      if (this.keySearch) this.loadCadastro();
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
    this.getKeySearch();
    setTimeout(() => {
      this.clickCadasDados();
    }, 2000);
  },
  computed: mapState(["user"]),
};
</script>

<style>
</style>