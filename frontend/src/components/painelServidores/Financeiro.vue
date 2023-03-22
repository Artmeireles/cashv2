<template>
  <div class="financeiro-admin" id="financeiro-admin">
    <b-row>
      <b-col md="12" sm="12">
        <div class="rubricas-grid">
          <b-button
            variant="outline-primary"
            class="mb-2"
            @click="newProvision"
          >
            <i class="fa fa-plus"></i>&nbsp;
            <span>Inserir Provento</span>
          </b-button>
          <b-button
            variant="outline-primary"
            class="ml-2 mb-2"
            @click="newDiscount"
          >
            <i class="fa fa-plus"></i>&nbsp;
            <span>Inserir Desconto</span>
          </b-button>
          <b-button
            variant="outline-primary"
            class="ml-2 mb-2"
            @click="newTVacation"
          >
            <i class="fa fa-plus"></i>&nbsp;
            <span>Inserir Terço de Férias</span>
          </b-button>
          <b-table
            hover
            striped
            responsive
            :items="rubricas"
            :fields="fields"
            foot-clone
          >
            <template #cell(valor)="data">
              <span v-html="data.item.formmatedValor"></span>
            </template>
            <template #cell(prazo)="data">
              <span v-html="data.item.formmatedPrazo"></span>
            </template>
            <template #cell(actions)="row">
              <b-button
                v-if="userParams.tipoUsuario >= 2"
                size="sm"
                @click="editItem"
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
                @click="removeItem"
                v-b-tooltip.hover
                title="Remover registro"
                href="#header"
              >
                <i class="fa fa-trash"></i>
              </b-button>
            </template>
            <template #foot(id_evento)>
              <span class="text-danger">{{
                `${count > 0 ? count : "Sem"} resultado${pluralize}`
              }}</span>
            </template>
          </b-table>
          <b-row>
            <b-col md="12" sm="12">
              <b-row>
                <b-col md="8" sm="12">
                  <b-form-group
                    label="Eventos Adicionais"
                    label-for="funcional-n_horaaula"
                  >
                    <b-input-group>
                      <b-input-group-text>Horas Aula</b-input-group-text>
                      <b-form-input
                        id="funcional-n_horaaula"
                        type="number"
                        min="0"
                        v-model="funcional.n_horaaula"
                        required
                        :readonly="!form_active || mode === 'remove'"
                      />
                      <b-input-group-text>Ad Noturno</b-input-group-text>
                      <b-form-input
                        id="funcional-n_adnoturno"
                        type="number"
                        :max="n_adnoturno"
                        min="0"
                        v-model="funcional.n_adnoturno"
                        required
                        :readonly="!form_active || mode === 'remove'"
                      />
                      <b-input-group-text>Horas extras</b-input-group-text>
                      <b-form-input
                        id="funcional-n_hextra"
                        type="number"
                        min="0"
                        v-model="funcional.n_hextra"
                        required
                        :readonly="!form_active || mode === 'remove'"
                      />
                      <b-input-group-text>{{
                        `Faltas(Máx ${n_faltas})`
                      }}</b-input-group-text>
                      <b-form-input
                        id="funcional-n_faltas"
                        type="number"
                        :max="n_faltas"
                        min="0"
                        v-model="funcional.n_faltas"
                        required
                        :readonly="!form_active || mode === 'remove'"
                      />
                    </b-input-group>
                  </b-form-group>
                </b-col>
                <b-col md="2" sm="12">
                  <h5
                    class="text-info valor-field-right"
                    v-if="rubricas && rubricas.proventos"
                  >
                    Proventos
                  </h5>
                  <h5
                    class="text-danger valor-field-right"
                    v-if="rubricas && rubricas.descontos"
                  >
                    Descontos
                  </h5>
                  <hr />
                  <h6
                    class="text-default valor-field-right"
                    v-if="
                      funcional &&
                      funcional.tp_previdencia == 0 &&
                      rubricas &&
                      rubricas.bInss
                    "
                  >
                    Base INSS
                  </h6>
                  <h6
                    class="text-default valor-field-right"
                    v-if="
                      funcional &&
                      funcional.tp_previdencia == 4 &&
                      rubricas &&
                      rubricas.bRpps
                    "
                  >
                    Base RPPS
                  </h6>
                  <h6
                    class="text-default valor-field-right"
                    v-if="
                      funcional &&
                      funcional.desconta_irrf == 1 &&
                      rubricas &&
                      rubricas.bIrrf
                    "
                  >
                    Base IRRF
                  </h6>
                </b-col>
                <b-col md="2" sm="12">
                  <h5
                    class="text-info valor-field-right al-padd"
                    v-if="rubricas && rubricas.proventos"
                  >
                    {{
                      `${rubricas.proventos.toLocaleString("pt-br", {
                        style: "currency",
                        currency: "BRL",
                      })}`
                    }}
                  </h5>
                  <h5
                    class="text-danger valor-field-right al-padd"
                    v-if="rubricas && rubricas.descontos"
                  >
                    {{
                      `${rubricas.descontos.toLocaleString("pt-br", {
                        style: "currency",
                        currency: "BRL",
                      })}`
                    }}
                  </h5>
                  <hr />
                  <h6
                    class="text-default valor-field-right al-padd"
                    v-if="
                      funcional &&
                      funcional.tp_previdencia == 0 &&
                      rubricas &&
                      rubricas.bInss
                    "
                  >
                    {{
                      `${rubricas.bInss.toLocaleString("pt-br", {
                        style: "currency",
                        currency: "BRL",
                      })}`
                    }}
                  </h6>
                  <h6
                    class="text-default valor-field-right al-padd"
                    v-if="
                      funcional &&
                      funcional.tp_previdencia == 4 &&
                      rubricas &&
                      rubricas.bRpps
                    "
                  >
                    {{
                      `${rubricas.bRpps.toLocaleString("pt-br", {
                        style: "currency",
                        currency: "BRL",
                      })}`
                    }}
                  </h6>
                  <h6
                    class="text-default valor-field-right al-padd"
                    v-if="
                      funcional &&
                      funcional.desconta_irrf == 1 &&
                      rubricas &&
                      rubricas.bIrrf
                    "
                  >
                    {{
                      `${rubricas.bIrrf.toLocaleString("pt-br", {
                        style: "currency",
                        currency: "BRL",
                      })}`
                    }}
                  </h6>
                </b-col>
              </b-row>
            </b-col>
          </b-row>
          <b-button
            variant="outline-primary"
            class="mb-2"
            @click="newProvision"
          >
            <i class="fa fa-plus"></i>&nbsp;
            <span>Inserir Provento</span>
          </b-button>
          <b-button
            variant="outline-primary"
            class="ml-2 mb-2"
            @click="newDiscount"
          >
            <i class="fa fa-plus"></i>&nbsp;
            <span>Inserir Desconto</span>
          </b-button>
          <b-button
            variant="outline-primary"
            class="ml-2 mb-2"
            @click="newTVacation"
          >
            <i class="fa fa-plus"></i>&nbsp;
            <span>Inserir Terço de Férias</span>
          </b-button>
        </div>
      </b-col>
    </b-row>
    <b-row>
      <b-col md="12" sm="12">
        <b-card class="text-left" title="Retorno Bancário:">
          <div
            class="bg-secondary text-light"
            style="padding: 5px; border-radius: 5px"
            v-html="funcional.retorno"
          />
        </b-card>
      </b-col>
    </b-row>
  </div>
</template>

<script>
// import { TheMask } from "vue-the-mask";
import { showError } from "@/global";
import { baseApiUrl } from "@/env";
import axios from "axios";
import { mapState } from "vuex";
import moment from "moment";

export default {
  name: "Financeiro",
  //   components: { TheMask },
  props: ["cadastroGrid", "userParams"],
  data: function () {
    return {
      mode: "save",
      cadastro: {},
      funcional: {},
      rubrica: { id: null },
      rubricas: [], // table
      lblAction: "Cancelar",
      form_active: false,
      n_faltas: 0,
      n_adnoturno: 0,
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
          key: "id_evento",
          label: "Rúbrica",
          sortable: true,
          tdClass: "valor-field-center",
        },
        { key: "evento_nome", label: "Descrição", sortable: true },
        {
          key: "formmatedPrazo",
          label: "Prazo",
          sortable: true,
          tdClass: "valor-field-center",
        },
        {
          key: "formmatedValor",
          label: "Valor",
          sortable: true,
          tdClass: "valor-field-right",
        },
        {
          key: "formmatedAutomatico",
          label: "Automatico",
          sortable: true,
          tdClass: "valor-field-center",
        },
        {
          key: "consignavel",
          label: "Consignável",
          sortable: true,
          tdClass: "valor-field-center",
        },
        // {
        //   key: "bInss",
        //   label: "Inss",
        //   sortable: true,
        //   tdClass: "valor-field-center",
        // },
        // {
        //   key: "bRpps",
        //   label: "RPPS",
        //   sortable: true,
        //   tdClass: "valor-field-center",
        // },
        // {
        //   key: "bIrrf",
        //   label: "IRRF",
        //   sortable: true,
        //   tdClass: "valor-field-center",
        // },
        {
          key: "fixo",
          label: "Fixo",
          sortable: true,
          tdClass: "valor-field-center",
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
    loadFuncional() {
      this.loading = !this.loading;
      const url = `${baseApiUrl}/fin-sfuncional/${this.cadastro.id}`;
      axios
        .get(url)
        .then((res) => {
          if (res.data.data) {
            this.funcional = res.data.data;
            this.funcional.n_faltas = this.funcional.n_faltas || 0;
            this.funcional.n_horaaula = this.funcional.n_horaaula || 0;
            this.funcional.n_adnoturno = this.funcional.n_adnoturno || 0;
            this.funcional.n_hextra = this.funcional.n_hextra || 0;
            this.funcional.tp_previdencia =
              this.funcional.tp_previdencia || undefined;
            this.funcional.desconta_irrf =
              this.funcional.desconta_irrf || undefined;
            if (
              !(
                this.funcional.retorno_ocorrencia ||
                this.funcional.retorno_data ||
                this.funcional.retorno_valor ||
                this.funcional.retorno_documento
              )
            )
              this.funcional.retorno = `Retorno bancário incompleto ou sem retorno`;
            else
              this.funcional.retorno = `Retorno bancário: ${this.funcional.retorno_ocorrencia}
             - em: ${this.funcional.retorno_data} R$ ${this.funcional.retorno_valor}
             , documento: ${this.funcional.retorno_documento}`;
            this.$emit("funcional", this.funcional);
          }
          this.loading = !this.loading;
        })
        .catch((err) => {
          showError(err);
        });
    },
    loadFinanceiro() {
      const url = `${baseApiUrl}/fin-rubricas/${this.cadastro.id}?page=${this.page}`;
      axios.get(url).then((res) => {
        this.rubricas = res.data.data;
        let proventos = 0.0;
        let descontos = 0.0;
        let bInss = 0.0;
        let bRpps = 0.0;
        let bIrrf = 0.0;
        this.rubricas.forEach((element) => {
          element.formmatedAutomatico = this.getSN(element.automatico);
          element.consignavel = this.getSN(element.consignavel);
          element.fixo = this.getSN(element.fixo);
          if (
            element.prazo == element.prazot &&
            ([1, 999].includes(element.prazo) ||
              [1, 999].includes(element.prazot))
          )
            element.formmatedPrazo = "1";
          else element.formmatedPrazo = `${element.prazo}/${element.prazot}`;
          element.formmatedValor = element.valor.toLocaleString("pt-br", {
            style: "currency",
            currency: "BRL",
          });
          if (element.tipo == "0") proventos += element.valor;
          if (element.tipo == "1") descontos += element.valor;
          if (element.bInss >= 1) bInss += element.valor;
          if (element.bRpps >= 1) bRpps += element.valor;
          if (element.bIrrf >= 1) bIrrf += element.valor;
          this.rubricas.proventos = proventos;
          this.rubricas.descontos = descontos;
          this.rubricas.bInss = bInss;
          this.rubricas.bRpps = bRpps;
          this.rubricas.bIrrf = bIrrf;
        });
        this.count = res.data.count;
        this.pluralize = this.count == 1 ? "" : "s";
      });
    },
    getSN(value) {
      let res = "Não";
      if (value == "1") res = "Sim";
      return res;
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
    newProvision() {
      this.$toasted.global.defaultInfo({
        msg: "Para esta operação utilize o MGFolha desktop",
      });
    },
    newDiscount() {
      this.$toasted.global.defaultInfo({
        msg: "Para esta operação utilize o MGFolha desktop",
      });
    },
    newTVacation() {
      this.$toasted.global.defaultInfo({
        msg: "Para esta operação utilize o MGFolha desktop",
      });
    },
    editItem() {
      this.$toasted.global.defaultInfo({
        msg: "Para esta operação utilize o MGFolha desktop",
      });
    },
    removeItem() {
      this.$toasted.global.defaultInfo({
        msg: "Para esta operação utilize o MGFolha desktop",
      });
    },
    maxFaltas() {
      this.n_faltas = moment(
        `${this.userParams.f_ano}-${this.userParams.f_mes}`,
        "YYYY-MM"
      ).daysInMonth();
    },
  },
  mounted() {
    this.getMode();
    this.setCadastro();
    this.loadFuncional();
    this.loadFinanceiro();
    this.maxFaltas();
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
