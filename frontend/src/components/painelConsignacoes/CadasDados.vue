<template>
  <div class="cadas-dados">
    <Loading v-if="loading" />
    <div class="mt-4">
      <b-card v-bind="cardAttrs" @contextmenu.prevent>
        <b-card-text>
          <b-row>
            <b-col class="md-8 sm-12">
              <p><b>Matricula:</b> {{ cadastro.matricula }}</p>
              <p><b>CPF:</b> {{ cadastro.cpfMasked }}</p>
              <b-input-group size="md" class="mb-1" v-if="mode == 'save'">
                <span for="input-valid" class="form-control">Celular:</span>
                <the-mask id="cadastro-celular" class="form-control" type="text" v-model="cadastro.celular"
                  :mask="['(##) #########']" placeholder="Informe o Celular do cliente"
                  :disabled="mode === 'remove' || mode === 'key'" />
                <b-input-group-append>
                  <b-button variant="outline-success" @click="saveCadastro">
                    <i class="fas fa-save"></i>
                  </b-button>
                </b-input-group-append>
              </b-input-group>
              <p v-else><b>Celular:</b> {{ this.celularCliente }} <b-button v-if="userParams.gestor >= 1 || (userParams.cad_servidores >= 3 && userParams.tipoUsuario >= 2)"
                  @click="mode = 'save'" size="sm" variant="outline-primary"><i class="fa fa-pencil"></i></b-button>
              </p>
              <p>
                <b>Nascimento:</b> {{ setDataPt(cadastro.nascimento_d) }} ({{
                    idade
                }}
                anos)
              </p>
              <p>
                <b>Admissão:</b> {{ setDataPt(cadastro.d_admissao) }}
                {{
                    t_servico > 0
                      ? `(${t_servico} ano${t_servico > 1 ? "s" : ""})`
                      : ""
                }}
              </p>
              <p v-if="[1, 4, 5, 6, 9].includes(Number(cadastro.id_vinculo))">
                <b>Margem Consignável Disponível:</b>
                <span v-if="!isNaN(financeiro.limiteMargem)">
                  {{ formatter.format(financeiro.limiteMargem) }}
                </span>
                <span v-else>
                  <b-spinner small type="grow"></b-spinner> ... Calculando
                </span>
              </p>
              <p>
                <b>Dados Referentes à Folha:</b>
                {{ `${financeiro.maxFolha.mes}/${financeiro.maxFolha.ano}` }}
              </p>
              <p>
                <b>Vinculo Funcional:</b>
                {{ `${cadastro.id_vinculo ? cadastro.vinculo : 'Não Declarado'}` }}
              </p>
              <p>
                <b>Conveniado Pagador:</b>
                {{ `${titleCase(userParams.cliente)} ${titleCase(userParams.dominio)}` }}
              </p>
            </b-col>
            <b-col class="md-4 sm-12">
              <Printings v-if="
                [1, 4, 5, 6, 9].includes(Number(cadastro.id_vinculo)) ||
                userParams.gestor >= 1
              " ref="Printings" :userParams="userParams" :cadastros="cadastros" :getFull="true" />
            </b-col>
          </b-row>
        </b-card-text>
      </b-card>
    </div>
  </div>
</template>

<script>
import moment from "moment";
import { mapState } from "vuex";
import { isMobile } from "mobile-device-detect";
import { isNumber } from "@/config/globalFacilities";
import axios from "axios";
import { capitalizeFirst, titleCase } from "@/config/globalFacilities";
import { baseApiUrl } from "@/env";
import Loading from "@/components/template/Loading";
import { showError } from "@/global";
import Printings from "@/components/painelServidores/Printings";
import StringMask from "string-mask";
import { TheMask } from "vue-the-mask";

export default {
  name: "CadasDados",
  props: ["userParams", "cadastros", "financeiro"],
  components: { Loading, Printings, TheMask },
  data: function () {
    return {
      titleCase: titleCase,
      isNumber: isNumber,
      loading: false,
      cadastro: {},
      formatter: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      celularCliente: "",
      margemCash: 0,
      idade: "0",
      t_servico: "0",
      photoSrc: require(`@/assets/imgs/semFoto.jpg`),
      cardAttrs: {
        "img-alt": "Imagem servidor",
        "border-variant": "info",
        class: "mb-3 center-cropped",
      },
      mode: "",
      optionYears: [],
      optionMonths: [],
      optionComplementaries: [],
      reportParams: {},
      downloadACopy: false,
      fileSrc: undefined,
    };
  },
  methods: {
    loadCadastro() {
      this.loading = !this.loading;
      this.cadastro = this.cadastros;
      if (this.cadastro.foto64)
        try {
          this.photoSrc = "data:image/jpg;base64," + this.cadastro.foto64;
        } catch (error) {
          this.photoSrc = require(`@/assets/imgs/semFoto.jpg`);
        }
      else this.photoSrc = require(`@/assets/imgs/semFoto.jpg`);
      if (this.cadastro.celular) {
        var formatter = new StringMask("(##) #####.####");
        this.celularCliente = formatter.apply(this.cadastro.celular);
      }
      this.setCardMobileAttr();
      this.idade = moment().diff(
        moment(this.cadastro.nascimento_d, "DD/MM/YYYY"),
        "years"
      );
      this.t_servico = moment().diff(
        moment(this.cadastro.d_admissao, "DD/MM/YYYY"),
        "years"
      );
      this.loading = !this.loading;
    },
    saveCadastro() {
      this.cadastro = { ...this.cadastro, origin: 'consignatario' }
      axios.put(`${baseApiUrl}/cadastros/${this.cadastro.cpf}/${this.cadastro.matricula}`, this.cadastro)
        .then(() => {
          this.$toasted.global.defaultSuccess();
          if (this.cadastro.celular) {
            var formatter = new StringMask("(##) #####.####");
            this.celularCliente = formatter.apply(this.cadastro.celular);
          }
          this.mode = 'view'
        })
        .catch(showError);
    },
    getAsset() {
      const body = {
        root: `images/${this.userParams.cliente}/${this.userParams.dominio}`,
        asset: this.cadastro.matricula,
        extension: "jpg",
      };
      axios
        .post(`${baseApiUrl}/asset`, body)
        .then((src) => {
          this.photoSrc = "data:image/jpg;base64," + src.data;
        })
        .catch(() => {
          this.photoSrc = require(`@/assets/imgs/semFoto.jpg`);
        });
    },
    setDataPt(data) {
      return moment(data, "DD/MM/YYYY").format("DD/MM/YYYY");
    },
    setCardMobileAttr() {
      if (isMobile)
        this.cardAttrs = {
          ...this.cardAttrs,
          "img-src": this.photoSrc,
          "img-top": "img-top",
        };
      else
        this.cardAttrs = {
          ...this.cardAttrs,
          "img-src": this.photoSrc,
          "img-left": "img-left",
        };
      this.cardAttrs = {
        ...this.cardAttrs,
        "img-src": this.photoSrc,
        title: `Cliente: ${this.cadastro.nome} ${this.userParams.admin >= 1 ? ` (${this.cadastro.id})` : ""
          }`,
      };
    },
    getYearParams(id_cad_servidores) {
      this.optionYears = [];
      const url = `${baseApiUrl}/fin-params/f/ano?id_cad_servidores=${id_cad_servidores}`;
      axios.get(url).then((res) => {
        this.optionYears = res.data.data.map((data) => {
          return { value: data.field, text: data.field };
        });
      });
    },
    getMonthParams(ano, id_cad_servidores) {
      this.optionMonths = [];
      const url = `${baseApiUrl}/fin-params/f/mes?ano=${ano}&id_cad_servidores=${id_cad_servidores}`;
      axios.get(url).then((res) => {
        this.optionMonths = res.data.data.map((data) => {
          return { value: data.field, text: data.field };
        });
      });
    },
    getComplementaryParams(ano, mes, id_cad_servidores) {
      this.optionComplementaries = [];
      const url = `${baseApiUrl}/fin-params/f/complementar?ano=${ano}&mes=${mes}&id_cad_servidores=${id_cad_servidores}`;
      axios.get(url).then((res) => {
        this.optionComplementaries = res.data.data.map((data) => {
          return { value: data.field, text: data.field };
        });
        if (this.optionComplementaries.length >= 1)
          this.reportParams.complementar = this.optionComplementaries[0].value;
      });
    },
    loadUserParams() {
      this.reportParams.ano = this.userParams.f_ano;
      this.reportParams.mes = this.userParams.f_mes;
      this.reportParams.complementar = this.userParams.f_complementar;
      this.getYearParams(this.cadastro.id);
      this.getMonthParams(this.reportParams.ano, this.cadastro.id);
      this.getComplementaryParams(
        this.reportParams.ano,
        this.reportParams.mes,
        this.cadastro.id
      );
    },
    printCCheque() {
      this.spendTime = undefined;
      const starts = moment(new Date(), "HH:mm:ss");
      const complementar = this.reportParams.complementar;
      const complementarTitle =
        complementar != "000" ? ` - Complementar: ${complementar}` : "";
      moment.locale("pt-br");
      let mesFolha = "";
      if (this.reportParams.mes <= 12)
        mesFolha = capitalizeFirst(
          moment({
            year: this.reportParams.ano,
            month: this.reportParams.mes - 1,
          }).format("MMMM/YYYY")
        );
      else
        mesFolha = `13o de ${moment({ year: this.reportParams.ano }).format(
          "YYYY"
        )}`;
      const defaultTitle = `Demonstrativo de Pagamento de Salário de ${mesFolha}${complementarTitle}`;
      let groups = "";
      if (this.pageBreak) groups = `${this.pageBreak}, `;
      let centrosFilter = "IS NOT NULL";
      let departamentosFilter = "IS NOT NULL";
      let cargosFilter = "IS NOT NULL";
      const body = {
        ano: this.reportParams.ano,
        mes: this.reportParams.mes,
        complementar: complementar,
        titulo: defaultTitle,
        id_cad_servidores: `ff.id_cad_servidores = ${this.cadastro.id}`,
        id_cad_centros: `ff.id_cad_centros ${centrosFilter}`,
        id_cad_departamentos: `ff.id_cad_departamentos ${departamentosFilter}`,
        id_cad_cargos: `ff.id_cad_cargos ${cargosFilter}`,
        id_cad_locais_trabalho: `ff.id_cad_locais_trabalho IS NOT NULL`,
        resumo: "1",
        geral: "1",
        agrupar: this.pageBreak ? "1" : "0",
        grupo: this.pageBreak ? this.pageBreak : "",
        resumirGrupo: this.pageBreak ? "1" : "0",
        groupBy: `${groups}cs.nome, cs.matricula`,
        orderBy: `${groups}cs.nome, cs.matricula`,
        encoding: "base64",
        exportType: "pdf",
      };
      this.loading = !this.loading;
      this.title = defaultTitle;
      const url = `${baseApiUrl}/relatorios/f-a/cch`;
      this.fileSrc = undefined;
      axios
        .post(url, body)
        .then((res) => {
          this.fileSrc = res.data;
          if (this.downloadACopy)
            this.downloadPDF(
              res.data,
              defaultTitle.replaceAll(" ", "_").replace("_-_", "_")
            );
          let pdfWindow = window.open("");
          pdfWindow.document.write(
            `<iframe width='100%' height='100%' src='data:application/pdf;base64, 
            ${encodeURI(this.fileSrc)} '></iframe>`
          );
          this.loading = !this.loading;
          const ends = moment(new Date(), "HH:mm:ss");
          const spended = moment.duration(ends.diff(starts))._data;
          if (spended.minutes >= 2)
            this.spendTime = `${spended.minutes}:${spended.minutes.seconds
              .toString()
              .padStart(2, "0")} minutos`;
          else if (spended.minutes >= 1)
            this.spendTime = `${spended.minutes}:${spended.minutes.seconds
              .toString()
              .padStart(2, "0")} minuto`;
          else if (spended.seconds <= 1) this.spendTime = `menos de 1 segundo`;
          else
            this.spendTime = `${spended.seconds
              .toString()
              .padStart(2, "0")} segundos`;
        })
        .catch(showError);
    },
    downloadPDF(pdf, fileName) {
      const linkSource = `data:application/pdf;base64,${pdf}`;
      const downloadLink = document.createElement("a");
      downloadLink.href = linkSource;
      downloadLink.download = fileName;
      downloadLink.click();
    },
  },
  mounted() {
    this.loadCadastro();
    this.loadUserParams();
  },
  computed: mapState(["user"]),
};
</script>

<style>

</style>