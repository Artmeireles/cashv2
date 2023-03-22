<template>
  <div class="consign-hist">
    <Loading v-if="loading" />
    <div class="client-presentation" v-if="cadastros && cadastros.id">
      <h2>
        {{
          `${
            (userParams.tipoUsuario == 1 || userParams.admin >= 1)
              ? `Cliente: ${cadastros.nome}${
                  userParams.admin >= 1 ? ` (${cadastros.id})` : ""
                }`
              : ""
          }`
        }}
      </h2>
    </div>
    <b-card no-body>
      <div class="cadas-grid">
        <b-table
          hover
          striped
          responsive
          :items="consignacoes"
          :fields="fields"
          foot-clone
        >
          <template v-slot:cell(ano)="data">
            {{ `${data.item.mes}/${data.item.ano}` }}
          </template>
          <template v-slot:cell(prazo)="data">
            {{
              `${data.item.prazo.toString().padStart(2, "0")}/${data.item.prazot
                .toString()
                .padStart(2, "0")}`
            }}
          </template>
          <template v-slot:cell(valor)="data">
            {{ `R$ ${valueFormater(data.item.valor)}` }}
          </template>
          <template v-slot:cell(contrato)="data">
            {{
              `${data.item.contrato ? data.item.contrato : "Anterior ao Cash"}`
            }}
          </template>
          <template #foot(ano)>
            <span class="text-danger">{{
              `${count > 0 ? count : "Sem"} resultado${pluralize}`
            }}</span>
          </template>
        </b-table>
        <b-pagination
          size="md"
          v-model="page"
          :total-rows="count"
          :per-page="limit"
        />
      </div>
    </b-card>
  </div>
</template>

<script>
import { mapState } from "vuex";
import axios from "axios";
import { baseApiUrl } from "@/env";
import { getDecimalFormater } from "@/config/globalFacilities";
import Loading from "@/components/template/Loading";

export default {
  name: "ConsignHist",
  props: ["userParams","cadastros"],
  components: { Loading },
  data: function () {
    return {
      modeEdit: false,
      form_input_hide: true,
      loading: false,
      mode: "save",
      keyword: "",
      keyword_res: "",
      consignacoes: [], // table
      page: 1,
      valueFormater: getDecimalFormater,
      limit: 0,
      count: 0,
      pluralize: "",
      fields: [
        {
          key: "id",
          label: "Código",
          sortable: true,
          tdClass: "d-none",
          thClass: "d-none",
        },
        { key: "ano", label: "Folha", sortable: true },
        { key: "evento_nome", label: "Descrição", sortable: true },
        { key: "id_evento", label: "Evento", sortable: true },
        { key: "contrato", label: "Contrato", sortable: true },
        { key: "prazo", label: "Parcela", sortable: true },
        {
          key: "valor",
          label: "Valor",
          sortable: true,
          tdClass: "valor-field-right",
        },
      ],
    };
  },
  methods: {
    focusInput(key) {
      this.$refs[key].focus();
    },
    loadConsignacoes() {
      this.loading = !this.loading;
      const url = `${baseApiUrl}/fin-rubricas?page=${this.page}&key=${this.keyword}&cpf=${this.user.cpf}&idCadas=${this.cadastros.id}&consignados=1`;
      axios.get(url).then((res) => {
        this.consignacoes = res.data.data;
        this.count = res.data.count;
        this.limit = res.data.limit;
        this.pluralize = this.count > 1 ? "s" : "";
        this.keyword_res = `${this.count} resultado${this.pluralize}`;
        this.loading = !this.loading;
      });
    },
    getRefresh() {
      this.keyword = "";
      this.page = 1;
      this.loadConsignacoes();
    },
  },
  mounted() {
    this.loadConsignacoes();
  },
  watch: {
    page() {
      this.loadConsignacoes();
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
  width: 80%;
}
</style>
