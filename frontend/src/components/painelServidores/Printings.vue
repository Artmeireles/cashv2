<template>
  <div class="cadas-printings">
    <div>
      <b-overlay :show="loading" rounded="sm">
        <b-form>
          <b-form-group
            v-if="optionClients.length > 1 && userParams.tipoUsuario == 0"
            label="Selecione abaixo a matrícula desejada"
            label-for="userClientParams"
          >
            <b-input-group>
              <b-form-select
                id="userClientParams"
                :options="optionClients"
                v-model="userClients"
                @change="saveUserClient"
              />
            </b-input-group>
          </b-form-group>
          <b-form-group
            label="Período desejado (Ano || Mês || Folha complementar)"
          >
            <b-input-group>
              <b-form-select
                id="reportParams-ano"
                :options="optionYears"
                v-model="reportParams.ano"
                @change="getMonthParams(reportParams.ano, cadastro.id)"
              />
              <b-form-select
                id="reportParams-mes"
                :options="optionMonths"
                v-model="reportParams.mes"
                @change="
                  getComplementaryParams(
                    reportParams.ano,
                    reportParams.mes,
                    cadastro.id
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
          <b-button-group>
            <b-button
              ref="reportGenCCheque"
              @click="printCCheque"
              variant="outline-success"
              v-b-tooltip.hover
              style="border-radius: 0.25rem"
              title="Clique para imprimir"
            >
              Imprimir Contracheque
            </b-button>
            <b-button
              v-if="!getFull"
              ref="reportGenFichaA"
              @click="printFichaA"
              variant="outline-success"
              v-b-tooltip.hover
              style="border-radius: 0.25rem"
              title="Clique para imprimir"
              class="ml-2"
            >
              Imprimir Ficha Analítica
            </b-button>
            <b-button
              v-if="!getFull"
              ref="reportGenFichaS"
              @click="printFichaS"
              variant="outline-success"
              v-b-tooltip.hover
              style="border-radius: 0.25rem"
              title="Clique para imprimir"
              class="ml-2"
            >
              Imprimir Ficha Sintética
            </b-button>
            <b-form-checkbox
              class="btn btn-outline-success ml-2"
              v-model="downloadACopy"
              name="check-button"
              switch
              style="border-radius: 0.25rem"
              v-b-tooltip.hover
              title="Ative para baixar uma cópia do relatório ao mesmo tempo que ele é gerado"
            >
              Baixar uma cópia em PDF
            </b-form-checkbox>
          </b-button-group>
        </b-form>
        <h5 class="text-center mt-3">
          Selecione acima o período desejado e se deseja ou não baixar uma cópia
          em PDF.<br />A seguir clique em <em>Imprimir</em
          >{{ `${!getFull ? " na opção desejada" : ""}` }}
        </h5>
        <b-button
          block
          @click="goFull"
          variant="outline-secondary"
          v-if="
            getFull &&
            userParams.tipoUsuario >= 2 &&
            userParams.cad_servidores >= 1
          "
        >
          Acessar os dados completos deste servidor</b-button
        >
        <b-row class="mt-4">
          <b-col class="md-6">
            <b-button
              block
              @click="confirmRecadastramento"
              variant="warning"
              v-if="
                !getFull &&
                userParams.tipoUsuario >= 2 &&
                userParams.cad_servidores >= 3
              "
              :disabled="
                !(userParams.tipoUsuario >= 2 && userParams.cad_servidores >= 3)
              "
            >
              Confirmar dados do servidor e imprimir Comprovante de Recadastro
            </b-button>
          </b-col>
          <b-col class="md-6">
            <b-button
              block
              v-if="!getFull"
              ref="reportGenFichaRecadastro"
              @click="printFichaRecadastro"
              variant="outline-success"
              v-b-tooltip.hover
              title="Clique para imprimir"
              :disabled="!(recadastro && recadastro.id)"
            >
              Imprimir Comprovante de Recadastro
            </b-button>
          </b-col>
        </b-row>
        <template #overlay>
          <div class="text-center">
            <Loading />
          </div>
        </template>
      </b-overlay>
    </div>
  </div>
</template>

<script>
import moment from "moment";
import { mapState } from "vuex";
import axios from "axios";
import { capitalizeFirst } from "@/config/globalFacilities";
import { baseApiUrl } from "@/env";
import Loading from "@/components/template/Loading";
import { showError } from "@/global";

export default {
  name: "CadasDados",
  props: ["userParams", "cadastros", "financeiro", "getFull"],
  components: { Loading },
  data: function () {
    return {
      cadastro: {},
      recadastro: {},
      optionClients: [],
      userClients: {},
      optionYears: [],
      optionMonths: [],
      optionComplementaries: [],
      reportParams: {},
      downloadACopy: false,
      fileSrc: undefined,
      loading: false,
    };
  },
  methods: {
    goFull() {
      let routeData = this.$router.resolve({
        path: `/cadastros/${this.cadastros.cpf}/${parseInt(
          this.cadastros.matricula
        )}`,
        query: {},
      });
      window.open(routeData.href, "_blank");
    },
    loadCadastro() {
      this.cadastro = this.cadastros;
    },
    loadRecadastro(id_cad_servidores) {
      const url = `${baseApiUrl}/cad-recadastro/${id_cad_servidores}`;
      axios
        .get(url)
        .then((res) => {
          this.recadastro = res.data.data;
        })
        .catch(showError);
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
      this.loadRecadastro(this.cadastro.id);
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
      const defaultTitle = `Demonstrativo de Pagamento de Salário de ${mesFolha}${complementarTitle} ${this.cadastro.matricula
        .toString()
        .padStart(8, "0")}`;
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
    printFichaA() {
      this.spendTime = undefined;
      moment.locale("pt-br");
      const starts = moment(new Date(), "HH:mm:ss");
      const defaultTitle = `Ficha Financeira Analítica ${this.cadastro.matricula
        .toString()
        .padStart(8, "0")}`;
      let groups = "";
      if (this.pageBreak) groups = `${this.pageBreak}, `;
      let centrosFilter = "IS NOT NULL";
      let departamentosFilter = "IS NOT NULL";
      let cargosFilter = "IS NOT NULL";
      const body = {
        ano: this.reportParams.ano,
        mes: this.reportParams.mes,
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
        groupBy: `${groups}ff.ano, ff.mes, ff.complementar, cs.nome, cs.matricula`,
        orderBy: `${groups}ff.ano, ff.mes, ff.complementar, cs.nome, cs.matricula`,
        encoding: "base64",
        exportType: "pdf",
      };
      this.loading = !this.loading;
      this.title = defaultTitle;
      const url = `${baseApiUrl}/relatorios/f-a/ffa`;
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
    printFichaS() {
      this.spendTime = undefined;
      moment.locale("pt-br");
      const starts = moment(new Date(), "HH:mm:ss");
      const defaultTitle = `Ficha Financeira Sintetica ${this.cadastro.matricula
        .toString()
        .padStart(8, "0")}`;
      let groups = "";
      if (this.pageBreak) groups = `${this.pageBreak}, `;
      let centrosFilter = "IS NOT NULL";
      let departamentosFilter = "IS NOT NULL";
      let cargosFilter = "IS NOT NULL";
      const body = {
        ano: this.reportParams.ano,
        mes: this.reportParams.mes,
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
        groupBy: `${groups}ff.ano, ff.mes, ff.complementar, cs.nome, cs.matricula`,
        orderBy: `${groups}ff.ano, ff.mes, ff.complementar, cs.nome, cs.matricula`,
        encoding: "base64",
        exportType: "pdf",
      };
      this.loading = !this.loading;
      this.title = defaultTitle;
      const url = `${baseApiUrl}/relatorios/f-a/ffs`;
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
    confirmRecadastramento() {
      this.$confirm({
        message: `Seu usuário e a data de hoje serão registrados como usuário recadastrador. Confirma?`,
        button: { no: "Não", yes: "Confirmo" },
        callback: (confirm) => {
          if (confirm) {
            const url = `${baseApiUrl}/cad-recadastro/${this.cadastro.id}`;
            axios
              .post(url, {})
              .then(() => {
                this.printFichaRecadastro();
                this.loadRecadastro(this.cadastro.id);
              })
              .catch(showError);
          }
        },
      });
    },
    printFichaRecadastro() {
      this.spendTime = undefined;
      moment.locale("pt-br");
      const starts = moment(new Date(), "HH:mm:ss");
      const defaultTitle = `Comprovante de Recadastramento ${this.cadastro.matricula
        .toString()
        .padStart(8, "0")}`;
      let groups = "";
      if (this.pageBreak) groups = `${this.pageBreak}, `;
      let centrosFilter = "IS NOT NULL";
      let departamentosFilter = "IS NOT NULL";
      let cargosFilter = "IS NOT NULL";
      const body = {
        ano: this.reportParams.ano,
        mes: this.reportParams.mes,
        complementar: this.reportParams.complementar,
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
        groupBy: `${groups}cs.id`,
        orderBy: `${groups}cs.nome, cs.matricula`,
        encoding: "base64",
        exportType: "pdf",
        matricula: this.cadastro.matricula.toString().padStart(8, "0"),
        id_cad_servidor: this.cadastro.id,
      };
      this.loading = !this.loading;
      this.title = defaultTitle;
      const url = `${baseApiUrl}/relatorios/f-a/frs`;
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
    saveUserClient() {
      const url = `${baseApiUrl}/users/${this.userParams.id}`;

      let userTo = this.userParams;
      userTo.id = this.userParams.id;
      userTo.id_cadas = this.userClients.split("_")[0];
      userTo.cliente = this.userClients.split("_")[1];
      userTo.dominio = this.userClients.split("_")[2];
      axios
        .put(url, userTo)
        .then(() => {
          this.$toasted.global.defaultSuccess({
            msg: "Parâmetro alterado com sucesso",
          });
          location.reload();
        })
        .catch((err) => {
          showError(err);
        });
    },
    loadUserClients() {
      const url = `${baseApiUrl}/users/locate-servidor-on-client`;
      const body = { cpf: this.userParams.cpf };
      axios.post(url, body).then((res) => {
        this.optionClients = res.data.data.map((data) => {
          return { value: data.value, text: `${data.text}` };
        });
      });
      this.userClients = `${this.userParams.id_cadas}_${this.userParams.cliente}_${this.userParams.dominio}`;
    },
  },
  mounted() {
    this.loadCadastro();
    this.loadUserParams();
    this.loadUserClients();
  },
  computed: mapState(["user"]),
};
</script>

<style>
</style>