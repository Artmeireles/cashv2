<template>
  <div class="contrato-liquidations">
    <b-form>
      <input type="hidden" v-model="contrato.id" />
      <input type="hidden" v-model="contrato.evento" />
      <input type="hidden" v-model="contrato.created_at" />
      <input type="hidden" v-model="contrato.updated_at" />
      <input type="hidden" v-model="contrato.id_consignatario" />
      <input type="hidden" v-model="contrato.cliente" />
      <input type="hidden" v-model="contrato.seq" />
      <input type="hidden" v-model="contrato.prestacao" />
      <input type="hidden" v-model="contrato.prz_total" />
      <input type="hidden" v-model="contrato.prz_reman" />
      <input type="hidden" v-model="contrato.contrato" />
      <input type="hidden" v-model="contrato.cpf" />
      <input type="hidden" v-model="contrato.nome" />
      <b-row>
        <b-col md="9" sm="12">
          <b-row>
            <b-col md="2" sm="6">
              <b-form-group label="Status da Parcela" label-for="contrato-status" class="">
                <b-form-select id="contrato-status" :options="statusLiquidation" v-model="contrato.status"
                  :disabled="userParams.admin < 1" />
                <!-- <span class="form-control text-center" name="contrato-status">{{
                    contrato.statusImp
                }}</span> -->
              </b-form-group>
            </b-col>
            <b-col md="2" sm="6">
              <b-form-group label="Cliente" label-for="contrato-cliente" class="">
                <span class="form-control text-center" name="contrato-cliente"
                  :style="`${userParams.admin < 1? 'background-color: #e9ecef' : ''}`">{{ contrato.clientName
                  }}</span>
              </b-form-group>
            </b-col>
            <b-col md="4" sm="6">
              <b-form-group label="Domínio" label-for="contrato-dominio">
                <b-form-select id="contrato-dominio" :options="dominios"
                  :disabled="userParams.admin < 1 || !dominios.length > 0 || this.contrato.status == '20'"
                  @change="reloadSelects" v-model="contrato.dominio" />
              </b-form-group>
            </b-col>
            <b-col md="2" sm="6">
              <b-form-group label="Ano da Folha" label-for="contrato-folha_ano">
                <b-form-select id="contrato-folha_ano" :options="optionYears"
                  :disabled="userParams.admin < 1 || !optionYears.length > 0 || this.contrato.status == '20'"
                  @change="loadMonths" v-model="contrato.folha_ano" />
              </b-form-group>
            </b-col>
            <b-col md="2" sm="6">
              <b-form-group label="Mes da Folha" label-for="contrato-folha_mes">
                <b-form-select id="contrato-folha_mes" :options="optionMonths"
                  :disabled="userParams.admin < 1 || !optionMonths.length > 0 || this.contrato.status == '20'"
                  v-model="contrato.folha_mes" />
              </b-form-group>
            </b-col>
            <b-col md="4" sm="6">
              <b-form-group label="Situação" label-for="contrato-situacao">
                <b-form-select id="contrato-situacao" :options="situationsCEF"
                  :disabled="userParams.admin < 1 || !situationsCEF.length > 0" v-model="contrato.situacao" />
                <!-- || this.contrato.status == '20'" -->
              </b-form-group>
            </b-col>
            <b-col md="8" sm="6">
              <b-form-group label="Cadastro e Matrícula do Servidor" label-for="contrato-id_cad_servidores">
                <b-form-select id="contrato-id_cad_servidores" :options="optionServidores" :disabled="
                  userParams.admin < 1 || !optionServidores.length > 0 ||
                  this.optionServidores.length <= 1
                " v-model="contrato.id_cad_servidores" />
              </b-form-group>
            </b-col>
            <b-col md="12" sm="12">
              <b-button variant="primary" v-if="mode === 'save'" @click="save" :disabled="userParams.admin < 1">
                Salvar
              </b-button>
              <b-button variant="warning" class="ml-2" @click="reset" :disabled="userParams.admin < 1">
                Resetar
              </b-button>
              <b-button class="ml-2" @click="$bvModal.hide('item-modal')" :disabled="userParams.admin < 1">
                Cancelar
              </b-button>
            </b-col>
          </b-row>
        </b-col>
        <b-col md="3" sm="12">
          <b-form-group label="Observacao" label-for="contrato-observacao">
            <b-form-textarea id="contrato-observacao" v-model="contrato.observacao" rows="7" max-rows="6"
              :disabled="userParams.admin < 1 || this.contrato.status == '20'" placeholder="Observacao..." />
          </b-form-group>
        </b-col>
      </b-row>
    </b-form>
  </div>
</template>

<script>
import { mapState } from "vuex";
import axios from "axios";
import { showError } from "@/global";
import { baseApiUrl } from "@/env";
import {
  capitalizeFirst,
  titleCase,
  getDecimalFormater,
} from "@/config/globalFacilities";

export default {
  name: "ConLiquidationData",
  props: ["item"],
  components: {},
  data: function () {
    return {
      itemModal: {
        id: "info-modal",
        title: "",
        content: "",
      },
      mode: "save",
      contrato: {},
      dominios: [],
      optionYears: [],
      optionMonths: [],
      optionServidores: [],
      lblCancelar: "Cancelar",
      valueFormater: getDecimalFormater,
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
      statusLiquidation: [
        { value: -1, text: "Selecione" },
        { value: 0, text: "Pendente" },
        { value: 10, text: "Importado" },
        { value: 20, text: "Liquidado" }
      ],
      userParams: {},
    };
  },
  methods: {
    getLabel(array, key) {
      const item = array.filter((it) => it.value == key);
      return item && item[0] && item[0].text ? item[0].text : "";
    },
    loadContrato(item) {
      this.contrato = item;
      const url = `${baseApiUrl}/con-liquidacoes/${item.id}`;
      axios.get(url).then((res) => {
        this.contrato = res.data.data;
        this.contrato.clientName = titleCase(this.contrato.cliente);
        switch (this.contrato.status) {
          case 10:
            this.contrato.statusImp = "Importado";
            break;
          case 20:
            this.contrato.statusImp = "Liquidado";
            break;
          default:
            this.contrato.statusImp = "Pendente";
            break;
        }
        this.loadDominios();
      });
    },
    loadDominios() {
      const param = {
        dominio: this.contrato.cliente,
        meta: "domainName",
        forceDominio: true,
      };
      axios.post(`${baseApiUrl}/params`, param).then((res) => {
        res.data.data.map((data) => {
          this.dominios.push({
            value: `${data.value}`,
            text: capitalizeFirst(data.label.replace("_", " ")),
          });
        });
      });
    },
    loadYears() {
      this.optionYears = [];
      const url = `${baseApiUrl}/fin-params/f/ano?dominio=${this.contrato.dominio}`;
      axios.get(url).then((res) => {
        this.optionYears = res.data.data.map((data) => {
          return { value: data.field, text: data.field };
        });
      });
    },
    loadMonths() {
      this.optionMonths = [];
      const url = `${baseApiUrl}/fin-params/f/mes?dominio=${this.contrato.dominio}&ano=${this.contrato.folha_ano}`;
      axios.get(url).then((res) => {
        this.optionMonths = res.data.data.map((data) => {
          return { value: data.field, text: data.field };
        });
      });
    },
    getServidoresByCpf() {
      const url = `${baseApiUrl}/cadastros-by-field/cpf/${this.contrato.cpf}?dominio=${this.contrato.dominio}`;
      axios
        .get(url)
        .then((res) => {
          if (res.data.data && res.data.data.length > 0)
            this.optionServidores = res.data.data.map((data) => {
              return {
                value: data.id,
                text: `${data.nome} (${data.matricula
                  .toString()
                  .padStart(8, "0")})`,
              };
            });
          else this.optionServidores = [];
          if (this.optionServidores.length == 1) {
            this.contrato.id_cad_servidores = this.optionServidores[0].value;
          } else if (this.optionServidores.length <= 1) {
            this.contrato.id_cad_servidores = null;
          }
        })
        .catch((err) => {
          showError(err);
        });
    },
    save() {
      const method = this.contrato.id ? "put" : "post";
      const id = this.contrato.id ? `/${this.contrato.id}` : "";
      axios[method](`${baseApiUrl}/con-liquidacoes${id}`, this.contrato)
        .then((res) => {
          this.$emit("reload");
          this.$toasted.global.defaultSuccess({ msg: res.data.data });
        })
        .catch((err) => {
          showError(err);
        });
    },
    reloadSelects() {
      this.contrato.id_cad_servidores = null;
      this.getServidoresByCpf()
    },
    reset() {
      this.loadContrato(this.item);
    },
    loadUserParams() {
      const url = `${baseApiUrl}/users/${this.user.id}`;
      axios.get(url).then((res) => {
        this.userParams = res.data;
        this.userParams.domainCli = `${this.userParams.cliente}_${this.userParams.dominio}`;
        this.loadYears();
        this.loadMonths();
      });
    },
  },
  mounted() {
    this.loadUserParams();
    this.loadContrato(this.item);
    this.getServidoresByCpf();
  },
  computed: mapState(["user"]),
};
</script>

<style>

</style>
