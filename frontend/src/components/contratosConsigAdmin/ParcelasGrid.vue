<template>
  <div class="cons-liquidations">
    <b-card no-body>
      <div class="cadas-grid">
        <b-input-group size="md" class="mb-1">    
          <b-form-input type="text" placeholder="Digite aqui a parcela desejada" v-b-tooltip.hover v-model="keyword"
            @input="loadParcelas" ref="keyword" />
          <template #prepend>
            <b-input-group-text><i class="fa fa-search"></i></b-input-group-text>
          </template>
          <b-form-datepicker id="contrato-p_vencimento" class="input200" v-model="vencimento" locale="pt"
            v-bind="labelsDatePicker['pt'] || {}"
            :date-format-options="{year: 'numeric',month: 'numeric',day: 'numeric',}" reset-button
            placeholder="Filtrar exercício" @input="loadParcelas">
          </b-form-datepicker>
          <b-form-select slot="append" id="searchBar-situacoes" :options="optionStatus" v-model="optionStatusM"
            @input="loadParcelas" />
          <b-form-select slot="append" id="searchBar-statusV" :options="optionStatusVcto" v-model="optionStatusVctoM"
            @input="loadParcelas" />
          <b-input-group-text slot="append">
            <span class>{{ keyword_res }}&nbsp;</span>
            <b-btn variant="link" size="sm" @click="reset" class="p-0">
              <i class="fa fa-remove"></i>
            </b-btn>
          </b-input-group-text>
          <b-btn slot="append" variant="outline-info" size="sm" @click="reset">Limpar</b-btn>
        </b-input-group>
        <b-table hover striped responsive :items="parcelas" :fields="fields">
          <template v-slot:cell(parcela)="data">
            {{ `${data.item.parcela}` }}
          </template>
          <template v-slot:cell(valor_parcela)="data">
            {{ `R$ ${valueFormater(data.item.valor_parcela)}` }}
          </template>
          <template v-slot:cell(vencimento)="data">
            {{ `${data.item.vencimento}` }}
          </template>
          <template v-slot:cell(situacao)="row">
            {{ `${getLabel(optionStatus, row.item.situacao)}` }}
          </template>
          <template v-slot:cell(past)="row">
            {{ `${row.item.past ? "Liquidado":"Pendente"}` }}
          </template>
          <template #cell(actions)="row">
            <b-button :variant="row.item.past ? 'outline-secondary':'outline-info'" size="sm" @click="row.toggleDetails"
              class="mr-1" v-b-tooltip.hover :title="row.item.past ? 'Parcela já liquidada' : 'Editar registro'"
              :disabled="row.item.past">
              <!-- @click="loadItem(row.item, row.index, $event.target)"  -->
              <i
                :class="`fa fa-${(userParams.con_contratos >= 3 && ((userParams.consignatario == row.item.id_consignatario) || userParams.tipoUsuario >= 2)) ? 'pencil' : 'eye'}`"></i>
            </b-button>
          </template>
          <template #row-details="row">
            <b-card>
              <ParcelaData :item="row.item" @objectInputs="loadParcelas" @close="row.toggleDetails" />
            </b-card>
          </template>
        </b-table>
        <b-pagination size="md" v-model="page" :total-rows="count" :per-page="limit" />
      </div>
    </b-card>
    <!-- <b-modal :id="`modal_${item.id}`" :title="itemModal.title" @hide="resetItemModal">
      <ParcelaData :item="itemModal.content" @objectInputs="loadParcelas" />
    </b-modal> -->
  </div>
</template>
<script>
import { mapState } from "vuex";
import axios from "axios";
// import { showError } from "@/global";
import moment from 'moment'
import { baseApiUrl } from "@/env";
import {
  getDecimalFormater,
  datePickerLocale,
} from "@/config/globalFacilities";
import ParcelaData from "./ParcelaData";

export default {
  name: "parcelasGrid",
  components: { ParcelaData },
  props: ['item'],
  data: function () {
    return {
      userParams: {},
      labelsDatePicker: datePickerLocale,
      itemModal: {
        id: "item-modal",
        title: "",
        content: "",
      },
      title: "",
      optionStatus: [
        { value: "-1", text: "Selecione" },
        { value: "1", text: "Acatar" },
        { value: "2", text: "Excluido" },
        { value: "3", text: "Excesso de débito" },
        { value: "4", text: "Matrícula inválida" },
        { value: "5", text: "DV-Matrícula inválida" },
        { value: "6", text: "Aposentado" },
        { value: "7", text: "Rescisão sem desconto" },
        { value: "8", text: "Afastado" },
        { value: "9", text: "Outros" },
        { value: "100", text: "Pagamento parcial" },
        { value: "101", text: "Rescisão com desconto" },
        { value: "102", text: "Decisão judicial" },
        { value: "103", text: "Férias" },
        { value: "104", text: "Falecido" },
        { value: "105", text: "Exonerado" },
        { value: "106", text: "Licença" },
      ],
      optionStatusM: "",
      optionStatusVcto: [],
      optionStatusVctoM: "",
      vencimento: "",
      keyword: "",
      keyword_res: "",
      parcelas: [], // table
      valueFormater: getDecimalFormater,
      page: 1,
      limit: 0,
      count: 0,
      fields: [
        {
          key: "id",
          label: "Código",
          sortable: true,
          tdClass: "d-none",
          thClass: "d-none",
        },
        {
          key: "parcela",
          label: "Parcela",
          sortable: true,
          thClass: "valor-field-center",
          tdClass: "valor-field-center",
        },
        {
          key: "valor_parcela",
          label: "Valor Parcela",
          sortable: true,
          thClass: "valor-field-center",
          tdClass: "valor-field-center",
        },
        {
          key: "vencimento", label: "Vencimento", sortable: true,
          thClass: "valor-field-center",
          tdClass: "valor-field-center",
        },
        {
          key: "situacao", label: "Situação", sortable: true,
          thClass: "valor-field-center",
          tdClass: "valor-field-center",
        },
        {
          key: "past", label: "Status do Vencimento", sortable: true,
          thClass: "valor-field-center",
          tdClass: "valor-field-center",
        },
        {
          key: "actions",
          label: "Ações",
          thClass: "col-actions2",
          tdClass: "col-actions2",
        },
      ],
    };
  },
  methods: {
    loadItem(item, index, button) {
      this.itemModal.title = `Parâmetros da parcela ${item.parcela}`;

      this.itemModal.content = item;
      this.$root.$emit("bv::show::modal", `modal_${this.item.id}`, button);
    },
    resetItemModal() {
      this.itemModal.title = "";
      this.itemModal.content = "";
    },
    getLabel(array, key) {
      const item = array.filter((it) => it.value == key);
      return item && item[0] && item[0].text ? item[0].text : "";
    },
    loadParcelas() {
      const url = `${baseApiUrl}/con-parcelas/${this.item.id}?page=${this.page}&key=${this.keyword}&situacao=${this.optionStatusM}&vencimento=${this.vencimento}&statusV=${this.optionStatusVctoM}`;
      axios.get(url).then((res) => {
        this.parcelas = res.data.data;
        this.parcelas.forEach(element => {
          element.past = false
          if (moment(element.vencimento) < moment().startOf('month'))
            element.past = true
          element.vencimento = moment(element.vencimento).format("DD/MM/YYYY")
          element.parcela = element.parcela.toString().padStart(3, '0')
          element.id_consignatario = this.item.id_consignatario
        });
        this.count = res.data.count;
        this.limit = res.data.limit;
        const pluralize = this.count > 1 ? "s" : "";
        this.keyword_res = `${this.count} resultado${pluralize}`;
      });
    },
    reset() {
      this.optionStatusM = ""
      this.optionStatusVctoM = ""
      this.vencimento = ""
      this.keyword = ""
      this.page = 1;
      this.limit = 0;
      this.count = 0;
      this.loadParcelas();
      this.optionStatus = [
        { value: "", text: "Situação" },
        { value: "1", text: "Acatar" },
        { value: "2", text: "Excluido" },
        { value: "3", text: "Excesso de débito" },
        { value: "4", text: "Matrícula inválida" },
        { value: "5", text: "DV-Matrícula inválida" },
        { value: "6", text: "Aposentado" },
        { value: "7", text: "Rescisão sem desconto" },
        { value: "8", text: "Afastado" },
        { value: "9", text: "Outros" },
        { value: "100", text: "Pagamento parcial" },
        { value: "101", text: "Rescisão com desconto" },
        { value: "102", text: "Decisão judicial" },
        { value: "103", text: "Férias" },
        { value: "104", text: "Falecido" },
        { value: "105", text: "Exonerado" },
        { value: "106", text: "Licença" },
      ]
      this.optionStatusVcto = [
        { value: "", text: "Vencimento" },
        { value: "0", text: "Liquidados" },
        { value: "1", text: "Pendentes" },
      ]
    },
    loadUserParams() {
      const url = `${baseApiUrl}/users/${this.user.id}`;
      axios.get(url).then((res) => {
        this.userParams = res.data;
      });
    },
  },
  mounted() {
    this.reset();
    this.loadUserParams();
  },
  watch: {
    page() {
      this.loadParcelas();
    },
  },
  computed: mapState(["user"]),
};
</script>

<style scoped>
.input200 {
  max-width: 200px;
}
</style>