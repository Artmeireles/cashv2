<template>
  <div class="funcional-admin" id="funcional-admin">
    <b-form>
      <input id="funcional-id" type="hidden" v-model="funcional.id" />
      <input id="funcional-status" type="hidden" v-model="funcional.status" />
      <input id="funcional-dominio" type="hidden" v-model="funcional.dominio" />
      <input
        id="funcional-created_at"
        type="hidden"
        v-model="funcional.created_at"
      />
      <input
        id="funcional-updated_at"
        type="hidden"
        v-model="funcional.updated_at"
      />
      <input
        id="funcional-id_cad_servidores"
        type="hidden"
        v-model="funcional.id_cad_servidores"
      />
      <input id="funcional-evento" type="hidden" v-model="funcional.evento" />
      <input id="funcional-ano" type="hidden" v-model="funcional.ano" />
      <input id="funcional-mes" type="hidden" v-model="funcional.mes" />
      <input
        id="funcional-complementar"
        type="hidden"
        v-model="funcional.complementar"
      />
      <b-row>
        <b-col md="3" sm="6">
          <b-form-group
            label="Data de Admissao"
            label-for="funcional-d_admissao"
          >
            <!-- {{ funcional.id_cad_servidores }}-{{ funcional.id }} -->
            <b-form-datepicker
              id="funcional-d_admissao"
              right
              v-model="funcional.d_admissao"
              placeholder="Informe a Data..."
              required
              :readonly="!form_active || mode === 'remove'"
              locale="pt"
              v-bind="labelsDatePicker['pt'] || {}"
              :date-format-options="{
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
              }"
            />
          </b-form-group>
        </b-col>
        <b-col md="3" sm="6">
          <b-form-group
            label="Tipo de Vinculo"
            label-for="funcional-id_vinculo"
          >
            <b-form-select
              id="funcional-id_vinculo"
              :options="vinculosList"
              v-model="funcional.id_vinculo"
              required
              :disabled="!form_active || mode === 'remove'"
              placeholder="Informe o Vinculo..."
            />
          </b-form-group>
        </b-col>
        <b-col md="6" sm="6">
          <b-form-group
            :label="`Situacao Funcional${
              [2, 3].includes(Number(funcional.situacaofuncional))
                ? ': Tipo de Benefício e Data'
                : ''
            }`"
            label-for="funcional-situacao"
          >
            <b-input-group>
              <b-form-select
                id="funcional-situacao"
                :options="situationList"
                v-model="funcional.situacao"
                hidden
                required
                :disabled="!form_active || mode === 'remove'"
                placeholder="Informe o Situacao..."
              />
              <b-form-select
                id="funcional-situacaofuncional"
                :options="fSituationList"
                v-model="funcional.situacaofuncional"
                class="input-group-30"
                required
                :disabled="!form_active || mode === 'remove'"
                placeholder="Informe o Situacaofuncional..."
              />
              <b-form-select
                v-if="[2, 3].includes(Number(funcional.situacaofuncional))"
                id="funcional-tipobeneficio"
                class="input-group-flex-40"
                :options="beneficiosList"
                v-model="funcional.tipobeneficio"
                required
                :disabled="!form_active || mode === 'remove'"
                placeholder="Informe o Tipobeneficio..."
              />
              <b-form-datepicker
                v-if="[2, 3].includes(Number(funcional.situacaofuncional))"
                id="funcional-d_beneficio"
                class="input-group-flex-30"
                right
                v-model="funcional.d_beneficio"
                placeholder="Início..."
                required
                :readonly="!form_active || mode === 'remove'"
                locale="pt"
                v-bind="labelsDatePicker['pt'] || {}"
                :date-format-options="{
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                }"
              />
            </b-input-group>
          </b-form-group>
        </b-col>
        <b-col md="9" sm="12">
          <b-form-group label="Cargo (CBO)" label-for="funcional-id_cad_cargos">
            <v-select
              id="funcional-id_cad_cargos"
              :options="listCargos"
              v-model="funcional.id_cad_cargos"
              :reduce="(label) => label.code"
              required
              :disabled="!form_active || mode === 'remove'"
              placeholder="Informe o Cargo..."
            >
              <div slot="no-options">
                A opção digitada não existe!!! Tente novamente...
              </div>
            </v-select>
          </b-form-group>
        </b-col>
        <b-col md="3" sm="6">
          <b-form-group
            label="Matrícula do Cadastro Principal"
            label-for="funcional-id_cad_principal"
          >
            <b-input-group>
              <v-select
                id="funcional-id_cad_principal"
                :options="listMatPrincipais"
                v-model="funcional.id_cad_principal"
                :reduce="(label) => label.code"
                class="input-group-70"
                size="lg"
                required
                :disabled="
                  !form_active || mode === 'remove' || lock_id_cad_principal
                "
                placeholder="Informe a Matrícula..."
              >
                <div slot="no-options">
                  A opção digitada não existe!!! Tente novamente...
                </div>
              </v-select>
              <template #append>
                <b-button
                  variant="info"
                  size="sm"
                  class="input-group-flex-30"
                  :disabled="!form_active || mode === 'remove'"
                  @click="unlockCadPrincipalChange"
                >
                  Trocar
                </b-button>
              </template>
            </b-input-group>
          </b-form-group>
        </b-col>
        <b-col md="12" sm="12">
          <b-form-group
            label="Centro de Custo"
            label-for="funcional-id_cad_centros"
          >
            <v-select
              id="funcional-id_cad_centros"
              :options="listCentros"
              v-model="funcional.id_cad_centros"
              :reduce="(label) => label.code"
              required
              :disabled="!form_active || mode === 'remove'"
              placeholder="Informe o Centro de Custo..."
            >
              <div slot="no-options">
                A opção digitada não existe!!! Tente novamente...
              </div>
            </v-select>
          </b-form-group>
        </b-col>
        <b-col md="12" sm="12">
          <b-form-group
            label="Departamento"
            label-for="funcional-id_cad_departamentos"
          >
            <v-select
              id="funcional-id_cad_departamentos"
              :options="listDepartamentos"
              v-model="funcional.id_cad_departamentos"
              :reduce="(label) => label.code"
              required
              :disabled="!form_active || mode === 'remove'"
              placeholder="Informe o Departamento..."
            >
              <div slot="no-options">
                A opção digitada não existe!!! Tente novamente...
              </div>
            </v-select>
          </b-form-group>
        </b-col>
        <b-col md="12" sm="12">
          <b-form-group
            label="Local de Trabalho"
            label-for="funcional-id_local_trabalho"
          >
            <v-select
              id="funcional-id_local_trabalho"
              :options="listLTrabalho"
              v-model="funcional.id_local_trabalho"
              :reduce="(label) => label.code"
              required
              :disabled="!form_active || mode === 'remove'"
              placeholder="Informe o Local Trabalho..."
            >
              <div slot="no-options">
                A opção digitada não existe!!! Tente novamente...
              </div>
            </v-select>
          </b-form-group>
        </b-col>
        <b-col md="12" sm="12">
          <b-form-group label="Pcc (Nível)" label-for="funcional-id_pccs">
            <v-select
              id="funcional-id_pccs"
              :options="listPccs"
              v-model="funcional.id_pccs"
              :reduce="(label) => label.code"
              required
              :disabled="!form_active || mode === 'remove'"
              placeholder="Informe o PCCS..."
            >
              <div slot="no-options">
                A opção digitada não existe!!! Tente novamente...
              </div>
            </v-select>
          </b-form-group>
        </b-col>
        <b-col md="12" sm="12">
          <b-form-group
            label="Categoria Receita"
            label-for="funcional-categoria_receita"
          >
            <v-select
              id="funcional-categoria_receita"
              :options="rendimentosDirfList"
              v-model="funcional.categoria_receita"
              :reduce="(label) => label.code"
              required
              :disabled="!form_active || mode === 'remove'"
              placeholder="Informe a Categoria Receita..."
            >
              <div slot="no-options">
                A opção digitada não existe!!! Tente novamente...
              </div>
            </v-select>
          </b-form-group>
        </b-col>
        <b-col md="12" sm="12">
          <b-form-group
            label="Categoria Sefip"
            label-for="funcional-id_cat_sefip"
          >
            <v-select
              id="funcional-id_cat_sefip"
              :options="gfipList"
              v-model="funcional.id_cat_sefip"
              :reduce="(label) => label.code"
              required
              :disabled="!form_active || mode === 'remove'"
              placeholder="Informe a Categoria Sefip..."
            >
              <div slot="no-options">
                A opção digitada não existe!!! Tente novamente...
              </div>
            </v-select>
          </b-form-group>
        </b-col>
        <b-col md="9" sm="12">
          <b-form-group
            label="Ocorrência Sefip"
            label-for="funcional-ocorrencia"
          >
            <b-input-group>
              <b-form-select
                id="funcional-ocorrencia"
                class="input-group-80"
                :options="gfipOcorrenciasList"
                v-model="funcional.ocorrencia"
                :disabled="!form_active || mode === 'remove'"
                placeholder="Informe a Ocorrencia Sefip..."
              />
              <b-form-input
                v-if="funcional.ocorrencia >= '05'"
                id="funcional-n_valorbaseinss"
                class="input-group-flex-20"
                type="text"
                v-model="funcional.n_valorbaseinss"
                required
                :readonly="!form_active || mode === 'remove'"
                placeholder="Informe o Valor..."
              />
            </b-input-group>
          </b-form-group>
        </b-col>
        <b-col md="3" sm="12">
          <b-form-group
            label="Manad: Tipo e Número"
            label-for="funcional-manad_tiponomeacao"
          >
            <b-input-group>
              <b-form-select
                id="funcional-manad_tiponomeacao"
                class="input-group-60"
                :options="manadList"
                v-model="funcional.manad_tiponomeacao"
                :disabled="!form_active || mode === 'remove'"
                placeholder="Informe o Tipo da Nomeação..."
              />
              <b-form-input
                v-if="funcional.manad_tiponomeacao"
                id="funcional-manad_numeronomeacao"
                class="input-group-flex-40"
                type="text"
                v-model="funcional.manad_numeronomeacao"
                required
                :readonly="!form_active || mode === 'remove'"
                placeholder="Informe o Numero da Nomeação..."
              />
            </b-input-group>
          </b-form-group>
        </b-col>
        <b-col md="10" sm="12">
          <b-form-group label="Informações">
            <b-input-group>
              <b-form-checkbox
                id="funcional-decimo"
                name="funcional-decimo"
                :disabled="!form_active || mode === 'remove'"
                v-model="funcional.decimo"
                switch
                size="lg"
              >
                Décimo
              </b-form-checkbox>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
              <b-form-checkbox
                id="funcional-rais"
                name="funcional-rais"
                :disabled="!form_active || mode === 'remove'"
                v-model="funcional.rais"
                switch
                size="lg"
              >
                Rais
              </b-form-checkbox>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
              <b-form-checkbox
                id="funcional-dirf"
                name="funcional-dirf"
                :disabled="!form_active || mode === 'remove'"
                v-model="funcional.dirf"
                switch
                size="lg"
              >
                DIRF
              </b-form-checkbox>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
              <b-form-checkbox
                id="funcional-sefip"
                name="funcional-sefip"
                :disabled="!form_active || mode === 'remove'"
                v-model="funcional.sefip"
                switch
                size="lg"
              >
                Sefip
              </b-form-checkbox>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
              <b-form-checkbox
                id="funcional-sicap"
                name="funcional-sicap"
                :disabled="!form_active || mode === 'remove'"
                v-model="funcional.sicap"
                switch
                size="lg"
              >
                Sicap
              </b-form-checkbox>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
              <b-form-checkbox
                id="funcional-insalubridade"
                name="funcional-insalubridade"
                :disabled="!form_active || mode === 'remove'"
                v-model="funcional.insalubridade"
                switch
                size="lg"
              >
                Insalubridade
              </b-form-checkbox>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
              <b-form-checkbox
                id="funcional-desconta_sindicato"
                name="funcional-desconta_sindicato"
                :disabled="!form_active || mode === 'remove'"
                v-model="funcional.desconta_sindicato"
                switch
                size="lg"
              >
                Sindicato
              </b-form-checkbox>
            </b-input-group>
          </b-form-group>
        </b-col>
        <!-- <b-col md="2" sm="6">
          <b-form-group
            :label="`Faltas(Máx ${n_faltas})`"
            label-for="funcional-n_faltas"
          >
            <b-form-input
              id="funcional-n_faltas"
              type="number"
              :max="n_faltas"
              min="0"
              v-model="funcional.n_faltas"
              required
              :readonly="!form_active || mode === 'remove'"
            />
          </b-form-group>
        </b-col> -->
        <b-col md="2" sm="6">
          <b-form-group label="Descontos">
            <b-input-group>
              <b-form-checkbox
                id="funcional-desconta_irrf"
                name="funcional-desconta_irrf"
                :disabled="!form_active || mode === 'remove'"
                v-model="funcional.desconta_irrf"
                switch
                size="lg"
              >
                IRRF
              </b-form-checkbox>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;</span>
            </b-input-group>
          </b-form-group>
        </b-col>
        <b-col md="3" sm="6">
          <b-form-group
            label="Tipo de Previdência"
            label-for="funcional-tp_previdencia"
          >
            <b-form-radio-group
              v-if="!(!form_active || mode === 'remove')"
              id="funcional-tp_previdencia"
              v-model="funcional.tp_previdencia"
              :options="optionsPrevidencia"
              name="funcional-tp_previdencia"
              buttons
              button-variant="outline-primary"
              :disabled="!form_active || mode === 'remove'"
            ></b-form-radio-group>
            <div v-else class="text-center">
              <b-button block disabled>
                {{ previdenciaLabel }}
              </b-button>
            </div>
          </b-form-group>
        </b-col>
        <b-col md="9" sm="12">
          <b-form-group
            label="Tipo de Ênio, Início e Fim"
            label-for="funcional-enio"
          >
            <b-input-group v-if="!(!form_active || mode === 'remove')">
              <b-form-radio-group
                id="funcional-enio"
                v-model="funcional.enio"
                :options="optionsEnios"
                name="funcional-enio"
                buttons
                button-variant="outline-primary"
                :readonly="!form_active || mode === 'remove'"
              ></b-form-radio-group>
              <b-form-datepicker
                v-if="!(!form_active || mode === 'remove')"
                id="funcional-d_enio_inicio"
                right
                v-model="funcional.d_enio_inicio"
                placeholder="Inicio..."
                required
                :readonly="!form_active || mode === 'remove'"
                locale="pt"
                v-bind="labelsDatePicker['pt'] || {}"
                :date-format-options="{
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                }"
              />
              <b-form-datepicker
                v-if="!(!form_active || mode === 'remove')"
                id="funcional-d_enio_fim"
                right
                v-model="funcional.d_enio_fim"
                placeholder="Fim..."
                required
                :readonly="!form_active || mode === 'remove'"
                locale="pt"
                v-bind="labelsDatePicker['pt'] || {}"
                :date-format-options="{
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                }"
              />
            </b-input-group>
            <div v-else class="text-center">
              <b-button block disabled>
                {{ enioLabel }}
              </b-button>
            </div>
          </b-form-group>
        </b-col>
        <!-- <b-col md="6" sm="6">
          <b-form-group label="Adicionais" label-for="funcional-n_horaaula">
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
            </b-input-group>
          </b-form-group>
        </b-col> -->
        <b-col md="6" sm="12">
          <b-form-group
            label="Escolaridade (RAIS)"
            label-for="funcional-escolaridaderais"
          >
            <b-form-select
              id="funcional-escolaridaderais"
              @input="setEscolaridadeSicap"
              :options="escolaridadeRaisList"
              v-model="funcional.escolaridaderais"
              :disabled="!form_active || mode === 'remove'"
              placeholder="Informe a Escolaridade..."
            />
          </b-form-group>
        </b-col>
        <b-col md="6" sm="12">
          <b-form-group
            label="Escolaridade (SICAP)"
            label-for="funcional-id_escolaridade"
          >
            <b-form-select
              id="funcional-id_escolaridade"
              :options="escolaridadeSicapList"
              v-model="funcional.id_escolaridade"
              disabled
              placeholder="Informe a Escolaridade..."
            />
          </b-form-group>
        </b-col>
        <b-col md="10" sm="12">
          <b-form-group
            label="Molestia: Tipo e Data"
            label-for="funcional-molestia"
          >
            <b-input-group>
              <b-form-select
                id="funcional-molestia"
                class="input-group-80"
                :options="molestiasList"
                v-model="funcional.molestia"
                :disabled="!form_active || mode === 'remove'"
                placeholder="Informe a Moléstia..."
              />
              <b-form-datepicker
                v-if="funcional.molestia"
                id="funcional-d_laudomolestia"
                class="input-group-flex-20"
                right
                v-model="funcional.d_laudomolestia"
                placeholder="Informe a Data..."
                required
                :readonly="!form_active || mode === 'remove'"
                locale="pt"
                v-bind="labelsDatePicker['pt'] || {}"
                :date-format-options="{
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                }"
              />
            </b-input-group>
          </b-form-group>
        </b-col>
        <b-col md="2" sm="6">
          <b-form-group
            label="Carga H Semanal"
            label-for="funcional-carga_horaria"
          >
            <b-form-input
              id="funcional-carga_horaria"
              type="number"
              max="44"
              min="0"
              v-model="funcional.carga_horaria"
              required
              :readonly="!form_active || mode === 'remove'"
            />
          </b-form-group>
        </b-col>
        <b-col md="2" sm="6">
          <b-form-group
            hidden
            label="Ponto"
            label-for="funcional-ponto"
            class="mark"
          >
            <b-form-input
              id="funcional-ponto"
              type="text"
              v-model="funcional.ponto"
              required
              :readonly="!form_active || mode === 'remove'"
              placeholder="Informe o Ponto..."
            />
          </b-form-group>
        </b-col>
      </b-row>
    </b-form>
    <div id="actions">
      <b-button
        variant="primary"
        :disabled="!form_active"
        v-if="mode === 'save'"
        @click="save"
        >Salvar</b-button
      >
      <b-button
        variant="outline-danger"
        :disabled="!form_active"
        v-if="mode === 'remove'"
        @click="remove"
        >Excluir</b-button
      >
      <b-button
        variant="warning"
        :disabled="!form_active"
        class="ml-2"
        @click="reset"
        >Resetar</b-button
      >
      <b-button class="ml-2" to="/cadastros">{{ lblAction }}</b-button>
    </div>
  </div>
</template>

<script>
// import { TheMask } from "vue-the-mask";
import { showError } from "@/global";
import { baseApiUrl } from "@/env";
import { datePickerLocale } from "@/config/globalFacilities";
import {
  situationList,
  fSituationList,
  optionsPrevidencia,
  optionsEnios,
  beneficiosList,
  vinculosList,
  rendimentosDirfList,
  gfipList,
  gfipOcorrenciasList,
  molestiasList,
  manadList,
  escolaridadeRaisList,
  escolaridadeSicapList,
} from "@/config/lists";
import axios from "axios";
import { mapState } from "vuex";
import moment from "moment";
import "vue-select/dist/vue-select.css";

export default {
  name: "Funcional",
  //   components: { TheMask },
  props: ["cadastroGrid", "userParams"],
  data: function () {
    return {
      mode: "save",
      cadastro: {},
      funcional: {},
      lblAction: "Cancelar",
      form_active: false,
      lock_id_cad_principal: true,
      loading: false,
      sn: [
        { value: "1", text: "Sim" },
        { value: "0", text: "Não" },
      ],
      lang: {
        formatLocale: {
          firstDayOfWeek: 0,
        },
        monthBeforeYear: true,
      },
      n_faltas: 0,
      n_adnoturno: 0,
      enioLabel: "",
      previdenciaLabel: "",
      labelsDatePicker: datePickerLocale,
      situationList: situationList,
      fSituationList: fSituationList,
      beneficiosList: beneficiosList,
      vinculosList: vinculosList,
      rendimentosDirfList: rendimentosDirfList,
      gfipList: gfipList,
      gfipOcorrenciasList: gfipOcorrenciasList,
      molestiasList: molestiasList,
      manadList: manadList,
      escolaridadeRaisList: escolaridadeRaisList,
      escolaridadeSicapList: escolaridadeSicapList,
      optionsPrevidencia: optionsPrevidencia,
      optionsEnios: optionsEnios,
      listCargos: [],
      listCentros: [],
      listDepartamentos: [],
      listLTrabalho: [],
      listPccs: [],
      listMatPrincipais: [],
    };
  },
  methods: {
    getMode() {
      if (this.$route.query.md && this.$route.query.md == "-1")
        this.mode = "remove";
    },
    save() {
      const idCadS = this.funcional.id_cad_servidores;
      const id = this.funcional.id;
      const url = `${baseApiUrl}/fin-sfuncional/${idCadS}/${id}`;
      axios
        .put(url, this.funcional)
        .then((res) => {
          this.$toasted.global.defaultSuccess();
          this.lblAction = "Fechar";
          this.funcional.id = res.data.id;
          this.$emit("funcional", res.data);
        })
        .catch(showError);
    },
    setDataPt(data) {
      return moment(data, "DD/MM/YYYY").format("YYYY-MM-DD");
    },
    loadFuncional() {
      this.cadastro = this.cadastroGrid;
      this.loading = !this.loading;
      const url = `${baseApiUrl}/fin-sfuncional/${this.cadastro.id}`;
      // console.log(url);
      axios
        .get(url)
        .then((res) => {
          this.count = 1;
          if (res.data.data) {
            this.funcional = res.data.data;
            this.funcional.id_vinculo = Number(this.funcional.id_vinculo);
            this.funcional.situacaofuncional = Number(this.funcional.situacaofuncional);
            this.funcional.n_faltas = Number(this.funcional.n_faltas) || 0;
            this.funcional.n_horaaula = Number(this.funcional.n_horaaula) || 0;
            this.funcional.n_adnoturno = Number(this.funcional.n_adnoturno) || 0;
            this.funcional.n_hextra = Number(this.funcional.n_hextra) || 0;
            this.funcional.carga_horaria = Number(this.funcional.carga_horaria) || 0;
            this.funcional.decimo = Number(this.funcional.decimo) == 1;
            this.funcional.rais = Number(this.funcional.rais) == 1;
            this.funcional.dirf = Number(this.funcional.dirf) == 1;
            this.funcional.sefip = Number(this.funcional.sefip) == 1;
            this.funcional.sicap = Number(this.funcional.sicap) == 1;
            this.funcional.desconta_sindicato =
              Number(this.funcional.desconta_sindicato) == 1;
            this.funcional.desconta_irrf = Number(this.funcional.desconta_irrf) == 1;
            this.funcional.insalubridade = Number(this.funcional.insalubridade) == 1;
            this.funcional.d_admissao = this.setDataPt(
              this.funcional.d_admissao
            );
            this.funcional.d_enio_inicio = this.setDataPt(
              this.funcional.d_enio_inicio
            );
            this.funcional.d_enio_fim = this.setDataPt(
              this.funcional.d_enio_fim
            );
            this.funcional.d_beneficio = this.setDataPt(
              this.funcional.d_beneficio
            );
            this.funcional.d_laudomolestia = this.setDataPt(
              this.funcional.d_laudomolestia
            );
            this.getPrevidenciaLabel();
            this.getEnioLabel();
            this.$emit("funcional", this.funcional);
          }
          this.loading = !this.loading;
        })
        .catch((err) => {
          this.count = 0;
          showError(err);
        });
    },
    reset() {
      this.$confirm({
        message: `Qualquer dado não salvo será perdido. Confirma?`,
        button: { no: "Não", yes: "Confirmo" },
        callback: (confirm) => {
          if (confirm) {
            this.loadFuncional();
            this.form_active = false;
            this.$emit("mode", "save");
          }
        },
      });
    },
    unlockCadPrincipalChange() {
      this.$confirm({
        message: `A troca do cadastro principal pode resultar em cobranças e impostos na matrícula informada como principal. Confirma a intenção da troca?`,
        button: { no: "Não", yes: "Confirmo" },
        callback: (confirm) => {
          if (confirm) {
            this.lock_id_cad_principal = false;
          }
        },
      });
    },
    getListaCargos() {
      const url = `${baseApiUrl}/cad-cargos`;
      axios
        .patch(url)
        .then((res) => {
          this.listCargos = res.data.data.map((data) => {
            return {
              code: data.id,
              label: `${data.id_cargo.toString().padStart(4, "0")}-${
                data.nome
              } (${data.cbo})`,
            };
          });
        })
        .catch((err) => {
          showError(err);
        });
    },
    getListaCentros() {
      const url = `${baseApiUrl}/cad-centros`;
      axios
        .patch(url)
        .then((res) => {
          this.listCentros = res.data.data.map((data) => {
            return {
              code: data.id,
              label: `${data.cod_centro.toString().padStart(4, "0")}-${
                data.nome_centro
              }`,
            };
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
            return {
              code: data.id,
              label: `${data.id_departamento.toString().padStart(4, "0")}-${
                data.departamento
              }`,
            };
          });
        })
        .catch((err) => {
          showError(err);
        });
    },
    getListaLTrabalho() {
      const url = `${baseApiUrl}/cad-ltrabalho`;
      axios
        .patch(url)
        .then((res) => {
          this.listLTrabalho = res.data.data.map((data) => {
            let siope = "";
            if (data.siope && data.siope.toString().length > 0)
              siope = `(${data.siope})`;
            return {
              code: data.id,
              label: `${data.id_local_trabalho.toString().padStart(4, "0")}-${
                data.nome
              }${siope}`,
            };
          });
        })
        .catch((err) => {
          showError(err);
        });
    },
    getListaPccs() {
      const url = `${baseApiUrl}/cad-pccs`;
      axios
        .patch(url)
        .then((res) => {
          this.listPccs = res.data.data.map((data) => {
            return {
              code: data.id,
              label: `${data.id_pccs}-${data.nome_pccs} (${data.nivel_pccs})`,
            };
          });
        })
        .catch((err) => {
          showError(err);
        });
    },
    getListaMatriculasCpf() {
      const url = `${baseApiUrl}/cadastros-cpf?cpf=${this.cadastroGrid.cpf}`;
      axios
        .get(url)
        .then((res) => {
          this.listMatPrincipais = res.data.data.map((data) => {
            const matricula = data.matricula.toString().padStart(8, "0");
            return {
              code: data.id,
              label: matricula,
            };
          });
        })
        .catch((err) => {
          showError(err);
        });
    },
    getPrevidenciaLabel() {
      switch (this.funcional.tp_previdencia) {
        case "0":
          this.previdenciaLabel = "Geral";
          break;
        case "4":
          this.previdenciaLabel = "Própria";
          break;
        default:
          this.previdenciaLabel = `Indefinida: ${this.funcional.tp_previdencia}`;
          break;
      }
    },
    getEnioLabel() {
      switch (this.funcional.enio) {
        case "1":
          this.enioLabel = "Anuênio";
          break;
        case "3":
          this.enioLabel = "Triênio";
          break;
        case "5":
          this.enioLabel = "Quinquênio";
          break;
        case "10":
          this.enioLabel = "Decênio";
          break;
        default:
          this.enioLabel = "Nenhum";
          break;
      }
    },
    setEscolaridadeSicap() {
      switch (this.funcional.escolaridaderais) {
        case null:
          this.funcional.id_escolaridade = null;
          break;
        case "01":
          this.funcional.id_escolaridade = "0";
          break;
        case "02":
        case "03":
        case "04":
          this.funcional.id_escolaridade = "2";
          break;
        case "05":
          this.funcional.id_escolaridade = "1";
          break;
        case "06":
          this.funcional.id_escolaridade = "4";
          break;
        case "07":
          this.funcional.id_escolaridade = "3";
          break;
        case "08":
          this.funcional.id_escolaridade = "6";
          break;
        case "09":
          this.funcional.id_escolaridade = "5";
          break;
        default:
          this.funcional.id_escolaridade = "7";
          break;
      }
    },
    maxFaltas() {
      this.n_faltas = moment(
        `${this.userParams.f_ano}-${this.userParams.f_mes}`,
        "YYYY-MM"
      ).daysInMonth();
    },
    maxAdNoturno() {
      this.n_adnoturno = moment(
        `${this.userParams.f_ano}-${this.userParams.f_mes}`,
        "YYYY-MM"
      ).daysInMonth();
    },
  },
  mounted() {
    this.getMode();
    this.loadFuncional();
    this.maxFaltas();
    this.maxAdNoturno();
    this.getListaCargos();
    this.getListaCentros();
    this.getListaDepartamentos();
    this.getListaLTrabalho();
    this.getListaPccs();
    this.getListaMatriculasCpf();
    if (this.userParams.admin >= 2) this.form_active = true;
    let bSelect = document.createElement("script");
    bSelect.setAttribute("src", "https://unpkg.com/vue@latest");
    document.head.appendChild(bSelect);
    bSelect.setAttribute("src", "https://unpkg.com/vue-select@latest");
    document.head.appendChild(bSelect);
  },
  computed: mapState(["user"]),
};
</script>

<style scoped>
/* @import "@vue-select/src/scss/vue-select.scss"; */
@import "https://unpkg.com/vue-select@latest/dist/vue-select.css";
form {
  margin-bottom: 20px;
}
.bg {
  background-color: antiquewhite;
}
.custom-file-input:lang(pt-BR) ~ .custom-file-label::after {
  content: "Selecionar";
}
.input-group .input-group-30 {
  width: 30%;
}
.input-group .input-group-40 {
  width: 40%;
}
.input-group .input-group-60 {
  width: 60%;
}
.input-group .input-group-70 {
  width: 70%;
}
.input-group .input-group-80 {
  width: 80%;
}
.input-group > .input-group-flex-20 {
  flex: 0 0 20%;
}
.input-group > .input-group-flex-30 {
  flex: 0 0 30%;
}
.input-group > .input-group-flex-40 {
  flex: 0 0 40%;
}
.mark {
  background-color: yellow;
  padding: 0;
}
.mark-rd {
  background-color: red;
  padding: 0;
}
</style>
