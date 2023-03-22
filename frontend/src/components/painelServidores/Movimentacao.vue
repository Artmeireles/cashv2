<template>
  <div class="financeiro-admin" id="financeiro-admin">
    <b-row>
      <b-col md="12" sm="12">
        <div class="movimentos-grid">
          <b-button
            variant="outline-primary"
            class="mb-2"
            @click="newMovimentation"
          >
            <i class="fa fa-plus"></i>&nbsp;
            <span>Inserir Movimentação</span>
          </b-button>
          <b-table
            hover
            striped
            responsive
            :items="movimentos"
            :fields="fields"
            foot-clone
          >
            <!-- <template #cell(valor)="data">
              <span v-html="data.item.formmatedValor"></span>
            </template>
            <template #cell(prazo)="data">
              <span v-html="data.item.formmatedPrazo"></span>
            </template> -->
            <template #cell(actions)="row">
              <b-button
                v-if="userParams.tipoUsuario >= 2"
                size="sm"
                class="mr-1"
                v-b-tooltip.hover
                :disabled="row.item.automatico == 1"
                :variant="`outline${
                  row.item.automatico == 1 ? '' : '-warning'
                }`"
                title="Editar registro"
                href="#header"
              >
                <i class="fa fa-pencil"></i>
              </b-button>
              <b-button
                v-if="userParams.tipoUsuario >= 2"
                :disabled="row.item.automatico == 1"
                :variant="`outline${row.item.automatico == 1 ? '' : '-danger'}`"
                size="sm"
                :to="`/cadastros/${row.item.id}`"
                v-b-tooltip.hover
                title="Remover registro"
                href="#header"
              >
                <i class="fa fa-trash"></i>
              </b-button>
            </template>
            <template #foot(codigo_afastamento)>
              <span class="text-danger">{{
                `${count > 0 ? count : "Sem"} resultado${pluralize}`
              }}</span>
            </template>
          </b-table>
          <p class="valor-field-right al-padd">
            <span class="text-info" v-if="movimentos && movimentos.proventos">{{
              `Proventos ${movimentos.proventos.toLocaleString("pt-br", {
                style: "currency",
                currency: "BRL",
              })}`
            }}</span>
          </p>
          <p class="valor-field-right al-padd">
            <span class="text-danger" v-if="movimentos && movimentos.descontos">{{
              `Descontos ${movimentos.descontos.toLocaleString("pt-br", {
                style: "currency",
                currency: "BRL",
              })}`
            }}</span>
          </p>
          <b-button
            variant="outline-primary"
            class="mb-2"
            @click="newMovimentation"
          >
            <i class="fa fa-plus"></i>&nbsp;
            <span>Inserir Movimentação</span>
          </b-button>
        </div>
      </b-col>
    </b-row>
  </div>
</template>

<script>
// import { TheMask } from "vue-the-mask";
// import { showError } from "@/global";
import { baseApiUrl } from "@/env";
import axios from "axios";
import { mapState } from "vuex";

export default {
  name: "Financeiro",
  //   components: { TheMask },
  props: ["cadastroGrid", "userParams"],
  data: function () {
    return {
      mode: "save",
      cadastro: {},
      ocorrencia: {},
      movimento: { id: null },
      movimentos: [], // table
      lblAction: "Cancelar",
      form_active: false,
      loading: false,
      pluralize: "",
      page: 1,
      count: 0,
      fields: [
        {
          key: "id",
          label: "Código",
          sortable: true,
          thClass: "d-none",
          tdClass: "d-none",
        },
        {
          key: "codigo_afastamento",
          label: "Código",
          sortable: true,
          tdClass: "valor-field-center",
        },
        {
          key: "d_afastamento",
          label: "Inicio",
          sortable: true,
          tdClass: "valor-field-center",
        },
        {
          key: "codigo_retorno",
          label: "Código Retorno",
          sortable: true,
          tdClass: "valor-field-center",
        },
        {
          key: "d_retorno",
          label: "Retorno",
          sortable: true,
          tdClass: "valor-field-center",
        },
        {
          key: "label_afastamento",
          label: "Descrição Afastamento",
          sortable: true,
        },
        { key: "actions", label: "Ações", thClass: "col-actions2" },
      ],
    };
  },
  methods: {
    getMode() {
      if (this.$route.query.md && this.$route.query.md == "-1")
        this.mode = "remove";
    },
    setCadastro() {
      this.cadastro = this.cadastroGrid;
    },
    loadMovimentacao() {
      const url = `${baseApiUrl}/cad-movimentacao/${this.cadastro.id}?page=${this.page}`;
      axios.get(url).then((res) => {
        this.movimentos = res.data.data;
        // this.movimentos.forEach((element) => {});
        this.count = res.data.count;
        this.pluralize = this.count == 1 ? "" : "s";
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
      this.count = 0;
      this.loadCadastros();
    },
    newMovimentation() {
      this.$toasted.global.defaultInfo({
        msg: "Para esta operação utilize o MGFolha desktop",
      });
    },
  },
  mounted() {
    this.getMode();
    this.setCadastro();
    this.loadMovimentacao();
    // if (this.userParams.admin >= 2) this.form_active = true;
  },
  computed: mapState(["user"]),
};
</script>

<style scoped>
form {
  margin-bottom: 20px;
}
.ocorrencia-retorno {
  border: solid lightblue;
  border-radius: 3px;
}
.al-padd {
  padding-right: 15px;
}
</style>
