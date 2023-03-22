<template>
  <div class="cons-liquidations">
    <b-form :hidden="form_input_hide">
      <b-overlay :show="loading" rounded="sm" @shown="onShown" @hidden="onHidden">
        <input id="contrato-id" type="hidden" v-model="contrato.id" />
        <h2>
          Utilize este formulário para inserir um lote de liquidações conforme o
          leiaute abaixo
        </h2>
        <b-row>
          <b-col md="6" sm="4">
            <b-form-group label="Consignatário(banco)" label-for="contrato-id_consignatario">
              <b-form-select id="contrato-id_consignatario" :options="optionConsigs" v-model="contrato.id_consignatario"
                :disabled="mode != 'save'" v-if="mode === 'save'" placeholder="Informe o consignatário..." />
              <h4 v-else class="form-control input-disabled">
                {{ `${contrato.id_evento} - ${contrato.evento_nome}` }}
              </h4>
            </b-form-group>
          </b-col>
          <b-col md="6" sm="4">
            <b-form-group label="Confirme: Ano, Mês e Complementar(Folha de desconto)"
              label-for="contrato-id_consignatario">
              <b-input-group>
                <b-form-select class="input-group-flex-15" id="contrato-folha_ano" :options="optionYears"
                  @change="getMonthParams" v-model="contrato.folha_ano" v-if="optionYears.length > 1" />
                <b-form-select class="input-group-flex-10" id="contrato-folha_mes" :options="optionMonths"
                  @change="getComplementaryParams" v-model="contrato.folha_mes" v-if="optionMonths.length > 1" />
                <span v-else class="form-control singlePayroll input-group-flex-10">{{ userParams.f_mes }}</span>
                <b-form-select class="input-group-flex-10" id="contrato-folha_complementar"
                  :options="optionComplementaries" v-model="contrato.folha_complementar"
                  v-if="optionComplementaries.length > 1" />
                <span v-else class="form-control singlePayroll input-group-flex-10">{{ contrato.folha_complementar
                }}</span>
              </b-input-group>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-form-group label="Lote de liquidações de convenentes" label-for="contrato-liquidacoes">
              <h5 class="bold">
                !!! Importante: Não informar cabeçalhos de colunas
              </h5>
              <h6>
                Seq;Prz Total;Prz Reman;Contrato;Nº Prest;Nome;CPF;Valor
                Prest;Valor a Pagar;Situação de Desconto;Mês/Ano de vencimento(MM/AAAA)
              </h6>
              <b-form-textarea id="contrato-liquidacoes" v-model="contrato.liquidacoes"
                placeholder="Cole aqui as linhas contendo os dados conforme o leiaute acima e as colunas separadas por ';'(ponto e vírgula)."
                rows="10"></b-form-textarea>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-progress :max="lines" v-if="
              lines > 0 &&
              progressLine > 0 &&
              progressLine <= lines &&
              !loading
            " height="2rem" striped animated variant="success" class="mt-2">
              <b-progress-bar :value="progressLine" :label="`${progressLine} de ${lines} - ${(
                (progressLine / lines) *
                100
              ).toFixed(2)}%`"></b-progress-bar>
            </b-progress>
            <h3 v-else-if="!loading">
              Por favor aguarde. Atualizando os últimos detalhes...
            </h3>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <div id="actions" v-show="!form_input_hide" class="mb-3 mt-2">
              <b-button variant="success" v-if="mode === 'save'" @click="save('validar')" :class="`mr-2`"
                :disabled="executing">Validar</b-button>
              <b-button variant="primary" v-if="mode === 'save'" @click="save('executar')" :class="`mr-2`"
                :disabled="!isValid || executing">Salvar</b-button>
              <b-button variant="warning" @click="downloadFiles()" :class="`mr-2`" :disabled="loading">Baixar Arquivo
                MGFolha</b-button>
              <b-button variant="outline-danger" v-if="mode === 'remove'" @click="remove" :class="`mr-2`"
                :disabled="executing">Excluir</b-button>
              <b-button @click="reset" :disabled="executing">{{
                lblCancelar
              }}</b-button>
            </div>
          </b-col>
        </b-row>
        <template #overlay>
          <div class="text-center">
            <Loading />
            <p id="cancel-label">
              Você pode continuar esperando ou pode clicar abaixo e até sair da
              página. Só não pode fechar o navegador. Ok? &#128521;
            </p>
            <p id="cancel-label">
              A importação ocorrerá mesmo que esta aba seja fechada
            </p>
            <b-progress :max="lines" v-if="lines > 0 && progressLine > 0 && progressLine <= lines" height="2rem" striped
              animated variant="success" class="mb-2">
              <b-progress-bar :value="progressLine" :label="`${progressLine} de ${lines} - ${(
                (progressLine / lines) *
                100
              ).toFixed(2)}%`"></b-progress-bar>
            </b-progress>
            <h3 v-else>
              Por favor aguarde. Atualizando os últimos detalhes...
            </h3>
            <b-button ref="cancel" variant="outline-danger" size="sm" aria-describedby="cancel-label"
              @click="loading = false">
              Não quero esperar
            </b-button>
          </div>
        </template>
      </b-overlay>
    </b-form>
    <b-card no-body>
      <div class="cadas-grid">
        <b-input-group size="md" class="mb-1">
          <b-button :disabled="!form_input_hide" variant="outline-primary" size="sm" slot="prepend" @click="newBatch"
            v-if="userParams.admin >= 1"><i class="fa fa-plus"></i>&nbsp;
            <span>Inserir lote de liquidações</span>
          </b-button>
          <b-form-input type="text"
            placeholder="Digite aqui: folha(MM/AAAA), contrato, nome ou CPF para localizar o(s) registro(s)..."
            title="Para CPF, utilize apenas números e para exercício preencha no formato MM/AAAA" v-b-tooltip.hover
            v-model="keyword" @input="loadContratos" ref="keyword" />
          <b-input-group-text slot="prepend"><i class="fa fa-search"></i></b-input-group-text>
          <b-input-group-text slot="append">
            <span class>{{ keyword_res }}&nbsp;</span>
            <b-btn :disabled="!keyword" variant="link" size="sm" @click="getRefresh" class="p-0">
              <i class="fa fa-remove"></i>
            </b-btn>
          </b-input-group-text>
        </b-input-group>
        <b-input-group class="mb-2">
          <b-form-checkbox-group v-model="optionStatusM" :options="optionStatus" name="optionStatus" buttons
            @input="loadContratos" button-variant="outline-primary" :state="optionStatusM.length >= 1">
          </b-form-checkbox-group>
          <b-form-select id="searchBar-bancos" :options="optionsBancos" v-model="optionsBancosM" @input="loadContratos" />
          <b-form-select id="searchBar-situacoes" :options="optionSituacoes" v-model="optionSituacoesM"
            @input="loadContratos" />
          <b-form-select id="searchBar-dominios" :options="optionDominios" v-model="optionDominiosM"
            @input="loadContratos" />
          <b-form-select id="searchBar-clientes" :options="optionClientes" v-model="optionClientesM"
            @input="loadContratos" />
          <b-button @click="reset"> Resetar </b-button>
        </b-input-group>
        <b-table hover striped responsive :items="contratos" :fields="fields">
          <template v-slot:cell(folha_mes)="data">
            {{ `${data.item.folha_mes}/${data.item.folha_ano}` }}
          </template>
          <template v-slot:cell(contrato)="data">
            {{ `${data.item.febraban}: ${data.item.contrato}(${data.item.id})` }}
          </template>
          <template v-slot:cell(nome)="data">
            <span
              :title="`${data.item.cliente ? data.item.cliente.toUpperCase() : ''}${data.item.cliente && data.item.dominio ? ' ' + data.item.dominio.toUpperCase() : ''}`">{{
                `${data.item.nome} ${data.item.id_cad_servidores ? `(${data.item.id_cad_servidores})` : ''}` }}</span>
          </template>
          <template v-slot:cell(cpf)="data">
            {{ `${data.item.cpf}` }}
          </template>
          <template v-slot:cell(v_prestacao)="data">
            {{ `R$ ${valueFormater(data.item.v_prestacao)}` }}
          </template>
          <template v-slot:cell(prestacao)="row">
            {{ `${row.item.prestacao}/${row.item.prz_total}` }}
          </template>
          <template v-slot:cell(situacao)="row">
            {{ `${getLabel(situationsCEF, row.item.situacao)}` }}
          </template>
          <template #cell(actions)="row">
            <b-button variant="outline-info" size="sm" @click="row.toggleDetails" class="mr-1" v-b-tooltip.hover.left
              title="Editar registro">
              <!-- @click="item(row.item, row.index, $event.target)" -->
              <i :class="`fa fa-${userParams.admin < 1 ? 'eye' : 'pencil'}`"></i>
            </b-button>
          </template>
          <template #row-details="row">
            <b-card>
              <ConLiquidationData :item="row.item" @reload="loadContratos" />
            </b-card>
          </template>
        </b-table>
        <!-- <b-modal
          :id="itemModal.id"
          :title="itemModal.title"
          @hide="resetItemModal"
          size="xl"
          hide-footer
        >
          <ConLiquidationData :item="itemModal.content" />
        </b-modal> -->
        <b-pagination size="md" v-model="page" :total-rows="count" :per-page="limit" />
      </div>
    </b-card>
  </div>
</template>
<script>
import { mapState } from "vuex";
import axios from "axios";
import { showError } from "@/global";
import { baseApiUrl } from "@/env";
import { getDecimalFormater } from "@/config/globalFacilities";
import Loading from "@/components/template/Loading";
import ConLiquidationData from "./ConLiquidationData";

export default {
  name: "ConLiquidationsData",
  components: { Loading, ConLiquidationData },
  data: function () {
    return {
      userParams: {},
      itemModal: {
        id: "item-modal",
        title: "",
        content: "",
      },
      optionStatus: [
        { text: "Pendentes", value: "0" },
        { text: "Importados", value: "10" },
        { text: "Liquidados", value: "20" },
      ],
      optionStatusM: ["0", "10", "20"],
      loading: false,
      title: "",
      form_input_hide: true,
      mode: "save",
      isValid: false,
      executing: false,
      keyword: "",
      keyword_res: "",
      lines: 0,
      progressLine: 0,
      contratos: [], // table
      contrato: {}, // field
      lblCancelar: "Cancelar",
      valueFormater: getDecimalFormater,
      optionConsigs: [],
      optionSituacoes: [],
      optionSituacoesM: "-1",
      optionDominios: [],
      optionDominiosM: "-1",
      optionClientes: [],
      optionClientesM: "",
      optionYears: [],
      optionMonths: [],
      optionComplementaries: [],
      busy: false,
      processing: false,
      counter: 1,
      operEspecial: "",
      max: 20,
      interval: null,
      formatter: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      lang: {
        formatLocale: {
          firstDayOfWeek: 0,
        },
        monthBeforeYear: true,
      },
      optionsBancos: [
        { value: "", text: "Todos os bancos" },
        { value: "001", text: "001-Brasil" },
        { value: "104", text: "104-Caixa" },
        { value: "237", text: "237-Bradesco" },
      ],
      optionsBancosM: "",
      situationsCEF: [
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
        { key: "folha_mes", label: "Folha", sortable: true },
        {
          key: "folha_ano", label: "Ano", sortable: true,
          tdClass: "d-none",
          thClass: "d-none",
        },
        // { key: "id_consignatario", label: "Banco", sortable: true },
        { key: "contrato", label: "Contrato", sortable: true },
        {
          key: "febraban", label: "Banco", sortable: true,
          thClass: "valor-field-center d-none",
          tdClass: "valor-field-center d-none",
        },
        { key: "nome", label: "Servidor", sortable: true },
        { key: "cpf", label: "CPF", sortable: true },
        {
          key: "prestacao",
          label: "Parcela",
          sortable: true,
          tdClass: "valor-field-center",
        },
        {
          key: "v_prestacao",
          label: "Valor parcela",
          sortable: true,
          tdClass: "valor-field-right",
        },
        { key: "situacao", label: "Situação", sortable: true },
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
    // toggleAllStatus(checked) {
    //   this.optionStatus = checked ? this.flavours.slice() : [];
    // },
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
      const url = `${baseApiUrl}/con-liquidacoes?page=${this.page}&key=${this.keyword}&optionsBancos=${this.optionsBancosM}&optionStatus=${this.optionStatusM}&optionSituacoes=${this.optionSituacoesM}&dominio=${this.optionDominiosM}&cliente=${this.optionClientesM}`;
      axios.get(url).then((res) => {
        this.contratos = res.data.data;
        this.count = res.data.count;
        this.limit = res.data.limit;
        const pluralize = this.count > 1 ? "s" : "";
        this.keyword_res = `${this.count} resultado${pluralize}`;
      });
    },
    newBatch() {
      this.form_input_hide = false;
      this.getYearParams();
      this.getMonthParams();
      this.getComplementaryParams();
      this.getConsignees();
    },
    getYearParams() {
      this.optionYears = [];
      const url = `${baseApiUrl}/fin-params/f/ano`;
      axios.get(url).then((res) => {
        this.optionYears = res.data.data.map((data) => {
          return { value: data.field, text: data.field };
        });
        this.contrato.folha_ano = this.userParams.f_ano;
      });
    },
    getMonthParams() {
      this.optionMonths = [];
      const url = `${baseApiUrl}/fin-params/f/mes?ano=${this.contrato.folha_ano}`;
      axios.get(url).then((res) => {
        this.optionMonths = res.data.data.map((data) => {
          return { value: data.field, text: data.field };
        });
        this.contrato.folha_mes = this.userParams.f_mes;
      });
    },
    getComplementaryParams() {
      this.optionComplementaries = [];
      const url = `${baseApiUrl}/fin-params/f/complementar?ano=${this.contrato.folha_ano}&mes=${this.contrato.folha_mes}`;
      axios.get(url).then((res) => {
        this.optionComplementaries = res.data.data.map((data) => {
          return { value: data.field, text: data.field };
        });
        this.contrato.folha_complementar = this.userParams.f_complementar;
      });
    },
    getConsignees() {
      this.optionConsigs = [];
      const url = `${baseApiUrl}/consignatarios/f/gcgn`;
      axios.get(url).then((res) => {
        this.optionConsigs = res.data.data.map((data) => {
          return { value: data.id, text: data.nome + ": " + data.agencia };
        });
      });
    },
    getSituacoes() {
      this.optionSituacoes = [];
      const url = `${baseApiUrl}/con-liquidacoes/f/gbf?field=situacao`;
      axios.get(url).then((res) => {
        const situacoes = res.data.data.map((data) => {
          let nome;
          this.situationsCEF.forEach((element) => {
            if (data.situacao == element.value) nome = element.text;
          });
          return { value: data.situacao, text: nome };
        });
        this.optionSituacoes = [{ value: -1, text: "Todas situações" }];
        situacoes.forEach((element) => {
          this.optionSituacoes.push(element);
        });
      });
    },
    getDominios() {
      this.optionDominios = [];
      const url = `${baseApiUrl}/con-liquidacoes/f/gbf?field=dominio`;
      axios.get(url).then((res) => {
        const dominios = res.data.data.map((data) => {
          const dominio = data.dominio || "*";
          const label = data.dominio || "Faltando domínio";
          return { value: dominio, text: label };
        });
        this.optionDominios = [{ value: "-1", text: "Todos os domínios" }];
        dominios.forEach((element) => {
          this.optionDominios.push(element);
        });
      });
    },
    getClientes() {
      if (this.userParams.multiCliente >= 2) {
        this.optionClientes = [];
        const url = `${baseApiUrl}/con-liquidacoes/f/gbf?field=cliente`;
        axios.get(url).then((res) => {
          const clientes = res.data.data.map((data) => {
            return { value: data.cliente, text: data.cliente };
          });
          this.optionClientes = [{ value: "", text: "Todos os clientes" }];
          clientes.forEach((element) => {
            this.optionClientes.push(element);
          });
        });
      } else {
        this.optionClientes = [{ value: "", text: "Selecione" }, { value: this.userParams.cliente, text: this.userParams.cliente }];
      }
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
          console.log(err);
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
    getBarStatus() {
      const url = `${baseApiUrl}/con-liquidacoes/f/gPndd?id_consignatario=${this.contrato.id_consignatario}`;
      axios
        .get(url)
        .then((res) => {
          if (res.data > 0) this.progressLine = res.data;
        })
        .catch((err) => {
          showError(err);
        });
    },
    onShown() {
      if (this.$refs.cancel) this.$refs.cancel.focus();
    },
    onHidden() { },
    remove() {
      const id = this.contrato.id;
      axios
        .delete(`${baseApiUrl}/contratos/${id}`)
        .then(() => {
          this.$toasted.global.defaultSuccess();
          this.loadContratos();
        })
        .catch(showError);
    },
    loadEventos(id_consignatario, id_con_eventos) {
      const url = `${baseApiUrl}/con-eventos/rubricas-consignatario/${id_consignatario}?id_cad_servidores=${this.cadastros.id}&id_con_eventos=${id_con_eventos}`;
      axios.get(url).then((res) => {
        this.optionEventos = res.data.data.map((data) => {
          const textLabel = `${data.id_evento} - ${data.evento_nome}`;
          return { value: data.id, text: textLabel };
        });
      });
    },
    getRefresh() {
      this.keyword = "";
      this.page = 1;
      this.loadContratos();
    },
    reset() {
      this.keyword = "";
      this.mode = "save";
      this.page = 1;
      this.limit = 0;
      this.count = 0;
      this.progressLine = 0;
      this.contrato = {};
      this.form_input_hide = true;
      this.getRefresh();
      this.optionStatusM = ["0", "10", "20"];
      this.optionSituacoesM = "-1";
      this.optionDominiosM = "-1";
      this.optionClientesM = "";
      this.optionsBancosM = "";
      this.getSituacoes();
      this.getDominios();
      this.getClientes();
    },
    loadUserParams() {
      const url = `${baseApiUrl}/users/${this.user.id}`;
      axios.get(url).then((res) => {
        this.userParams = res.data;
        this.userParams.domainCli = `${this.userParams.cliente}_${this.userParams.dominio}`;
        this.getYearParams();
        this.getMonthParams();
        this.getComplementaryParams();
        this.getDominios();
        this.getClientes();
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
    // stateStatusM() {
    //   return this.optionStatusM.length >= 1;
    // },
  },
  //{
  computed:
    // map() {
    // return mapState(["user"]);
    mapState(["user"]),
  // },
  // stateStatusM() {
  //   return this.optionStatusM.length >= 1;
  // },
  //}
};
</script>

<style scoped></style>