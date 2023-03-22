<template>
  <div class="cons-liquidations">
    <Loading v-if="loading" />
    <b-card no-body>
      <div class="cadas-grid">
        <b-overlay :show="loading" rounded="sm" @shown="onShown" @hidden="onHidden">
          <b-input-group size="md" class="mb-1">
            <b-form-input type="text" placeholder="Digite aqui: nome, contrato ou CPF(apenas números)"
              title="Para CPF, utilize apenas números" v-b-tooltip.hover v-model="keyword" @input="loadContratos"
              ref="keyword" />
            <template #prepend>
              <b-input-group-text><i class="fa fa-search"></i></b-input-group-text>
            </template>
            <b-form-select slot="append" id="searchBar-bancos" :options="optionsBancos" v-model="optionsBancosM"
              @input="loadContratos" />
            <b-form-datepicker id="contrato-vencimento" class="input200" v-model="vencimento" locale="pt"
              v-bind="labelsDatePicker['pt'] || {}"
              :date-format-options="{year: 'numeric',month: 'numeric',day: 'numeric',}" reset-button
              placeholder="Exercício" @input="loadContratos" />
            <b-form-datepicker id="contrato-primeiro_vencimento" class="input200" v-model="primeiro_vencimento"
              locale="pt" v-bind="labelsDatePicker['pt'] || {}"
              :date-format-options="{year: 'numeric',month: 'numeric',day: 'numeric',}" reset-button
              placeholder="1º Vencimento em" @input="loadContratos" />
            <b-form-select slot="append" id="searchBar-situacoes" :options="optionStatus" v-model="optionStatusM"
              @input="loadContratos" />
            <b-input-group-text slot="append">
              <span class>{{ keyword_res }}&nbsp;</span>
            </b-input-group-text>
            <b-dropdown slot="append" variant="link" right toggle-class="text-decoration-none" no-caret
              :disabled="!vencimento">
              <template #button-content>
                <i class="fas fa-cloud-download-alt"></i>
              </template>
              <b-dropdown-item href="#" @click="downloadFile('csv-1')" :disabled="!vencimento"><i
                  class="fas fa-file-csv"></i> Folha CSV{{`${!vencimento ? ' (Selecione exercício)' : ''}`}}
              </b-dropdown-item>
              <b-dropdown-item href="#" @click="downloadFile('csv-2')"><i class="fas fa-file-csv"></i> Extrato CSV
              </b-dropdown-item>
              <!-- <b-dropdown-item href="#" @click="downloadFile('excel')"><i class="far fa-file-excel"></i> XLS
              </b-dropdown-item> -->
              <b-dropdown-item href="#" @click="printAnalitico('pdf')" :disabled="!(vencimento && optionsBancosM)">
                <i class="far fa-file-pdf"></i>
                Analítico PDF{{`${!(vencimento && optionsBancosM) ? ' (Selecione exercício e banco)' :
                ''}`}}
              </b-dropdown-item>
              <b-dropdown-item href="#" @click="printExtrato('pdf')" :disabled="!(vencimento && optionsBancosM)"
                v-if="(userParams.tipoUsuario == 1 || userParams.admin >= 1) || userParams.admin >= 1"><i class="far fa-file-pdf"></i>
                Fechamento PDF{{`${!(vencimento && optionsBancosM) ? ' (Selecione exercício e banco)' :
                ''}`}}
              </b-dropdown-item>
              <b-dropdown-item href="#" @click="printExtrato('docx')" :disabled="!(vencimento && optionsBancosM)"
                v-if="userParams.admin >= 1"><i class="far fa-file-word"></i>
                Fechamento Word(Apenas suporte){{`${!(vencimento && optionsBancosM) ? ' (Selecione exercício e banco)' :
                ''}`}}
              </b-dropdown-item>
            </b-dropdown>
            <b-btn slot="append" variant="outline-info" size="sm" @click="reset">Limpar</b-btn>
          </b-input-group>
          <b-table hover striped responsive :items="contratos" :fields="fields">
            <template v-slot:cell(contrato)="data">
              {{ `${data.item.contrato}${userParams.admin >= 1 ? ` (${data.item.id})` : ''}` }}
            </template>
            <template v-slot:cell(nome)="data">
              {{ `${data.item.nome} (${data.item.matricula.toString().padStart(8,'0')})` }}
            </template>
            <template v-slot:cell(cpf)="data">
              {{ `${data.item.cpf}` }}
            </template>
            <template v-slot:cell(valor_parcela)="data">
              {{ `R$ ${valueFormater(data.item.valor_parcela)}` }}
            </template>
            <template v-slot:cell(parcela)="row">
              {{ `${row.item.parcela || ''}${row.item.parcela ? '/':''}${row.item.parcelas}` }}
            </template>
            <template v-slot:cell(primeiro_vencimento)="row">
              {{ `${row.item.primeiro_vencimento}` }}
            </template>
            <template v-slot:cell(status)="row">
              {{ `${getLabel(optionStatus, row.item.status)}` }}
            </template>
            <template #cell(actions)="row">
              <b-button :variant="row.item.status == 20 ? 'outline-secondary':'outline-info'" size="sm"
                @click="row.toggleDetails" class="mr-1" v-b-tooltip.hover
                :title="row.item.status == 20 ? `Ver registro liquidado` : 'Editar registro'"
                >
                
                <!-- :title="row.item.status == 20 ? `Registro liquidado não pode ser editado` : 'Editar registro'" -->
                <!-- :disabled="row.item.status == 20" -->
                <!-- @click="item(row.item, row.index, $event.target)" -->
                <i :class="`fa fa-${(row.item.canEdit && row.item.status != 20) ? 'pencil' : 'eye'}`"></i>
              </b-button>
            </template>
            <template #row-details="row">
              <b-card>
                <ParcelasGrid :item="row.item" @reload="loadContratos" />
              </b-card>
            </template>
          </b-table>
          <b-pagination size="md" v-model="page" :total-rows="count" :per-page="limit" />
        </b-overlay>
      </div>
    </b-card>
  </div>
</template>
<script>
import { mapState } from "vuex";
import axios from "axios";
import { showError } from "@/global";
import { baseApiUrl } from "@/env";
import {
  getDecimalFormater,
  datePickerLocale,
} from "@/config/globalFacilities";
import ParcelasGrid from "./ParcelasGrid.vue";
import moment from 'moment'
import exportFromJSON from "export-from-json";
import Loading from "@/components/template/Loading";

export default {
  name: "ContratosGrid",
  components: { ParcelasGrid, Loading },
  data: function () {
    return {
      userParams: {},
      title: "",
      itemModal: {
        id: "item-modal",
        title: "",
        content: "",
      },
      optionStatusM: undefined,
      optionStatus: [],
      optionsBancos: [
        { value: "", text: "Todos os bancos" },
        { value: "001", text: "001-Brasil" },
        { value: "104", text: "104-Caixa" },
        { value: "237", text: "237-Bradesco" },
      ],
      optionsBancosM: undefined,
      loading: false,
      mode: "save",
      isValid: false,
      executing: false,
      keyword: "",
      keyword_res: "",
      labelsDatePicker: datePickerLocale,
      vencimento: "",
      primeiro_vencimento: "",
      lines: 0,
      progressLine: 0,
      contratos: [], // table
      contrato: {}, // field
      lblCancelar: "Cancelar",
      valueFormater: getDecimalFormater,
      interval: null,
      downloadACopy: false,
      fileSrc: undefined,
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
        { key: "nome", label: "Servidor", sortable: true },
        {
          key: "cpf", label: "CPF", sortable: true,
          thClass: "valor-field-center",
        },
        { key: "contrato", label: "Contrato", sortable: true },
        {
          key: "febraban", label: "Banco", sortable: true,
          thClass: "valor-field-center",
          tdClass: "valor-field-center",
        },
        {
          key: "parcela",
          label: "Parcelas",
          sortable: true,
          thClass: "valor-field-center",
          tdClass: "valor-field-center",
        },
        {
          key: "valor_parcela",
          label: "Parcela Contratada",
          sortable: true,
          thClass: "valor-field-center",
          tdClass: "valor-field-right",
        },
        {
          key: "primeiro_vencimento",
          label: "Primeiro Vencimento",
          sortable: true,
          thClass: "valor-field-center",
          tdClass: "valor-field-center",
        },
        { key: "status", label: "Situação", sortable: true },
        {
          key: "actions",
          label: "Ações",
          thClass: "col-actions1 valor-field-center",
          tdClass: "col-actions1 valor-field-center",
        },
      ],
    };
  },
  methods: {
    onShown() { },
    onHidden() { },
    printAnalitico(typeFile) {
      this.loading = true;
      moment.locale("pt-br");
      const defaultTitle = `Relatório Analítico das Consignações Ativas ${moment(this.vencimento).format("MM")}/${moment(this.vencimento).format("YYYY")}`;
      const body = {
        mes: moment(this.vencimento).format("MM"),
        ano: moment(this.vencimento).format("YYYY"),
        idConsignatario: this.optionsBancosM,
        exportType: typeFile,
        titulo: "Relatório Analítico das Consignações Ativas",
        descricao: `Informações referente ao exercício ${moment(this.vencimento).format("MM")}/${moment(this.vencimento).format("YYYY")}`,
        encoding: "base64",
      }
      this.loading = !this.loading;
      const url = `${baseApiUrl}/relatorios/f-a/cna`;
      this.fileSrc = undefined;
      axios
        .post(url, body)
        .then((res) => {
          this.fileSrc = res.data;
          this.downloadPDF(
            res.data,
            defaultTitle.replaceAll(" ", "_").replace("_-_", "_")
          );
          let pdfWindow = window.open("");
          pdfWindow.document.write(
            `<iframe frameBorder="0"width='100%' height='100%' src='data:application/pdf;base64, 
            ${encodeURI(this.fileSrc)} '></iframe>`
          );
        })
        .catch((error) => {
          console.log(error);
          showError({ msg: error })
        });
      this.loading = false;
    },
    printExtrato(typeFile) {
      this.loading = true;
      moment.locale("pt-br");
      const defaultTitle = `Relatório de Fechamento Mensal Sintético ${moment(this.vencimento).format("MM")}/${moment(this.vencimento).format("YYYY")}`;
      const body = {
        mes: moment(this.vencimento).format("MM"),
        ano: moment(this.vencimento).format("YYYY"),
        idConsignatario: this.optionsBancosM,
        exportType: typeFile,
        titulo: "Relatório de Fechamento Mensal Sintético",
        descricao: `Informações referente ao exercício laboral de ${moment(this.vencimento).format("MMMM")} de ${moment(this.vencimento).format("YYYY")}`,
        encoding: "base64",
      }
      this.loading = !this.loading;
      const url = `${baseApiUrl}/relatorios/f-a/cne`;
      this.fileSrc = undefined;
      axios
        .post(url, body)
        .then((res) => {
          this.fileSrc = res.data;
          if (typeFile == 'pdf') {
            this.downloadPDF(
              res.data,
              defaultTitle.replaceAll(" ", "_").replace("_-_", "_")
            );
            let pdfWindow = window.open("");
            pdfWindow.document.write(
              `<iframe frameBorder="0" width='100%' height='100%' src='data:application/pdf;base64, 
            ${encodeURI(this.fileSrc)} '></iframe>`
            );
          } else {
            this.downloadDOC(typeFile, res.data, defaultTitle.replaceAll(" ", "_").replace("_-_", "_"))
          }
        })
        .catch((error) => {
          console.log(error);
          showError({ msg: error })
        });
      this.loading = false;
    },
    downloadPDF(pdf, fileName) {
      const linkSource = `data:application/pdf;base64,${pdf}`;
      const downloadLink = document.createElement("a");
      downloadLink.href = linkSource;
      downloadLink.download = fileName;
      downloadLink.click();
    },
    downloadDOC(extension, file, fileName) {
      const linkSource = `data:application/${extension};base64,${file}`;
      const downloadLink = document.createElement("a");
      downloadLink.href = linkSource;
      downloadLink.download = `${fileName}.${extension}`;
      downloadLink.click();
    },
    downloadFile(typeToDownload) {
      const url = `${baseApiUrl}/contratos?complied=1&page=0&key=${this.keyword}&optionsBancos=${this.optionsBancosM}&status=${this.optionStatusM}&pv=${this.primeiro_vencimento}&vcto=${this.vencimento}`;
      axios.get(url).then((res) => {
        const data = res.data.data;
        data.forEach(element => {
          let parcela = element.parcelas
          if (typeToDownload == 'csv-1') {
            element.dados = `${moment(this.vencimento).format("YYYY")};${moment(this.vencimento).format("MM")};${element.matricula.toString().padStart(10, '0')};${element.febraban};${element.parcela},${element.parcelas};${element.valor_parcela}`
            delete element.id_consignatario
            delete element.febraban
            delete element.cpf
            delete element.valor_parcela
            delete element.matricula
            delete element.parcela
            delete element.id
            delete element.id_parcela
            delete element.parcelas
            delete element.nome
            delete element.primeiro_vencimento
            delete element.status
            delete element.contrato
          } else if (typeToDownload == 'csv-2') {
            if (element.parcela) parcela = element.parcela + '/' + element.parcelas
            element.parcela = parcela
            element.primeiro_vencimento = moment(element.primeiro_vencimento).format("DD/MM/YYYY")
            const valor_parcela = element.valor_parcela.toString()//.replace('.', ',')
            element.valor_parcela = valor_parcela
            element.cpf = element.cpf.toString()
            element.contrato = element.contrato.toString()
            element.status = this.getLabel(this.optionStatus, element.status)
            delete element.parcelas
            delete element.id_parcela
            delete element.id
          }
        })
        const fileName = "contratos";
        let exportType = exportFromJSON.types.csv;
        if (typeToDownload == 'excel') exportType = exportFromJSON.types.xls
        if (data) {
          exportFromJSON({ data, fileName, exportType });
        }
      })
        .catch((error) => {
          console.log(error);
          showError({ msgs: error })
        })
    },
    item(item, index, button) {
      this.itemModal.title = `Utilize este formulário para editar uma importação de consignação. Seq ${item.seq} (${item.id}) `;
      this.itemModal.content = item;
      this.$root.$emit("bv::show::modal", this.itemModal.id, button);
    },
    resetItemModal() {
      this.itemModal.title = "";
      this.itemModal.content = "";
    },
    getLabel(array, key) {
      const item = array.filter((it) => it.value == key);
      return item && item[0] && item[0].text ? item[0].text : "";
    },
    loadContratos() {
      const url = `${baseApiUrl}/contratos?page=${this.page}&key=${this.keyword}&optionsBancos=${this.optionsBancosM}&status=${this.optionStatusM}&pv=${this.primeiro_vencimento}&vcto=${this.vencimento}`;
      axios.get(url).then((res) => {
        this.contratos = res.data.data;
        this.contratos.forEach(element => {
          element.primeiro_vencimento = moment(element.primeiro_vencimento).format("DD/MM/YYYY")
          element.canEdit = this.userParams.con_contratos >= 3 && (((this.userParams.tipoUsuario == 1 || this.userParams.admin >= 1) && this.userParams.consignatario == element.id_consignatario) || this.userParams.tipoUsuario > 1)
        })
        this.count = res.data.count;
        this.limit = res.data.limit;
        this.keyword_res = `#${this.count}`;
      });
    },
    save(mode) {
      this.isValid = false;
      this.contrato.mode = mode;
      const method = this.contrato.id ? "put" : "post";
      const id = this.contrato.id ? `/${this.contrato.id}` : "";
      this.loading = !this.loading;
      let reloadExecution = undefined;
      if (mode == "executar" && this.progressLine < this.lines) {
        setInterval(() => {
          this.progressLine++;
        }, 200);
        reloadExecution = setInterval(() => {
          this.getBarStatus();
        }, 5000);
      }
      this.executing = !this.executing;
      axios[method](`${baseApiUrl}/con-liquidacoes${id}`, this.contrato)
        .then((res) => {
          if (res.data.lines > 0) this.lines = res.data.lines;
          this.$toasted.global.defaultSuccess({ msg: res.data.data });
          if (res.data.returnRows)
            this.contrato.liquidacoes = res.data.returnRows;
          this.isValid = res.data.isValid || false;
          if (method == "put") this.loadContrato(res.data);
          this.loading = !this.loading;
          if (res.data.rbp) this.contrato.liquidacoes = res.data.rbp;
          else if (mode == "executar") this.reset();
          this.loadContratos();
          this.executing = !this.executing;
          clearInterval(reloadExecution);
        })
        .catch((err) => {
          this.loading = !this.loading;
          this.executing = !this.executing;
          showError(err);
        });
    },
    downloadFiles() {
      alert('Atenção para o nr febraban')
      axios.get(`${baseApiUrl}/con-liquidacoes/f/gimf`).then((res) => {
        const data = JSON.stringify(res.data);
        const element = document.createElement("a");
        element.setAttribute(
          "href",
          "data:text/plain;charset=utf-8," +
          encodeURIComponent(
            data
              .replaceAll('","', "\n")
              .replaceAll('","', "\n")
              .replaceAll('"', "")
              .replaceAll("},", "}" + "\n")
              .replaceAll(",{", "\n" + "{")
              .replaceAll("[", "")
              .replaceAll("]", "")
          )
        );
        element.setAttribute("download", "filename.txt");
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      });
    },
    reset() {
      this.keyword = "";
      this.page = 1;
      this.limit = 0;
      this.count = 0;
      this.optionStatus = [
        { text: "Todas as situações", value: "" },
        { text: "Averbar", value: "9" },
        { text: "Ativo", value: "10" },
        { text: "Liquidado", value: "20" },
      ]
      this.optionStatusM = ""
      this.optionsBancosM = ""
      this.primeiro_vencimento = ""
      this.vencimento = ""
      this.loadContratos();
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
      this.loadContratos();
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