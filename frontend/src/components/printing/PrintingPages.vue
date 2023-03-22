<template>
  <div class="printing-pages">
    <PageTitle
      icon="fa fa-print"
      main="Impressões do Sistema"
      sub="Relatórios, guias de pagamento & Cia"
    />
    <div class="printing-pages-tabs overflow-auto">
      <b-form>
        <b-overlay
          :show="loading"
          rounded="sm"
          @shown="onShown"
          @hidden="onHidden"
        >
          <b-card>
            <b-row>
              <b-col
                ><h4>Selecione no menu abaixo o documento desejado</h4></b-col
              >
            </b-row>
            <b-row class="mb-1">
              <b-col md="12">
                <b-button-group>
                  <b-dropdown right text="Folha de pagamento">
                    <b-dropdown-item
                      @click="repSelector('gfo', 'Folha de Pagamento')"
                    >
                      Folha
                    </b-dropdown-item>
                    <b-dropdown-item
                      @click="repSelector('cch', 'Contracheque(s)')"
                    >
                      Contracheque
                    </b-dropdown-item>
                  </b-dropdown>
                  <b-dropdown right text="Informação Previdênciária">
                    <b-dropdown-item
                      disabled
                      @click="repSelector('rpp', 'Resumo RPPS')"
                      >Resumo RPPS</b-dropdown-item
                    >
                    <b-dropdown-item
                      disabled
                      @click="repSelector('rpp13', 'Resumo RPPS 13º Anual')"
                      >Resumo RPPS 13º Anual</b-dropdown-item
                    >
                    <b-dropdown-divider></b-dropdown-divider>
                    <b-dropdown-item
                      disabled
                      @click="repSelector('rpg', 'Resumo INSS')"
                      >Resumo INSS</b-dropdown-item
                    >
                    <b-dropdown-item
                      disabled
                      @click="repSelector('rpg13', 'Resumo INSS 13º Anual')"
                      >Resumo INSS 13º Anual</b-dropdown-item
                    >
                    <b-dropdown-divider></b-dropdown-divider>
                    <b-dropdown-item
                      disabled
                      @click="repSelector('gpg', 'Guia INSS')"
                      >Guia INSS</b-dropdown-item
                    >
                    <b-dropdown-item
                      disabled
                      @click="repSelector('gpg13', 'Guia INSS 13º Anual')"
                      >Guia INSS 13º Anual</b-dropdown-item
                    >
                    <b-dropdown-divider></b-dropdown-divider>
                    <b-dropdown-item
                      disabled
                      @click="repSelector('gpga', 'Guia INSS - Avulsa')"
                      >Guia INSS - Avulsa</b-dropdown-item
                    >
                  </b-dropdown>
                </b-button-group>
              </b-col>
            </b-row>
            <b-row>
              <b-col md="6">
                <b-form-group
                  label="Período do relatório ( Ano || Mês || Folha complementar )"
                  label-for="reportParams-pageBreak"
                >
                  <b-input-group>
                    <b-form-select
                      id="reportParams-ano"
                      :options="optionYears"
                      v-model="reportParams.ano"
                      @change="getMonthParams(reportParams.ano)"
                    />
                    <b-form-select
                      id="reportParams-mes"
                      :options="optionMonths"
                      v-model="reportParams.mes"
                      @change="
                        getComplementaryParams(
                          reportParams.ano,
                          reportParams.mes
                        )
                      "
                    />
                    <b-form-select
                      v-if="optionComplementaries.length > 1"
                      id="reportParams-complementar"
                      :options="optionComplementaries"
                      v-model="reportParams.complementar"
                    />
                    <span v-else class="form-control">{{
                      reportParams.complementar
                    }}</span>
                  </b-input-group>
                </b-form-group>
              </b-col>
              <b-col md="6">
                <b-form-group
                  class="float-right"
                  label="Quebra de páginas no relatório"
                  label-for="reportParams-pageBreak"
                >
                  <b-form-radio-group
                    id="reportParams-pageBreak"
                    v-model="pageBreak"
                    :options="optionsPageBreak"
                    name="reportParams-pageBreak"
                    buttons
                    button-variant="outline-primary"
                  ></b-form-radio-group>
                </b-form-group>
              </b-col>
            </b-row>
            <b-row>
              <b-col md="6">
                <b-form-group label="Filtrar por Centros de Custos">
                  <FormTagSearch
                    @loadInput="chargeTagCentros"
                    ref="selCentros"
                    :value="valueCentros"
                    :options="listCentros"
                    :placeholder="`Escolha alguma opção ou todas serão selecionados...`"
                  />
                </b-form-group>
              </b-col>
              <b-col md="6">
                <b-form-group label="Filtrar por Departamentos">
                  <FormTagSearch
                    @loadInput="chargeTagDepartamentos"
                    ref="selDepartamentos"
                    :value="valueDepartamentos"
                    :options="listDepartamentos"
                    :placeholder="`Escolha alguma opção ou todas serão selecionados...`"
                  />
                </b-form-group>
              </b-col>
              <b-col md="6">
                <b-form-radio-group
                  id="reportParams-inCentrosCusto"
                  v-model="optionInCentrosCusto"
                  :options="optionsInNotIn"
                  name="reportParams-inCentrosCusto"
                  buttons
                  button-variant="outline-success"
                  class="mb-4 form-control block"
                  style="padding: 0px"
                ></b-form-radio-group>
              </b-col>
              <b-col md="6">
                <b-form-radio-group
                  id="reportParams-inDepartamentos"
                  v-model="optionInDepartamentos"
                  :options="optionsInNotIn"
                  name="reportParams-inDepartamentos"
                  buttons
                  button-variant="outline-success"
                  class="mb-4 form-control block"
                  style="padding: 0px"
                ></b-form-radio-group>
              </b-col>
              <b-col md="6">
                <b-form-group label="Filtrar por Servidores">
                  <FormTagSearch
                    @loadInput="chargeTagServidores"
                    ref="selServidores"
                    :value="valueServidores"
                    :options="listServidores"
                    :placeholder="`Escolha alguma opção ou todas serão selecionados...`"
                  />
                </b-form-group>
              </b-col>
              <b-col md="6">
                <b-form-group label="Filtrar por Cargos">
                  <FormTagSearch
                    @loadInput="chargeTagCargos"
                    ref="selCargos"
                    :value="valueCargos"
                    :options="listCargos"
                    :placeholder="`Escolha alguma opção ou todas serão selecionados...`"
                  />
                </b-form-group>
              </b-col>
              <b-col md="6">
                <b-form-radio-group
                  id="reportParams-inServidores"
                  v-model="optionInServidores"
                  :options="optionsInNotIn"
                  name="reportParams-inServidores"
                  buttons
                  button-variant="outline-success"
                  class="mb-4 form-control block"
                  style="padding: 0px"
                ></b-form-radio-group>
              </b-col>
              <b-col md="6">
                <b-form-radio-group
                  id="reportParams-inCargos"
                  v-model="optionInCargos"
                  :options="optionsInNotIn"
                  name="reportParams-inCargos"
                  buttons
                  button-variant="outline-success"
                  class="mb-4 form-control block"
                  style="padding: 0px"
                ></b-form-radio-group>
              </b-col>
            </b-row>
            <b-row>
              <b-col class="md-5">
                <b-button-group class="mt-1 mb-1">
                  <!-- :disabled="!repSelection" -->
                  <b-button
                    ref="reportGen"
                    @click="print(repSelection)"
                    :variant="`${repSelection ? 'outline-success' : ''}`"
                    v-b-tooltip.hover
                    style="border-radius: 0.25rem"
                    :title="`${
                      repSelection
                        ? 'Clique para gerar o relatório'
                        : 'Primeiro selecione uma opção no menu acima'
                    }`"
                  >
                    Imprimir {{ repSelectionLabel }}
                  </b-button>
                  <b-form-checkbox
                    class="btn btn-outline-success ml-2"
                    v-model="downloadACopy"
                    v-if="repSelection"
                    name="check-button"
                    switch
                    style="border-radius: 0.25rem"
                    v-b-tooltip.hover
                    title="Ative para baixar uma cópia do relatório ao mesmo tempo que ele é gerado"
                  >
                    Baixar uma cópia em PDF
                  </b-form-checkbox>
                  <b-button
                    class="ml-2"
                    @click="reset"
                    v-if="repSelection"
                    variant="outline-danger"
                    v-b-tooltip.hover
                    title="Clique para reiniciar todos os filtros"
                    style="border-radius: 0.25rem"
                  >
                    Reiniciar
                  </b-button>
                </b-button-group>
              </b-col>
              <b-col class="md-7">
                <span v-if="spendTime" class="float-right" style="color: red">
                  Executado em {{ spendTime }}
                </span>
              </b-col>
            </b-row>
          </b-card>
          <template #overlay>
            <div class="text-center">
              <Loading />
              <p id="cancel-label">
                Você pode continuar esperando ou pode clicar abaixo e até sair
                da página. Só não pode fechar o navegador. Ok? &#128521;
              </p>
              <p id="cancel-label">
                O relatório será aberto em outra aba assim que estiver pronto
              </p>
              <b-button
                ref="cancel"
                variant="outline-danger"
                size="sm"
                aria-describedby="cancel-label"
                @click="loading = false"
              >
                Não quero esperar
              </b-button>
            </div>
          </template>
        </b-overlay>
      </b-form>
    </div>
  </div>
</template>

<script>
import PageTitle from "../template/PageTitle";
import { mapState } from "vuex";
import { showError } from "@/global";
import axios from "axios";
import { baseApiUrl } from "@/env";
import { capitalizeFirst } from "@/config/globalFacilities";
import moment from "moment";
// import pdf from "vue-pdf";
import FormTagSearch from "../template/FormTagSearch";
import Loading from "@/components/template/Loading";
import { optionsPageBreak, optionsInNotIn } from "@/config/lists";

export default {
  name: "AdminPages",
  components: { PageTitle, Loading, FormTagSearch }, //, pdf
  data: function () {
    return {
      repSelection: undefined,
      repSelectionLabel: undefined,
      downloadACopy: false,
      fileSrc: undefined,
      tabIndex: 0,
      title: "",
      loading: false,
      userParams: {},
      reportParams: {},
      pageBreak: undefined,
      optionInCentrosCusto: "in",
      optionInDepartamentos: "in",
      optionInServidores: "in",
      optionInCargos: "in",
      optionsPageBreak: optionsPageBreak,
      optionsInNotIn: optionsInNotIn,
      valueCentros: [],
      valueDepartamentos: [],
      valueServidores: [],
      valueCargos: [],
      listCentros: [],
      centros: [],
      centrosSel: [],
      listDepartamentos: [],
      departamentos: [],
      departamentosSel: [],
      listServidores: [],
      servidores: [],
      servidoresSel: [],
      listCargos: [],
      cargos: [],
      cargosSel: [],
      optionYears: [],
      optionMonths: [],
      optionComplementaries: [],
      spendTime: undefined,
      // src: "",
      // loadedRatio: 0,
      // page: 1,
      // numPages: 0,
      // rotate: 0,
    };
  },
  methods: {
    onShown() {
      if (this.$refs.cancel) this.$refs.cancel.focus();
    },
    onHidden() {
      if (this.$refs.reportGen) this.$refs.reportGen.focus();
    },
    getListaCentros() {
      const url = `${baseApiUrl}/cad-centros`;
      axios
        .patch(url)
        .then((res) => {
          this.listCentros = res.data.data.map((data) => {
            this.centros.push({
              value: data.id,
              text: `${data.cod_centro.toString().padStart(4, "0")}-${
                data.nome_centro
              }`,
            });
            return `${data.cod_centro.toString().padStart(4, "0")}-${
              data.nome_centro
            }`;
          });
        })
        .catch((err) => {
          showError(err);
        });
    },
    getListaServidores() {
      const url = `${baseApiUrl}/cadastros`;
      axios
        .patch(url)
        .then((res) => {
          this.listServidores = res.data.data.map((data) => {
            this.servidores.push({
              value: data.id,
              text: `${data.matricula.toString().padStart(8, "0")}-${
                data.nome
              }`,
            });
            return `${data.matricula.toString().padStart(8, "0")}-${data.nome}`;
          });
        })
        .catch((err) => {
          showError(err);
        });
    },
    getListaDepartamentos() {
      const url = `${baseApiUrl}/cad-departamentos`;
      axios
        .patch(url)
        .then((res) => {
          this.listDepartamentos = res.data.data.map((data) => {
            this.departamentos.push({
              value: data.id,
              text: `${data.id_departamento.toString().padStart(4, "0")}-${
                data.departamento
              }`,
            });
            return `${data.id_departamento.toString().padStart(4, "0")}-${
              data.departamento
            }`;
          });
        })
        .catch((err) => {
          showError(err);
        });
    },
    getListaCargos() {
      const url = `${baseApiUrl}/cad-cargos`;
      axios
        .patch(url)
        .then((res) => {
          this.listCargos = res.data.data.map((data) => {
            this.cargos.push({
              value: data.id,
              text: `${data.id_cargo.toString().padStart(4, "0")}-${
                data.nome
              } (${data.cbo})`,
            });
            return `${data.id_cargo.toString().padStart(4, "0")}-${
              data.nome
            } (${data.cbo})`;
          });
        })
        .catch((err) => {
          showError(err);
        });
    },
    chargeTagCentros(arr) {
      this.centrosSel = [];
      this.centros.forEach((arr1) => {
        arr.forEach((arr2) => {
          if (arr2 == arr1.text) this.centrosSel.push(arr1.value);
        });
      });
    },
    chargeTagDepartamentos(arr) {
      this.departamentosSel = [];
      this.departamentos.forEach((arr1) => {
        arr.forEach((arr2) => {
          if (arr2 == arr1.text) this.departamentosSel.push(arr1.value);
        });
      });
    },
    chargeTagServidores(arr) {
      this.servidoresSel = [];
      this.servidores.forEach((arr1) => {
        arr.forEach((arr2) => {
          if (arr2 == arr1.text) this.servidoresSel.push(arr1.value);
        });
      });
    },
    chargeTagCargos(arr) {
      this.cargosSel = [];
      this.cargos.forEach((arr1) => {
        arr.forEach((arr2) => {
          if (arr2 == arr1.text) this.cargosSel.push(arr1.value);
        });
      });
    },
    print(option) {
      switch (option) {
        case "gfo":
          this.printFolha();
          break;
        case "cch":
          this.printCCheque();
          break;
        default:
          showError("Nenhuma opção de impressão foi selecionada no menu!");
          break;
      }
    },
    printFolha() {
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
      const defaultTitle = `Relatorio Geral da Folha de Pagamento ${mesFolha}${complementarTitle}`;
      let groups = "";
      if (this.pageBreak) groups = `${this.pageBreak}, `;
      let centrosFilter = "IS NOT NULL";
      if (this.centrosSel.length > 0) {
        centrosFilter = `${
          this.optionInCentrosCusto
        }(${this.centrosSel.toString()})`;
      }
      let departamentosFilter = "IS NOT NULL";
      if (this.departamentosSel.length > 0) {
        departamentosFilter = `${
          this.optionInDepartamentos
        }(${this.departamentosSel.toString()})`;
      }
      let servidoresFilter = "IS NOT NULL";
      if (this.servidoresSel.length > 0) {
        servidoresFilter = `${
          this.optionInServidores
        }(${this.servidoresSel.toString()})`;
      }
      let cargosFilter = "IS NOT NULL";
      if (this.cargosSel.length > 0) {
        cargosFilter = `${this.optionInCargos}(${this.cargosSel.toString()})`;
      }
      const body = {
        ano: this.reportParams.ano,
        mes: this.reportParams.mes,
        complementar: complementar,
        titulo: `Relatorio Geral da Folha de Pagamento ${mesFolha}${complementarTitle}`,
        id_cad_servidores: `ff.id_cad_servidores ${servidoresFilter}`,
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
      const url = `${baseApiUrl}/relatorios/f-a/${this.repSelection}`;
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
          else
            this.spendTime = `${spended.seconds
              .toString()
              .padStart(2, "0")} segundos`;
        })
        .catch(showError);
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
      if (this.centrosSel.length > 0) {
        centrosFilter = `${
          this.optionInCentrosCusto
        }(${this.centrosSel.toString()})`;
      }
      let departamentosFilter = "IS NOT NULL";
      if (this.departamentosSel.length > 0) {
        departamentosFilter = `${
          this.optionInDepartamentos
        }(${this.departamentosSel.toString()})`;
      }
      let servidoresFilter = "IS NOT NULL";
      if (this.servidoresSel.length > 0) {
        servidoresFilter = `${
          this.optionInServidores
        }(${this.servidoresSel.toString()})`;
      }
      let cargosFilter = "IS NOT NULL";
      if (this.cargosSel.length > 0) {
        cargosFilter = `${this.optionInCargos}(${this.cargosSel.toString()})`;
      }
      const body = {
        ano: this.reportParams.ano,
        mes: this.reportParams.mes,
        complementar: complementar,
        titulo: defaultTitle,
        id_cad_servidores: `ff.id_cad_servidores ${servidoresFilter}`,
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
      const url = `${baseApiUrl}/relatorios/f-a/${this.repSelection}`;
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
          else if (spended.seconds <= 1)
            this.spendTime = `menos de 1 segundo`;
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
    password: function (updatePassword /*, reason*/) {
      updatePassword(prompt('password is "test"'));
    },
    error: function (err) {
      showError(err);
    },
    loadUserParams() {
      const url = `${baseApiUrl}/users/${this.user.id}`;
      axios.get(url).then((res) => {
        this.userParams = res.data;
        this.reportParams.ano = this.userParams.f_ano;
        this.reportParams.mes = this.userParams.f_mes;
        this.reportParams.complementar = this.userParams.f_complementar;
        this.getYearParams();
        this.getMonthParams(this.reportParams.ano);
        this.getComplementaryParams(
          this.reportParams.ano,
          this.reportParams.mes
        );
      });
    },
    repSelector(selection, label) {
      this.repSelection = selection;
      this.repSelectionLabel = label;
    },
    reset() {
      this.spendTime = undefined;
      this.repSelection = undefined;
      this.repSelectionLabel = undefined;
      this.repSelector(this.repSelection, this.repSelectionLabel);
      this.reportParams.ano = this.userParams.f_ano;
      this.getMonthParams(this.reportParams.ano);
      this.reportParams.mes = this.userParams.f_mes;
      this.getComplementaryParams(this.reportParams.ano, this.reportParams.mes);
      this.reportParams.complementar = this.userParams.f_complementar;
      this.optionInCentrosCusto = "in";
      this.optionInDepartamentos = "in";
      this.optionInServidores = "in";
      this.optionInCargos = "in";
      this.$refs.selCentros.reset();
      this.$refs.selCargos.reset();
      this.$refs.selDepartamentos.reset();
      this.$refs.selServidores.reset();
      this.pageBreak = undefined;
      this.downloadACopy = false;
      this.valueCentros = [];
      this.centros = [];
      this.centrosSel = [];
      this.valueDepartamentos = [];
      this.departamentos = [];
      this.departamentosSel = [];
      this.valueServidores = [];
      this.servidores = [];
      this.servidoresSel = [];
      this.valueCargos = [];
      this.cargos = [];
      this.cargosSel = [];
    },
    getYearParams() {
      this.optionYears = [];
      const url = `${baseApiUrl}/fin-params/f/ano`;
      axios.get(url).then((res) => {
        this.optionYears = res.data.data.map((data) => {
          return { value: data.field, text: data.field };
        });
      });
    },
    getMonthParams(ano) {
      this.optionMonths = [];
      const url = `${baseApiUrl}/fin-params/f/mes?ano=${ano}`;
      axios.get(url).then((res) => {
        this.optionMonths = res.data.data.map((data) => {
          return { value: data.field, text: data.field };
        });
      });
    },
    getComplementaryParams(ano, mes) {
      this.optionComplementaries = [];
      const url = `${baseApiUrl}/fin-params/f/complementar?ano=${ano}&mes=${mes}`;
      axios.get(url).then((res) => {
        this.optionComplementaries = res.data.data.map((data) => {
          return { value: data.field, text: data.field };
        });
        if (this.optionComplementaries.length >= 1)
          this.reportParams.complementar = this.optionComplementaries[0].value;
      });
    },
  },
  mounted() {
    this.loadUserParams();
    this.getListaServidores();
    this.getListaCargos();
    this.getListaCentros();
    this.getListaDepartamentos();
  },
  computed: mapState(["user"]),
};
</script>

<style scoped>
/* @import "@vue-select/src/scss/vue-select.scss"; */
@import "https://unpkg.com/vue-select@latest/dist/vue-select.css";
</style>
