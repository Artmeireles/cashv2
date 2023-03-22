<template>
  <div class="cadas-contratos">
    <b-overlay :show="loading" rounded="sm" @shown="onShown" @hidden="onHidden">
      <div class="client-presentation" v-if="cadastros && cadastros.id">
        <h2>
          {{ `${((userParams.tipoUsuario == 1 || userParams.admin >= 1) || userParams.admin >= 1) ? `Cliente:
          ${cadastros.nome}${userParams.admin >= 1 ? ` (${cadastros.id})`
      :
      ""}` : ""}`
}}
          <b-button v-if="((userParams.tipoUsuario == 1 || userParams.admin >= 1) || userParams.admin >= 1)"
            :disabled="optionEventos.length == 0 || financeiro.limiteMargem <= 0.0" pill :variant="
  `outline-${optionEventos.length == 0 || financeiro.limiteMargem <= 0.0 ? 'danger' : 'success'}`" class="ml-2"
            v-b-tooltip.hover :title="
  optionEventos.length == 0 || financeiro.limiteMargem <= 0.0
    ? 'Não há eventos ou margem disponíveis'
    : 'Novo contrato'
" @click="novoContrato">
            <i class="fa fa-plus"></i>Novo contrato
          </b-button>
        </h2>
        <hr v-if="!form_input_hide" />
      </div>
      <b-form :hidden="form_input_hide">
        <input id="contrato-id" type="hidden" v-model="contrato.id" />
        <b-row>
          <b-col md="12" sm="12">
            <h4>Dados da Consignatária</h4>
            <h6 class="mb-2">
              Consignatário: {{ consignatario.agencia }} -
              {{ consignatario.banco }}
              {{
    userParams.admin >= 0
      ? `(${consignatario.id_consignatario})`
      : ""
}}
            </h6>
            <h6 class="mb-2" v-if="contrato && contrato.user && contrato.user.name">
              Usuário Consignatário: {{ contrato.user.name }}
            </h6>
            <h6 class="mb-2 strong">
              Quantidade mínima de quitações antes da renovação:
              {{ contrato.qmar }}
              <i v-if="contrato.parcelasQuitadas >= contrato.qmar" class="far fa-check-circle"
                style="color: #8acf99"></i>
            </h6>
            <hr class="mb-4" />
          </b-col>
        </b-row>
        <b-row>
          <b-col md="3" sm="12">
            <b-form-group :label="`Contrato:${userParams.admin >= 0 && contrato.id ? ` (${contrato.id})` : ''}`"
              label-for="parcela-valor_parcela">
              <b-input-group size="md" class="mb-1">
                <b-form-input id="contrato-contrato" type="text" @keydown="filterKey" v-model="contrato.contrato"
                  :disabled="!['save', 'editContract'].includes(mode)" placeholder="Informe o Número do Contrato..." />
                <b-input-group-append v-if="mode != 'save' && userParams.gestor >= 1">
                  <b-button variant="outline-primary" @click="mode = 'editContract'"
                    v-if="!['save', 'editContract'].includes(mode)">
                    <i class="fa fa-pencil"></i>
                  </b-button>
                  <b-button variant="outline-success" @click="save" v-if="mode == 'editContract'">
                    <i class="fas fa-save"></i>
                  </b-button>
                </b-input-group-append>
              </b-input-group>
            </b-form-group>
          </b-col>
          <b-col md="3" sm="12">
            <b-form-group label="1º Desconto do Servidor em: (MM/AAAA)" label-for="contrato-p_vencimento">
              <vue-monthly-picker v-model="contrato.primeiro_vencimento" dateFormat="MM/YYYY" :monthLabels="monthLabels"
                v-if="mode == 'save'">
              </vue-monthly-picker>
              <span v-else class="form-control disabled text-center">{{ lblPrimeiroVcto }}</span>
            </b-form-group>
          </b-col>
          <b-col md="3" sm="12">
            <b-form-group :label="`Valor Parcela:${this.userParams.tipoUsuario != 0
  ? ' (Max ' + formatter.format(financeiro.limiteMargem) + ')'
  : ''
  }`" label-for="contrato-valor_parcela">
              <b-input-group prepend="R$">
                <money id="contrato-valor_parcela" type="text" v-model="contrato.valor_parcela" :class="`valor-field-right form-control ${contrato.valor_parcela > financeiro.limiteMargem &&
  userParams.tipoUsuario != '0' &&
  (!contrato.status ||
    (contrato && contrato.status && contrato.status == 9))
  ? 'is-invalid'
  : ''
  }`" :disabled="mode != 'save'" />
              </b-input-group>
            </b-form-group>
          </b-col>
          <b-col md="3" sm="12">
            <b-row>
              <b-col :md="contrato.parcelasQuitadas > 0 ? 7 : 12" sm="12">
                <b-form-group :label="`Parcelas:${this.userParams.tipoUsuario != 0
  ? ' (Max ' + consignatario.qmp + ')'
  : ''
  }`" label-for="contrato-parcelas">
                  <b-form-input id="contrato-parcelas" type="number" v-model="contrato.parcelas"
                    :disabled="mode != 'save'" min="1" :max="consignatario.qmp" />
                </b-form-group>
              </b-col>
              <b-col md="5" sm="12" v-if="contrato.parcelasQuitadas > 0">
                <b-form-group label="Quitações:" label-for="contrato-parcelas-quitadas">
                  <h4 class="form-control valor-field-center input-disabled">
                    {{ contrato.parcelasQuitadas }}
                  </h4>
                </b-form-group>
              </b-col>
            </b-row>
          </b-col>
          <b-col :md="!contrato.data_liquidacao ? 3 : 2" sm="12">
            <b-form-group label="Valor Total:" label-for="contrato-valor_total">
              <b-input-group prepend="R$">
                <money id="contrato-valor_total" type="text" v-model="contrato.valor_total" :disabled="mode != 'save'"
                  class="valor-field-right form-control" />
              </b-input-group>
            </b-form-group>
          </b-col>
          <b-col :md="!contrato.data_liquidacao ? 3 : 2" sm="12">
            <b-form-group label="Valor Liquido:" label-for="contrato-valor_liquido">
              <b-input-group prepend="R$">
                <money id="contrato-valor_liquido" type="text" v-model="contrato.valor_liquido"
                  :disabled="mode != 'save'" class="valor-field-right form-control" />
              </b-input-group>
            </b-form-group>
          </b-col>
          <b-col md="3" sm="12" v-if="contrato.data_averbacao">
            <b-form-group label="Averbação:" label-for="contrato-data_averbacao">
              <h4 class="form-control valor-field-center input-disabled">
                {{ contrato.data_averbacao }}
              </h4>
            </b-form-group>
          </b-col>
          <b-col md="3" sm="12" v-if="contrato.data_averbacao">
            <b-form-group label="Meio:" label-for="contrato-averbado_online">
              <h4 class="form-control valor-field-center input-disabled">
                {{ getLabel(meioAverbacao, contrato.averbado_online) }}
              </h4>
            </b-form-group>
          </b-col>
          <b-col md="2" v-if="contrato.data_liquidacao" sm="12">
            <b-form-group label="Liquidação:" label-for="contrato-data_liquidacao">
              <h4 class="form-control valor-field-right input-disabled">
                {{ contrato.data_liquidacao }}
              </h4>
            </b-form-group>
          </b-col>
        </b-row>
        <div id="actions" v-show="!form_input_hide" class="mb-4">
          <b-button variant="primary" v-if="mode == 'save'" @click="save" class="mr-2">Salvar
          </b-button>
          <b-button variant="outline-danger" v-if="mode === 'remove'" @click="remove" class="mr-2">Excluir</b-button>
          <b-button @click="reset">{{ lblCancelar }}</b-button>
          <!-- Botão de liquidação -->
          <b-button :variant="`outline-${contrato.parcelasQuitadas >= contrato.qmar ? 'success' : 'danger'
  }`" v-if="
  contrato.status == 10 &&
  ((userParams.tipoUsuario == 1 || userParams.admin >= 1) || userParams.admin >= 1) &&
  contrato.data_averbacao &&
  contrato.averbado_online >= 0
" class="ml-2" @click="onSubmit('liquidar')" :disabled="busy || !(contrato.parcelasQuitadas >= contrato.qmar)"
            href="#dialogConfirm">Liquidar o contrato
          </b-button>
          <!-- Botão de renovação -->
          <b-button :variant="`outline-${contrato.parcelasQuitadas >= contrato.qmar ? 'success' : 'danger'
  }`" v-if="
  contrato.status == 10 &&
  ((userParams.tipoUsuario == 1 || userParams.admin >= 1) || userParams.admin >= 1) &&
  contrato.data_averbacao &&
  contrato.averbado_online >= 0
" class="ml-2" @click="onSubmit('renovar')" :disabled="busy || !(contrato.parcelasQuitadas >= contrato.qmar)"
            href="#dialogConfirm">Renovar o contrato
          </b-button>
          <!-- Botão de averbação online -->
          <b-button variant="outline-success" v-if="contrato.status == 9 && mode != 'remove'" class="ml-2"
            @click="onSubmit('averbar')" href="#dialogConfirm">Averbar Consignado</b-button>
          <!-- :disabled="!['0', '1'].includes(userParams.tipoUsuario.toString())" -->
          <b-button variant="outline-success" v-if="
  ((userParams.tipoUsuario == 1 || userParams.admin >= 1) || userParams.admin >= 1) &&
  contrato.status == 9 &&
  !contrato.data_averbacao &&
  mode != 'remove'
" class="ml-2" @click="viewContract(contrato)" :disabled="busy"><i class="fas fa-print"></i> Imprimir
            averbação</b-button>
          <b-button variant="outline-success" v-if="userParams.admin >= 2" class="ml-2"
            @click="viewContractJS(contrato)" :disabled="busy"><i class="fas fa-print"></i> Imprimir averbação (DEV)
          </b-button>
          <b-overlay :show="busy" no-wrap @shown="onShown" @hidden="onHidden">
            <template #overlay>
              <div v-if="processing" class="text-center p-4 bg-primary text-light rounded">
                <b-icon icon="cloud-upload" name="cloud1" font-scale="4"></b-icon>
                <div class="mb-3">{{ lblProcessando }}...</div>
                <b-progress min="1" :max="max" :value="counter" variant="success" height="3px" class="mx-n4 rounded-0">
                </b-progress>
              </div>
              <div v-else ref="dialog" id="dialogConfirm" tabindex="-1" role="dialog" aria-modal="false"
                aria-labelledby="form-confirm-label" class="text-center p-3">
                <p>
                  <strong id="form-confirm-label">Confirma a operação?</strong>
                </p>
                <div class="d-flex">
                  <b-button variant="outline-danger" class="mr-3" @click="onCancel">
                    Cancelar
                  </b-button>
                  <b-button v-if="
  operEspecial == 'averbar' &&
  contrato.status == 9 &&
  mode != 'remove'
" variant="outline-success" @click="getKeyPass" class="mr-3">Averbar Consignado</b-button>
                  <b-button v-if="
  operEspecial == 'liquidar' && ((userParams.tipoUsuario == 1 || userParams.admin >= 1) || userParams.admin >= 1)
" variant="outline-success" @click="finish" class="mr-3">Liquidar</b-button>
                  <b-button v-if="
  operEspecial == 'renovar' && ((userParams.tipoUsuario == 1 || userParams.admin >= 1) || userParams.admin >= 1)
" variant="outline-success" @click="renew">Renovar</b-button>
                </div>
              </div>
            </template>
          </b-overlay>
        </div>
      </b-form>
      <b-card no-body>
        <div class="cadas-grid">
          <b-table hover striped responsive :items="contratos" :fields="fields" foot-clone>
            <template v-slot:cell(status_label)="data">
              {{ `${data.item.status_label}` }}
            </template>
            <template v-slot:cell(banco)="data">
              {{ `${data.item.banco}` }}
            </template>
            <template v-slot:cell(id_con_eventos)="data">
              {{ `${data.item.id_evento} - ${data.item.evento_nome}` }}
            </template>
            <template v-slot:cell(valor_liquido)="data">
              {{ `R$ ${valueFormater(data.item.valor_liquido)}` }}
            </template>
            <template v-slot:cell(valor_parcela)="data">
              {{ `R$ ${valueFormater(data.item.valor_parcela)}` }}
            </template>
            <template v-slot:cell(parcelas)="row">
              {{ `${row.item.parcelas}` }}
            </template>
            <template #foot(status_label)>
              <span class="text-danger">{{
    `${count > 0 ? count : "Sem"} resultado${pluralize}`
}}</span>
            </template>
            <template v-slot:cell(actions)="row">
              <b-button :variant="`outline-${userParams.tipoUsuario >= '1' &&
  !(
    row.item.data_averbacao != null ||
    row.item.data_liquidacao != null
  )
  ? 'warning'
  : 'info'
  }`" size="sm" @click="
  loadContrato(
    row.item,
    userParams.tipoUsuario >= '1' ? 'save' : ''
  )
" class="mr-1" v-b-tooltip.hover :title="`${userParams.tipoUsuario >= '1' &&
  !(
    row.item.data_averbacao != null ||
    row.item.data_liquidacao != null
  )
  ? 'Editar'
  : 'Ver'
  } registro`" href="#cadas-panel">
                <i :class="`fa fa-${userParams.tipoUsuario >= '1' &&
  !(
    row.item.data_averbacao != null ||
    row.item.data_liquidacao != null
  )
  ? 'pencil'
  : 'eye'
  }`"></i>
              </b-button>
              <b-button v-if="
  userParams.tipoUsuario >= '1' &&
  row.item.status != '20' &&
  row.item.data_averbacao != null
" variant="outline-info" size="sm" @click="viewContract(row.item)" class="mr-1" v-b-tooltip.hover title="Detalhes">
                <i class="fa fa-print"></i>
              </b-button>
              <b-button v-if="
  userParams.tipoUsuario >= '1' &&
  !(
    row.item.data_averbacao != null ||
    row.item.data_liquidacao != null
  )
" variant="outline-danger" size="sm" @click="loadContrato(row.item, 'remove')" v-b-tooltip.hover
                title="Remover registro" href="#cadas-panel">
                <i class="fa fa-trash"></i>
              </b-button>
            </template>
          </b-table>
          <b-pagination size="md" v-model="page" :total-rows="count" :per-page="limit" />
        </div>
      </b-card>
      <div>
        <b-modal size="xl" class="modal" id="modalForm" ref="modalForm" hide-footer centered :title="title">
          <b-button @click="$refs.myPdfComponent.print()" variant="outline-success" size="lg" v-b-tooltip.hover
            title="Clique para imprimir"><i class="fas fa-print"></i> Imprimir</b-button>
          <pdf ref="myPdfComponent" :src="fileUrl"></pdf>
        </b-modal>
      </div>
      <template #overlay>
        <div class="text-center">
          <Loading />
        </div>
      </template>
    </b-overlay>
  </div>
</template>
<script>
import { mapState } from "vuex";
import axios from "axios";
import { dbPrefix, showError } from "@/global";
import { baseApiUrl } from "@/env";
import {
  getDecimalFormater,
  datePickerLocale,
} from "@/config/globalFacilities";
import moment from "moment";
import pdf from "vue-pdf";
import Loading from "@/components/template/Loading";
import VueMonthlyPicker from 'vue-monthly-picker'

export default {
  name: "CadasContratos",
  props: ["userParams", "cadastros"],
  components: { pdf, Loading, VueMonthlyPicker },
  beforeDestroy() {
    this.clearInterval();
  },
  data: function () {
    return {
      fileUrl: undefined,
      financeiro: {},
      title: "",
      loading: false,
      form_input_hide: true,
      mode: "save",
      keyword: "",
      keyword_res: "",
      labelsDatePicker: datePickerLocale,
      lblPrimeiroVcto: "",
      monthLabels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      contratos: [], // table
      contrato: {}, // field
      somaContratos: 0,
      consignatario: {}, // field
      optionEventos: [],
      lblCancelar: "Cancelar",
      lblProcessando: "Liquidando",
      valueFormater: getDecimalFormater,
      busy: false,
      processing: false,
      counter: 1,
      pluralize: "",
      operEspecial: "",
      max: 20,
      interval: null,
      userKeyPass: undefined,
      formatter: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      meioAverbacao: [
        { value: "-1", text: "Selecione" },
        { value: "0", text: "On line" },
        { value: "1", text: "Presencial" },
      ],
      lang: {
        formatLocale: {
          firstDayOfWeek: 0,
        },
        monthBeforeYear: true,
      },
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
          key: "status_label",
          label: "Situação",
          sortable: true,
          tdClass: (type) => {
            //, key, item
            if (type == "Averbar") return "bg-warning text-white";
          },
        },
        { key: "banco", label: "Consignatário", sortable: true },
        // { key: "id_con_eventos", label: "Evento em folha", sortable: true },
        { key: "parcelas", label: "Parcelas", sortable: true, tdClass: "valor-field-center", thClass: "valor-field-center" },
        { key: "contrato", label: "Contrato", sortable: true },
        {
          key: "valor_parcela",
          label: "Valor parcela",
          sortable: true,
          tdClass: "valor-field-right",
        },
        {
          key: "valor_liquido",
          label: "Valor liquido",
          sortable: true,
          tdClass: "valor-field-right",
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
    getLabel(array, key) {
      const item = array.filter((it) => it.value == key);
      return item && item[0] && item[0].text ? item[0].text : "";
    },
    novoContrato(oldContrato = undefined) {
      this.mode = "save";
      this.loadConsignatario(this.userParams.consignatario);
      this.contrato = {
        id_consignatario: this.consignatario.id_consignatario,
        id_user: this.user.id,
        id_cad_servidores: this.cadastros.id,
        qmar: this.consignatario.qmar,
      };
      if (oldContrato) {
        this.contrato.contrato = oldContrato.contrato;
        this.contrato.id_con_eventos = oldContrato.id_con_eventos;
      }
      if (this.contrato && this.contrato.id)
        this.contrato.complementar = this.getParcelasQuitadas(this.contrato);
      this.contrato.parcelas = this.consignatario.qmp;
      this.loadEventos(this.userParams.consignatario, null);
      this.contrato.id_con_eventos = this.optionEventos[0].value;
      this.form_input_hide = false;
    },
    loadContratos() {
      this.loading = !this.loading;
      const consignatario =
        ((this.userParams.tipoUsuario == 1 || this.userParams.admin >= 1) || this.userParams.admin >= 1)
          ? `&idConsignatario=${this.userParams.consignatario}`
          : "";
      const url = `${baseApiUrl}/contratos-serv/${this.cadastros.id}?page=${this.page}&key=${this.keyword}&cpf=${this.user.cpf}${consignatario}`;
      axios.get(url).then((res) => {
        this.contratos = res.data.data;
        this.$emit("somaContratos", this.getSomaContratos());
        this.count = res.data.count;
        this.limit = res.data.limit;
        this.pluralize = this.count > 1 ? "s" : "";
        this.keyword_res = `${this.count} resultado${this.pluralize}`;
        this.loading = !this.loading;
      });
    },
    loadContrato(contrato, mode = "save") {
      this.loading = !this.loading;
      const url = `${baseApiUrl}/contratos/${contrato.id}`;
      axios.get(url).then((res) => {
        this.contrato = res.data.data;
        this.contrato.user = res.data.user;
        this.contrato.u_keypass = this.cadastros.password;
        this.contrato.id_cadas = this.cadastros.id_cadas;
        this.lblPrimeiroVcto = moment(contrato.primeiro_vencimento).format("MM/YYYY")
        if (this.contrato.id_consignatario)
          this.loadConsignatario(this.contrato.id);
        if (
          this.userParams.tipoUsuario == 0 ||
          this.contrato.data_averbacao != null ||
          this.contrato.data_liquidacao != null
        ) {
          this.lblCancelar = "Fechar";
          this.mode = null;
        } else {
          this.mode = mode;
          this.loadEventos(
            this.contrato.id_consignatario,
            this.contrato.id_con_eventos
          );
        }
        if (this.contrato.data_averbacao != null)
          this.contrato.data_averbacao = moment(
            this.contrato.data_averbacao
          ).format("DD-MM-YYYY");
        if (this.contrato.data_liquidacao != null)
          this.contrato.data_liquidacao = moment(
            this.contrato.data_liquidacao
          ).format("DD-MM-YYYY");
        this.getParcelasQuitadas(this.contrato);
        this.getMargem()
        this.form_input_hide = false;
        this.loading = !this.loading;
      });
    },
    getMargem() {
      this.loading = !this.loading;
      const body = { id_cad_servidores: this.cadastros.id };
      const url = `${baseApiUrl}/contratos/f-a/gmc`;
      axios.post(url, body).then((res) => {
        this.financeiro.limiteMargem = res.data.data;
        this.loading = !this.loading;
      });
    },
    viewContractJS(contrato) {
      this.viewContract(contrato);
    },
    viewContract(contrato) {
      this.loading = !this.loading;
      this.title = `Contrato de consignação ${contrato.contrato}`;
      const idConContratos = contrato.id;
      const fileName = contrato.contrato;
      const dbSchema = `${dbPrefix}_${this.userParams.cliente}_${this.userParams.dominio}`;
      const url = `${baseApiUrl}/contratos/f/gavb?idConContratos=${idConContratos}&dbSchema=${dbSchema}&fileName=${fileName}`;
      this.fileUrl = url;
      this.showModal();
      this.loading = !this.loading;
    },
    hideModal() {
      this.$refs.modalForm.hide();
    },
    showModal() {
      this.$refs.modalForm.show();
    },
    save() {
      const method = this.contrato.id ? "put" : "post";
      const id = this.contrato.id ? `/${this.contrato.id}` : "";
      this.contrato.primeiro_vencimento = moment(this.contrato.primeiro_vencimento).endOf('month').format('YYYY-MM-DD')
      axios[method](`${baseApiUrl}/contratos${id}`, this.contrato)
        .then((res) => {
          this.$toasted.global.defaultSuccess();
          // this.contrato = res.data;
          this.loadContrato(res.data);
          this.getRefresh();
        })
        .catch(showError);
    },
    averbation() {
      this.counter = 1;
      this.contrato.averbado_online = this.userParams.tipoUsuario;
      this.processing = true;
      this.contrato.data_averbacao = moment();
      this.contrato.status = 10;
      this.lblProcessando = "Confirmando";
      axios
        .put(`${baseApiUrl}/contratos/${this.contrato.id}`, this.contrato)
        .then((res) => {
          if (res.data.id) {
            const url = `${baseApiUrl}/con-parcelas/f-a/gpce?contrato=${res.data.id}`
            axios.post(url)
              .then((res) => {
                this.$toasted.global.defaultSuccess({ msg: res.data.data });
              })
              .catch(showError);
            this.$toasted.global.defaultSuccess();
            this.loadContrato(res.data);
            this.getRefresh();
            this.max = this.counter;
            this.clearInterval();
            this.interval = setInterval(() => {
              if (this.counter < this.max) {
                this.counter = this.counter + 1;
              } else {
                this.clearInterval();
                this.$nextTick(() => {
                  this.busy = this.processing = false;
                });
              }
            }, 250);
          }
        })
        .catch((res) => {
          this.contrato.averbado_online = undefined;
          this.contrato.data_averbacao = undefined;
          this.contrato.status = 9;
          this.onCancel();
          showError(res);
        });
    },
    async getKeyPass() {
      if (!this.userParams.averbaOnline) {
        if (this.cadastros && this.cadastros.cpf) {
          let cadastro = await axios.get(`${baseApiUrl}/users-cpf/${this.cadastros.cpf}`)
          this.contrato.id_cadas = cadastro.data.id_cadas
        }
        let retVal = undefined;
        if (!this.contrato.id_cadas) {
          showError(
            "O cliente ainda não tem perfil de usuário. Não é possível averbar!"
          );
          setTimeout(() => {
            showError("Por favor solicite ao cliente que crie seu perfil");
          }, 1000);
          this.clearInterval();
          this.$nextTick(() => {
            this.busy = this.processing = false;
          });
        }
        else {
          retVal = prompt(
            `Prezad${this.cadastros.sexo == "0" ? "o" : "a"} ${this.cadastros.nome
            }, para sua segurança confirme abaixo sua senha de usuári${this.cadastros.sexo == "0" ? "o" : "a"
            }`,
            "Digite aqui a sua senha:"
          );
          this.contrato.u_keypass = retVal;
          if (this.contrato.u_keypass) this.averbation();
          else showError("Senha do cliente não informada");
        }
      } else if (this.userParams.averbaOnline) {
        this.averbation();
      }
    },
    finish() {
      this.counter = 1;
      this.processing = true;
      this.contrato.status = 20;
      this.contrato.data_liquidacao = moment();
      this.lblProcessando = "Liquidando";
      axios
        .put(`${baseApiUrl}/contratos/${this.contrato.id}`, this.contrato)
        .then((res) => {
          this.$toasted.global.defaultSuccess();
          this.loadContrato(res.data);
          this.getRefresh();
          this.getMargem();
          this.max = this.counter;
        })
        .catch(showError);
      this.clearInterval();
      this.interval = setInterval(() => {
        if (this.counter < this.max) {
          this.counter = this.counter + 1;
        } else {
          this.clearInterval();
          this.$nextTick(() => {
            this.busy = this.processing = false;
          });
        }
      }, 350);
    },
    renew() {
      this.counter = 1;
      this.processing = true;
      const oldContrato = this.contrato;
      this.contrato.status = 20;
      this.contrato.data_liquidacao = moment();
      this.lblProcessando = "Liquidando e renovando";
      axios
        .put(`${baseApiUrl}/contratos/${this.contrato.id}`, this.contrato)
        .then(() => {
          this.$toasted.global.defaultSuccess();
          this.getRefresh();
          this.getMargem();
          this.max = this.counter;
          this.novoContrato(oldContrato);
        })
        .catch(showError);
      this.clearInterval();
      this.interval = setInterval(() => {
        if (this.counter < this.max) {
          this.counter = this.counter + 1;
        } else {
          this.clearInterval();
          this.$nextTick(() => {
            this.busy = this.processing = false;
          });
        }
      }, 350);
    },
    loadConsignatario(id) {
      const url = `${baseApiUrl}/consignatarios/${id}`;
      axios.get(url).then((res) => {
        this.consignatario = res.data.data;
      });
    },
    getSomaContratos() {
      const body = { id: this.cadastros.id };
      const url = `${baseApiUrl}/contratos/f/gsc`;
      axios.post(url, body).then((res) => {
        this.somaContratos = res.data.data.soma_parcelas;
      });
      return this.somaContratos;
    },
    getParcelasQuitadas(contrato) {
      const body = { id_con_contratos: contrato.id };
      const url = `${baseApiUrl}/contratos/f/gpq`;
      axios.post(url, body).then((res) => {
        this.parcelasQuitadas = res.data.data.parcelasQuitadas;
      });
      return this.parcelasQuitadas;
    },
    remove() {
      const id = this.contrato.id;
      const url = `${baseApiUrl}/contratos/${id}`
      axios
        .delete(url)
        .then(() => {
          this.$toasted.global.defaultSuccess();
          this.reset();
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
      this.pdfSrc = undefined;
      if (this.userParams.consignatario) {
        this.loadConsignatario(this.userParams.consignatario);
        this.loadEventos(
          this.userParams.consignatario,
          this.contrato.id_con_eventos ? this.contrato.id_con_eventos : null
        );
      }
      this.getSomaContratos();
    },
    reset() {
      this.keyword = "";
      this.page = 1;
      this.limit = 0;
      this.count = 0;
      this.contrato = {};
      this.form_input_hide = true;
      this.getRefresh();
    },
    clearInterval() {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    },
    onShown() {
      if (this.$refs.dialog) this.$refs.dialog.focus();
    },
    onHidden() {
      // this.$refs.submit.focus();
    },
    onSubmit(operEspecial) {
      this.operEspecial = operEspecial;
      this.processing = false;
      this.busy = true;
    },
    onCancel() {
      this.busy = false;
    },
    filterKey(e) {
      const key = e.key;
      if ([".", "-", "/", "+", ","].includes(key)) {
        showError("Digite apenas números");
        return e.preventDefault();
      }
    },
  },
  mounted() {
    this.loadContratos();
    setTimeout(() => {
      if (this.userParams.consignatario) {
        this.loadConsignatario(this.userParams.consignatario);
        this.loadEventos(this.userParams.consignatario, null);
      }
    }, 1000);
    this.getSomaContratos();
    this.getMargem()
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
.float-right {
  margin-top: 5px;
  padding: 1px;
  margin-left: 10px;
  margin-bottom: 15px;
}

.disabled {
  background: #e9ecef;
}

.modal {
  height: 95vh;
}

.modal-body {
  height: 100vh;
  /* overflow-y: auto; */
  overflow-y: scroll !important;
}

.client-presentation {
  padding: 3px;
}

.input-disabled {
  background-color: #e9ecef;
}

.strong {
  font-weight: bold;
}
</style>
