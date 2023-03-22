<template>
  <div class="cadas-pages">
    <PageTitle v-if="!user.tipoUsuario == 0" icon="fa fa-cogs" main="Administração dos cadastros" sub="" />
    <div class="cadas-pages">
      <b-card no-body>
        <div class="cadas-grid" v-if="!this.$route.params.id">
          <b-input-group size="md" class="mt-3 mb-3">
            <b-button variant="outline-primary" size="sm" slot="prepend"><i class="fa fa-plus"></i>&nbsp;
              <span>Novo Cadastro</span>
            </b-button>
            <b-form-input type="text" placeholder="Digite aqui para localizar o registro..." v-b-tooltip.hover
              title="Digite ao menos cinco caracteres para pesquisa dinâmica e use espaços para pesquisar por mais de uma expressão"
              v-model="keyword" @input="searchCadastros(5)" @blur="searchCadastros(1)" ref="keyword" />
            <b-btn size="sm" @click="searchCadastros(1)">
              <i class="fa fa-search"></i>
            </b-btn>
            <b-input-group-text slot="append">
              <span class>{{ keyword_res }}&nbsp;</span>
              <b-btn :disabled="!keyword" variant="link" size="sm" @click="getRefresh" class="p-0">
                <i class="fa fa-remove"></i>
              </b-btn>
            </b-input-group-text>
          </b-input-group>
          <b-table hover striped responsive :items="cadastros" :fields="fields" foot-clone>
            <template #cell(nome)="data">
              <span v-html="data.item.nome"></span>
            </template>
            <template #cell(vinculo)="data">
              <span v-html="data.item.vinculo"></span>
            </template>
            <template #cell(cpf)="data">
              <span v-html="data.item.cpf"></span>
            </template>
            <template #cell(matricula)="data">
              <span v-html="data.item.matricula"></span>
            </template>
            <template #cell(actions)="row">
              <b-button v-if="userParams.tipoUsuario >= 1"
                :variant="`${[1, 4, 5, 6, 9].includes(Number(row.item.id_vinculo)) ? 'outline-info' : ''}`" size="sm"
                :to="`/servidor-panel/${row.item.mat}`" class="mr-1" v-b-tooltip.hover title="Ver painel do servidor"
                href="#header" :disabled="![1, 4, 5, 6, 9].includes(Number(row.item.id_vinculo))">
                <i class="fa fa-send"></i>
              </b-button>
              <b-button v-if="userParams.tipoUsuario >= 2" variant="outline-warning" size="sm" :to="`/cadastros/${extractContent(
                row.item.cpf
              )}/${extractContent(row.item.matricula)}`" class="mr-1" v-b-tooltip.hover title="Editar registro"
                href="#header">
                <i class="fa fa-pencil"></i>
              </b-button>
              <b-button v-if="userParams.tipoUsuario >= 2" variant="outline-danger" size="sm" :to="`/cadastros/${extractContent(
                row.item.cpf
              )}/${extractContent(row.item.matricula)}?md=-1`" v-b-tooltip.hover title="Remover registro"
                href="#header">
                <i class="fa fa-trash"></i>
              </b-button>
            </template>
            <template #foot(nome)>
              <span class="text-danger">{{
                  `${count > 0 ? count : "Sem"} resultado${pluralize}`
              }}</span>
            </template>
          </b-table>
          <b-pagination size="md" v-model="page" :total-rows="count" :per-page="limit" />
        </div>
      </b-card>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import axios from "axios";
import { baseApiUrl } from "@/env";
import PageTitle from "../template/PageTitle";

export default {
  name: "AdminPages",
  components: {
    PageTitle,
  },
  data: function () {
    return {
      keyword: "",
      keyword_res: "",
      userParams: {},
      cadastro: { id: null },
      cadastros: [], // table
      pluralize: "",
      page: 1,
      limit: 0,
      count: 0,
      fields: [
        {
          key: "id",
          label: "Código",
          thClass: "d-none",
          tdClass: "d-none",
          sortable: true,
        },
        { key: "nome", label: "Nome", sortable: true },
        // { key: "id_vinculo", label: "Vinculo" },
        { key: "vinculo", label: "Vinculo", sortable: true },
        { key: "cpf", label: "CPF/CNPJ", sortable: true },
        { key: "matricula", label: "Matrícula", sortable: true },
        { key: "actions", label: "Ações", thClass: "col-actions2" },
      ],
    };
  },
  methods: {
    extractContent(s) {
      var span = document.createElement("span");
      span.innerHTML = s;
      return span.textContent || span.innerText;
    },
    focusInput(key) {
      this.$refs[key].focus();
    },
    highlight(value, markTxt) {
      let target = value;
      let targetMark = markTxt
        .toString()
        .trim()
        .replace(/\s\s+/g, " ")
        .split(" ");
      targetMark.forEach((elementMark) => {
        target = target.replaceAll(
          elementMark,
          `<mark class="foundMark">${elementMark}</mark>`
        );
      });
      return target;
    },
    searchCadastros(length) {
      if (this.keyword.toString().length >= length) this.loadCadastros();
    },
    loadCadastros() {
      const url = `${baseApiUrl}/cadastros?page=${this.page}&key=${this.keyword}`;
      axios.get(url).then((res) => {
        this.cadastros = res.data.data;
        this.count = res.data.count;
        this.limit = res.data.limit;
        this.cadastros.forEach((element) => {
          element.mat = element.matricula;
          element.matricula = this.highlight(
            element.matricula.toString().padStart(8, "0"),
            this.keyword
          );
          element.cpf = this.highlight(element.cpf, this.keyword);
          element.nome = this.highlight(
            element.nome,
            this.keyword.toString().toUpperCase()
          );
          switch (Number(element.id_vinculo)) {
            case 1: element.vinculo = "Efetivo"; break;
            case 2: element.vinculo = "Comissionado"; break;
            case 3: element.vinculo = "Contratado"; break;
            case 4: element.vinculo = "Aposentado"; break;
            case 5: element.vinculo = "Pensionista"; break;
            case 6: element.vinculo = "Eletivo"; break;
            case 7: element.vinculo = "Estagiário"; break;
            case 8: element.vinculo = "Contratado por Processo Seletivo"; break;
            case 9: element.vinculo = "Estabilizado"; break;
            case 10: element.vinculo = "Requisitado"; break;
            default: element.vinculo = "Não informado"; break;
          }
        });
        this.pluralize = this.count == 1 ? "" : "s";
        this.keyword_res = `${this.count} resultado${this.pluralize}`;
      });
    },
    getRefresh() {
      this.keyword = "";
      this.page = 1;
      this.loadCadastros();
    },
    reset() {
      this.keyword = "";
      this.page = 1;
      this.limit = 0;
      this.count = 0;
      this.loadCadastros();
    },
    getKeySearch() {
      if (this.$route.query.key) this.keyword = this.$route.query.key;
      this.loadCadastros();
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
    if (this.$refs.keyword) this.focusInput("keyword");
  },
  watch: {
    page() {
      this.loadCadastros();
    },
  },
  computed: mapState(["user"]),
};
</script>

<style scoped>
.client-presentation {
  padding: 3px;
}

.input-group {
  margin: 0 auto;
  width: 90%;
}
</style>
