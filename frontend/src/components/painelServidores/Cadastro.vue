<template>
  <div class="cadastro-admin" id="cadastro-admin">
    <b-form>
      <input id="cadastro-id" type="hidden" v-model="cadastro.id" />
      <input id="cadastro-status" type="hidden" v-model="cadastro.status" />
      <input id="cadastro-dominio" type="hidden" v-model="cadastro.dominio" />
      <input id="cadastro-evento" type="hidden" v-model="cadastro.evento" />
      <input id="cadastro-url_foto" type="hidden" v-model="cadastro.url_foto" />
      <input
        id="cadastro-matricula"
        type="hidden"
        v-model="cadastro.matricula"
      />
      <input
        id="cadastro-created_at"
        type="hidden"
        v-model="cadastro.created_at"
      />
      <input
        id="cadastro-updated_at"
        type="hidden"
        v-model="cadastro.updated_at"
      />
      <b-row>
        <b-col md="4" sm="12">
          <b-form-group label="Foto" label-for="cadastro-url_foto">
            <img
              :src="photoSrc"
              alt="Foto"
              width="100%"
              id="cadastro-url_foto"
              style="border-radius: 3px"
              @contextmenu.prevent
            />
            <div class="camera-button">
              <b-button
                :disabled="!form_active"
                block
                :class="{
                  'is-primary': !isCameraOpen,
                  'is-danger': isCameraOpen,
                }"
                @click="toggleCamera"
              >
                <span v-if="!isCameraOpen">Fotografar</span>
                <span v-else>Close Camera</span>
              </b-button>
            </div>

            <div v-show="isCameraOpen && isLoading" class="camera-loading">
              <ul class="loader-circle">
                <li></li>
                <li></li>
                <li></li>
              </ul>
            </div>

            <div
              v-if="isCameraOpen"
              v-show="!isLoading"
              class="camera-box"
              :class="{ flash: isShotPhoto }"
            >
              <div class="camera-shutter" :class="{ flash: isShotPhoto }"></div>

              <video
                v-show="!isPhotoTaken"
                ref="camera"
                :width="450"
                :height="337.5"
                autoplay
              ></video>

              <canvas
                v-show="isPhotoTaken"
                id="photoTaken"
                ref="canvas"
                :width="450"
                :height="337.5"
              ></canvas>
            </div>

            <div v-if="isCameraOpen && !isLoading" class="camera-shoot">
              <b-button type="button" class="button" @click="takePhoto">
                <img
                  src="https://img.icons8.com/material-outlined/50/000000/camera--v2.png"
                />
              </b-button>
            </div>

            <div v-if="isPhotoTaken && isCameraOpen" class="camera-download">
              <a
                id="downloadPhoto"
                download="my-photo.jpg"
                class="button"
                role="button"
                @click="downloadImage"
              >
                Download
              </a>
            </div>
          </b-form-group>
        </b-col>

        <b-col md="8" sm="12">
          <b-row>
            <b-col md="4" sm="12">
              <b-form-group label="Cpf" label-for="cadastro-cpf">
                <!-- !isCpf ? 'is-invalid' : isCpf ? 'is-valid' : '' -->
                <the-mask
                  class="form-control"
                  id="cadastro-cpf"
                  :class="`form-control ${setValidCpf(cadastro.cpf)}`"
                  type="text"
                  v-model="cadastro.cpf"
                  :mask="['###.###.###-##']"
                  required
                  @input="setValidCpf"
                  :disabled="!form_active || mode === 'remove'"
                  placeholder="Informe o CPF..."
                />
              </b-form-group>
            </b-col>
            <b-col md="4" sm="12">
              <b-form-group label="Admissao" label-for="cadastro-d_admissao">
                <b-form-datepicker
                  id="cadastro-d_admissao"
                  right
                  v-model="cadastro.d_admissao"
                  placeholder="Informe a data..."
                  required
                  :readonly="!form_active || mode === 'remove' || !isCpf"
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
            <b-col md="4" sm="12">
              <b-form-group
                label="Nascimento"
                label-for="cadastro-nascimento_d"
              >
                <b-form-datepicker
                  id="cadastro-nascimento_d"
                  right
                  v-model="cadastro.nascimento_d"
                  placeholder="Informe a data..."
                  required
                  :readonly="!form_active || mode === 'remove' || !isCpf"
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
          </b-row>
          <b-row>
            <b-col md="12" sm="12">
              <b-form-group label="Nome" label-for="cadastro-nome">
                <b-form-input
                  id="cadastro-nome"
                  type="text"
                  v-model="cadastro.nome"
                  required
                  :readonly="!form_active || mode === 'remove' || !isCpf"
                  placeholder="Informe o Nome..."
                />
              </b-form-group>
            </b-col>
          </b-row>
          <b-row>
            <b-col md="12" sm="12">
              <b-form-group
                label="RG, Emissor, UF e Data de Emissão"
                label-for="cadastro-rg"
              >
                <b-input-group>
                  <b-form-input
                    id="cadastro-rg"
                    class="input-group-20"
                    type="text"
                    v-model="cadastro.rg"
                    required
                    :readonly="!form_active || mode === 'remove' || !isCpf"
                    placeholder="Informe o RG..."
                  />
                  <b-form-input
                    id="cadastro-rg_emissor"
                    class="input-group-flex-20"
                    type="text"
                    v-model="cadastro.rg_emissor"
                    required
                    :readonly="!form_active || mode === 'remove' || !isCpf"
                    placeholder="Informe o Emissor..."
                  />
                  <b-form-select
                    id="cadastro-rg_uf"
                    class="input-group-flex-30"
                    :options="ufList"
                    v-model="cadastro.rg_uf"
                    required
                    :disabled="!form_active || mode === 'remove' || !isCpf"
                    placeholder="Informe a UF emissora..."
                  />
                  <b-form-datepicker
                    id="cadastro-rg_d"
                    right
                    class="input-group-flex-30"
                    v-model="cadastro.rg_d"
                    placeholder="Informe a data..."
                    required
                    :readonly="!form_active || mode === 'remove' || !isCpf"
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
          </b-row>
          <b-row>
            <b-col md="6" sm="12">
              <b-form-group label="Pis" label-for="cadastro-pispasep">
                <the-mask
                  class="form-control"
                  id="cadastro-pispasep"
                  type="text"
                  v-model="cadastro.pispasep"
                  :mask="['###.#####.##.#']"
                  required
                  :readonly="!form_active || mode === 'remove' || !isCpf"
                  placeholder="Informe o Pis..."
                />
              </b-form-group>
            </b-col>
            <b-col md="6" sm="12">
              <b-form-group label="Pis Emissão" label-for="cadastro-pispasep_d">
                <b-form-datepicker
                  id="cadastro-pispasep_d"
                  v-model="cadastro.pispasep_d"
                  placeholder="Informe a data..."
                  required
                  :readonly="!form_active || mode === 'remove' || !isCpf"
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
            <b-col md="12" sm="12">
              <b-form-group
                label="Ctps, Série, UF e Data da Emissão"
                label-for="cadastro-ctps"
              >
                <b-input-group>
                  <b-form-input
                    id="cadastro-ctps"
                    type="text"
                    class="input-group-30"
                    v-model="cadastro.ctps"
                    required
                    :readonly="!form_active || mode === 'remove' || !isCpf"
                    placeholder="Informe o Número..."
                  />
                  <b-form-input
                    id="cadastro-ctps_serie"
                    class="input-group-flex-20"
                    type="text"
                    v-model="cadastro.ctps_serie"
                    required
                    :readonly="!form_active || mode === 'remove' || !isCpf"
                    placeholder="Informe a Serie..."
                  />
                  <b-form-select
                    id="cadastro-ctps_uf"
                    class="input-group-flex-20"
                    :options="ufList"
                    v-model="cadastro.ctps_uf"
                    required
                    :disabled="!form_active || mode === 'remove' || !isCpf"
                    placeholder="Informe a UF..."
                  />
                  <b-form-datepicker
                    id="cadastro-ctps_d"
                    right
                    class="input-group-flex-30"
                    v-model="cadastro.ctps_d"
                    placeholder="Informe a data..."
                    required
                    :readonly="!form_active || mode === 'remove' || !isCpf"
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
          </b-row>
          <b-row>
            <b-col md="12" sm="12">
              <b-form-group
                label="Titulo, Seção e Zona"
                label-for="cadastro-titulo"
              >
                <b-input-group>
                  <the-mask
                    class="form-control input-group-60"
                    id="cadastro-titulo"
                    type="text"
                    v-model="cadastro.titulo"
                    :mask="['#### #### ####']"
                    required
                    :readonly="!form_active || mode === 'remove' || !isCpf"
                    placeholder="Informe o Título..."
                  />
                  <the-mask
                    class="form-control input-group-flex-20"
                    :mask="['####']"
                    id="cadastro-titulosecao"
                    v-model="cadastro.titulosecao"
                    required
                    :readonly="!form_active || mode === 'remove' || !isCpf"
                    placeholder="Informe o Titulosecao..."
                  />
                  <the-mask
                    class="form-control input-group-flex-20"
                    :mask="['####']"
                    id="cadastro-titulozona"
                    v-model="cadastro.titulozona"
                    required
                    :readonly="!form_active || mode === 'remove' || !isCpf"
                    placeholder="Informe a Zona..."
                  />
                </b-input-group>
              </b-form-group>
            </b-col>
          </b-row>
        </b-col>
      </b-row>
      <b-row>
        <b-col md="6" sm="12"
          ><b-form-group label="Pai" label-for="cadastro-pai">
            <b-form-input
              id="cadastro-pai"
              type="text"
              v-model="cadastro.pai"
              required
              :readonly="!form_active || mode === 'remove' || !isCpf"
              placeholder="Informe o Pai..."
            />
          </b-form-group>
        </b-col>
        <b-col md="6" sm="12">
          <b-form-group label="Mae" label-for="cadastro-mae">
            <b-form-input
              id="cadastro-mae"
              type="text"
              v-model="cadastro.mae"
              required
              :readonly="!form_active || mode === 'remove' || !isCpf"
              placeholder="Informe o Mae..."
            />
          </b-form-group>
        </b-col>
        <b-col md="2" sm="12">
          <b-form-group label="Cep" label-for="cadastro-cep">
            <the-mask
              id="cadastro-cep"
              type="text"
              @input="getEnderecoApi"
              v-model="cadastro.cep"
              :mask="['########']"
              :class="`form-control ${cepClass}`"
              :readonly="!form_active || mode === 'remove' || !isCpf"
              required
              placeholder="Apenas números..."
            />
          </b-form-group>
        </b-col>
        <b-col md="4" sm="12">
          <b-form-group label="Logradouro" label-for="cadastro-logradouro">
            <b-form-input
              id="cadastro-logradouro"
              ref="logradouro"
              type="text"
              v-model="cadastro.logradouro"
              required
              :readonly="!form_active || !isCep || mode === 'remove' || !isCpf"
              placeholder="Informe o Logradouro..."
            />
          </b-form-group>
        </b-col>
        <b-col md="1" sm="12">
          <b-form-group label="Nrº" label-for="cadastro-numero">
            <b-form-input
              id="cadastro-numero"
              ref="numero"
              type="text"
              v-model="cadastro.numero"
              required
              :readonly="!form_active || !isCep || mode === 'remove' || !isCpf"
              placeholder="Informe o Numero..."
            />
          </b-form-group>
        </b-col>
        <b-col md="2" sm="12">
          <b-form-group label="Complemento" label-for="cadastro-complemento">
            <b-form-input
              id="cadastro-complemento"
              type="text"
              v-model="cadastro.complemento"
              required
              :readonly="!form_active || !isCep || mode === 'remove' || !isCpf"
              placeholder="Informe o Complemento..."
            />
          </b-form-group>
        </b-col>
        <b-col md="3" sm="12">
          <b-form-group label="Bairro" label-for="cadastro-bairro">
            <b-form-input
              id="cadastro-bairro"
              type="text"
              v-model="cadastro.bairro"
              required
              :readonly="!form_active || !isCep || mode === 'remove' || !isCpf"
              placeholder="Informe o Bairro..."
            />
          </b-form-group>
        </b-col>
        <b-col md="3" sm="12">
          <b-form-group label="Uf" label-for="cadastro-uf">
            <b-form-select
              id="cadastro-uf"
              :options="ufList"
              v-model="cadastro.uf"
              @input="getListaCidades"
              required
              :disabled="!form_active || !isCep || mode === 'remove' || !isCpf"
              placeholder="Informe o Uf..."
            />
          </b-form-group>
        </b-col>
        <b-col md="3" sm="12">
          <b-form-group label="Cidade" label-for="cadastro-cidade">
            <b-form-select
              id="cadastro-cidade"
              v-model="cadastro.cidade"
              :options="citiesList_cidade"
              required
              :disabled="
                !form_active ||
                !isCep ||
                (citiesList_cidade.length == 0 && !cadastro.uf) ||
                mode === 'remove' ||
                !isCpf
              "
              placeholder="Informe o Cidade..."
            />
          </b-form-group>
        </b-col>
        <b-col md="3" sm="12">
          <b-form-group
            label="Naturalidade Uf"
            label-for="cadastro-naturalidade_uf"
          >
            <b-form-select
              id="cadastro-naturalidade_uf"
              :options="ufList"
              v-model="cadastro.naturalidade_uf"
              @input="getListaCidadesNaturalidade"
              required
              :disabled="
                !form_active || !form_active || mode === 'remove' || !isCpf
              "
              placeholder="Informe o Naturalidade Uf..."
            />
          </b-form-group>
        </b-col>
        <b-col md="3" sm="12">
          <b-form-group
            label="Naturalidade Cidade"
            label-for="cadastro-naturalidade"
          >
            <b-form-select
              id="cadastro-naturalidade"
              v-model="cadastro.naturalidade"
              :options="citiesList_naturalidade"
              required
              :disabled="
                !form_active ||
                (citiesList_naturalidade.length == 0 &&
                  !cadastro.naturalidade_uf) ||
                mode === 'remove' ||
                !isCpf
              "
              placeholder="Informe o Naturalidade..."
            />
          </b-form-group>
        </b-col>
        <b-col md="3" sm="12">
          <b-form-group label="Telefone" label-for="cadastro-telefone">
            <the-mask
              id="cadastro-telefone"
              class="form-control"
              :mask="'(##) ####-####'"
              v-model="cadastro.telefone"
              required
              :readonly="!form_active || mode === 'remove' || !isCpf"
              placeholder="Informe o Telefone..."
            />
          </b-form-group>
        </b-col>
        <b-col md="3" sm="12">
          <b-form-group label="Celular" label-for="cadastro-celular">
            <the-mask
              id="cadastro-celular"
              class="form-control"
              :mask="['(##) ####-####', '(##) #####-####']"
              v-model="cadastro.celular"
              required
              :readonly="!form_active || mode === 'remove' || !isCpf"
              placeholder="Informe o Celular..."
            />
          </b-form-group>
        </b-col>
        <b-col md="6" sm="12">
          <b-form-group label="Email" label-for="cadastro-email">
            <b-form-input
              id="cadastro-email"
              :class="`form-control ${isEmail}`"
              @input="setValidEmail"
              type="text"
              v-model="cadastro.email"
              required
              :readonly="!form_active || mode === 'remove' || !isCpf"
              placeholder="Informe o Email..."
            />
          </b-form-group>
        </b-col>
        <b-col md="4" sm="12">
          <b-form-group label="Banco" label-for="cadastro-idbanco">
            <b-form-select
              id="cadastro-idbanco"
              :options="bancosList"
              v-model="cadastro.idbanco"
              required
              :disabled="!form_active || mode === 'remove' || !isCpf"
              placeholder="Informe o Idbanco..."
            />
          </b-form-group>
        </b-col>
        <b-col md="3" sm="12">
          <b-form-group
            label="Agencia e Dígito"
            label-for="cadastro-banco_agencia"
          >
            <b-input-group>
              <b-form-input
                id="cadastro-banco_agencia"
                class="input-group-70"
                type="text"
                v-model="cadastro.banco_agencia"
                required
                :readonly="!form_active || mode === 'remove' || !isCpf"
                placeholder="Informe o Banco Agencia..."
              />
              <b-form-input
                id="cadastro-banco_agencia_digito"
                class="input-group-flex-30"
                type="text"
                v-model="cadastro.banco_agencia_digito"
                required
                :readonly="!form_active || mode === 'remove' || !isCpf"
                placeholder="Informe o Banco Agencia Digito..."
              />
            </b-input-group>
          </b-form-group>
        </b-col>
        <b-col md="3" sm="12">
          <b-form-group label="Conta e Dígito" label-for="cadastro-banco_conta">
            <b-input-group>
              <b-form-input
                id="cadastro-banco_conta"
                class="input-group-70"
                type="text"
                v-model="cadastro.banco_conta"
                required
                :readonly="!form_active || mode === 'remove' || !isCpf"
                placeholder="Informe o Banco Conta..."
              />
              <b-form-input
                id="cadastro-banco_conta_digito"
                class="input-group-flex-30"
                type="text"
                v-model="cadastro.banco_conta_digito"
                required
                :readonly="!form_active || mode === 'remove' || !isCpf"
                placeholder="Informe o Banco Conta Digito..."
              />
            </b-input-group>
          </b-form-group>
        </b-col>
        <b-col md="2" sm="12">
          <b-form-group label="Operacao" label-for="cadastro-banco_operacao">
            <b-form-input
              id="cadastro-banco_operacao"
              type="text"
              v-model="cadastro.banco_operacao"
              required
              :readonly="!form_active || mode === 'remove' || !isCpf"
              placeholder="Informe o Banco Operacao..."
            />
          </b-form-group>
        </b-col>
        <b-col md="2" sm="12">
          <b-form-group
            label="Nacionalidade"
            label-for="cadastro-nacionalidade"
          >
            <b-form-select
              id="cadastro-nacionalidade"
              v-model="cadastro.nacionalidade"
              required
              :options="nationalitiesList"
              :disabled="!form_active || mode === 'remove' || !isCpf"
              placeholder="Informe o Nacionalidade..."
            />
          </b-form-group>
        </b-col>
        <b-col md="2" sm="12">
          <b-form-group label="Sexo" label-for="cadastro-sexo">
            <b-form-select
              id="cadastro-sexo"
              :options="sexos"
              v-model="cadastro.sexo"
              required
              :disabled="!form_active || mode === 'remove' || !isCpf"
              placeholder="Informe o Sexo..."
            />
          </b-form-group>
        </b-col>
        <b-col md="2" sm="12">
          <b-form-group label="Raca" label-for="cadastro-raca">
            <b-form-select
              id="cadastro-raca"
              :options="racasList"
              v-model="cadastro.raca"
              required
              :disabled="!form_active || mode === 'remove' || !isCpf"
              placeholder="Informe o Raca..."
            />
          </b-form-group>
        </b-col>
        <b-col md="3" sm="12">
          <b-form-group label="Estado Civil" label-for="cadastro-estado_civil">
            <b-form-select
              id="cadastro-estado_civil"
              :options="eCList"
              v-model="cadastro.estado_civil"
              required
              :disabled="!form_active || mode === 'remove' || !isCpf"
              placeholder="Informe o Estado Civil..."
            />
          </b-form-group>
        </b-col>
        <b-col md="3" sm="12">
          <b-form-group
            label="Tipodeficiencia"
            label-for="cadastro-tipodeficiencia"
          >
            <b-form-select
              id="cadastro-tipodeficiencia"
              :options="deficienciesList"
              v-model="cadastro.tipodeficiencia"
              required
              :disabled="!form_active || mode === 'remove' || !isCpf"
              placeholder="Informe o Tipodeficiencia..."
            />
          </b-form-group>
        </b-col>
      </b-row>
    </b-form>
    <div id="actions">
      <b-button
        variant="primary"
        :disabled="!form_active || !isCpf"
        v-if="mode === 'save' && isCpf"
        @click="save"
        >Salvar</b-button
      >
      <b-button
        variant="outline-danger"
        :disabled="!form_active || !isCpf"
        v-if="mode === 'remove'"
        @click="remove"
        >Excluir</b-button
      >
      <b-button
        variant="warning"
        :disabled="!form_active || !isCpf"
        class="ml-2"
        @click="reset"
        >Resetar</b-button
      >
      <b-button
        class="ml-2"
        @click="
          `${
            $router.go(-1)
              ? $router.go(-1)
              : $router.push({ path: '/cadastros' })
          }`
        "
        >{{ lblAction }}</b-button
      >
    </div>
  </div>
</template>

<script>
import { TheMask } from "vue-the-mask";
import { showError } from "@/global";
import { baseApiUrl } from "@/env";
import { datePickerLocale, emailOrError } from "@/config/globalFacilities";
import {
  ufList,
  racasList,
  eCList,
  deficienciesList,
  nationalitiesList,
} from "@/config/lists";
import axios from "axios";
import { mapState } from "vuex";
import { cpf } from "cpf-cnpj-validator";
import moment from "moment";

export default {
  name: "Cadastro",
  components: { TheMask },
  props: ["cadastroGrid", "userParams"],
  data: function () {
    return {
      mode: "save",
      cadastro: {},
      lblAction: "Cancelar Edição",
      photoSrc: undefined,
      form_active: false,
      lang: {
        formatLocale: {
          firstDayOfWeek: 0,
        },
        monthBeforeYear: true,
      },
      isCpf: false,
      isCep: undefined,
      cepClass: undefined,
      isEmail: undefined,
      sexos: [
        { value: "0", text: "Masculino" },
        { value: "1", text: "Feminino" },
        { value: "-1", text: "Não especificado" },
      ],
      labelsDatePicker: datePickerLocale,
      ufList: ufList,
      racasList: racasList,
      eCList: eCList,
      deficienciesList: deficienciesList,
      citiesList_naturalidade: [],
      nationalitiesList: nationalitiesList,
      citiesList_cidade: [],
      bancosList: undefined,
      // Variáveis da captura de foto
      isCameraOpen: false,
      isPhotoTaken: false,
      isShotPhoto: false,
      isLoading: false,
      link: "#",
    };
  },
  methods: {
    getMode() {
      if (this.$route.query.md && this.$route.query.md == "-1")
        this.mode = "remove";
    },
    save() {
      const method = this.cadastro.id ? "put" : "post";
      const id = this.cadastro.id
        ? `/${this.cadastro.cpf}/${this.cadastro.matricula}`
        : "";
      axios[method](`${baseApiUrl}/cadastros${id}`, this.cadastro)
        .then((res) => {
          this.$toasted.global.defaultSuccess();
          this.lblAction = "Fechar";
          this.cadastro.id = res.data.id;
          this.$emit("idCadas", res.data.id);
          this.$emit("cadas", res.data);
        })
        .catch(showError);
    },
    setDataPt(data) {
      return moment(data, "DD/MM/YYYY").format("YYYY-MM-DD");
    },
    loadCadastro() {
      // this.$cookies.set("cadastroGrid", this.cadastroGrid);
      // this.cadastro = this.$cookies.get("cadastroGrid");
      // this.$cookies.remove("cadastroGrid");
      this.cadastro = this.cadastroGrid;
      // this.getAsset();
      this.cadastro.nascimento_d = this.setDataPt(this.cadastro.nascimento_d);
      this.cadastro.d_admissao = this.setDataPt(this.cadastro.d_admissao);
      this.cadastro.pispasep_d = this.setDataPt(this.cadastro.pispasep_d);
      this.cadastro.rg_d = this.setDataPt(this.cadastro.rg_d);
      if (this.cadastro.foto64)
        try {
          this.photoSrc = "data:image/jpg;base64," + this.cadastro.foto64;
        } catch (error) {
          this.photoSrc = require(`@/assets/imgs/semFoto.jpg`);
        }
      else this.photoSrc = require(`@/assets/imgs/semFoto.jpg`);
      this.setValidEmail();
      this.setValidCep();
      if (this.cadastro.uf) this.getListaCidades(this.cadastro.uf);
      this.getListaCidadesNaturalidade(this.cadastro.naturalidade_uf);
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
    remove() {
      const id = this.cadastro.id;
      axios
        .delete(`${baseApiUrl}/cadastros/${id}`)
        .then(() => {
          this.$toasted.global.defaultSuccess();
          this.reset();
        })
        .catch(showError);
    },
    reset() {
      this.$confirm({
        message: `Qualquer dado não salvo será perdido. Confirma?`,
        button: { no: "Não", yes: "Confirmo" },
        callback: (confirm) => {
          if (confirm) {
            this.loadCadastro();
            this.form_active = false;
            this.$emit("idCadas", null);
            this.$emit("mode", "save");
          }
        },
      });
    },
    setValidCpf(value) {
      let isValid = undefined;
      // Só executa a validação se o campo tiver onze dígitos numéricos
      if (value && value.replace(/([^\d])+/gim, "").length == 11)
        isValid = cpf.isValid(value.replace(/([^\d])+/gim, ""));
      if (isValid) return "is-valid";
      // Se for válido...
      else if (!isValid) return "is-invalid";
      // Se for inválido...
      else return ""; // Se não...
    },
    setValidCep() {
      this.isCep = false;
      if (this.cadastro.cep && this.cadastro.cep.length > 0) {
        if (this.cadastro.cep.length == 8) {
          this.cepClass = "is-valid";
          this.isCep = true;
        } else this.cepClass = "is-invalid";
      } else this.cepClass = undefined;
    },
    setValidEmail() {
      if (this.cadastro.email && this.cadastro.email.length > 0) {
        if (emailOrError(this.cadastro.email)) this.isEmail = "is-valid";
        else this.isEmail = "is-invalid";
      } else this.isEmail = undefined;
    },
    getEnderecoApi() {
      this.setValidCep();
      if (
        this.cadastro.logradouro &&
        this.cadastro.cep &&
        this.cadastro.cep.length === 8
      ) {
        this.$viaCep
          .buscarCep(this.cadastro.cep)
          .then((obj) => {
            this.cadastro.logradouro = obj.logradouro.toUpperCase();
            this.cadastro.complemento = obj.complemento.toUpperCase();
            this.cadastro.bairro = obj.bairro.toUpperCase();
            this.cadastro.cidade = obj.localidade.toUpperCase();
            this.cadastro.uf = obj.uf.toUpperCase();
            if (obj.logradouro) this.$refs.numero.focus();
            else if (obj) this.$refs.logradouro.focus();
          })
          .catch((err) => {
            showError(err);
          });
      }
    },
    getListaCidades(uf) {
      if (uf) {
        const url = `${baseApiUrl}/cidades/${uf}`;
        axios
          .get(url)
          .then((res) => {
            this.citiesList_cidade = res.data.data.map((data) => {
              return {
                value: data.municipio.toUpperCase(),
                text: data.municipio.toUpperCase(),
              };
            });
          })
          .catch((err) => {
            showError(err);
          });
      }
    },
    getListaCidadesNaturalidade(uf) {
      const url = `${baseApiUrl}/cidades/${uf}`;
      axios
        .get(url)
        .then((res) => {
          this.citiesList_naturalidade = res.data.data.map((data) => {
            return {
              value: data.municipio.toUpperCase(),
              text: data.municipio.toUpperCase(),
            };
          });
        })
        .catch((err) => {
          showError(err);
        });
    },
    getListaBancos() {
      const url = `${baseApiUrl}/cad-bancos`;
      axios
        .patch(url)
        .then((res) => {
          this.bancosList = res.data.data.map((data) => {
            return {
              value: data.id,
              text: `${data.febraban}-${data.nome}`,
            };
          });
        })
        .catch((err) => {
          showError(err);
        });
    },
    // Métodos para captura de foto
    toggleCamera() {
      if (this.isCameraOpen) {
        this.isCameraOpen = false;
        this.isPhotoTaken = false;
        this.isShotPhoto = false;
        this.stopCameraStream();
      } else {
        this.isCameraOpen = true;
        this.createCameraElement();
      }
    },
    createCameraElement() {
      this.isLoading = true;

      const constraints = (window.constraints = {
        audio: false,
        video: true,
      });

      navigator.mediaDevices
        .getUserMedia(constraints)
        .then((stream) => {
          this.isLoading = false;
          this.$refs.camera.srcObject = stream;
        })
        .catch((error) => {
          this.isLoading = false;
          alert(
            "May the browser didn't support or there is some errors. " + error
          );
        });
    },
    stopCameraStream() {
      let tracks = this.$refs.camera.srcObject.getTracks();

      tracks.forEach((track) => {
        track.stop();
      });
    },
    takePhoto() {
      if (!this.isPhotoTaken) {
        this.isShotPhoto = true;

        const FLASH_TIMEOUT = 50;

        setTimeout(() => {
          this.isShotPhoto = false;
        }, FLASH_TIMEOUT);
      }

      this.isPhotoTaken = !this.isPhotoTaken;

      const context = this.$refs.canvas.getContext("2d");
      context.drawImage(this.$refs.camera, 0, 0, 450, 337.5);
    },
    downloadImage() {
      const download = document.getElementById("downloadPhoto");
      const canvas = document
        .getElementById("photoTaken")
        .toDataURL("image/jpeg")
        .replace("image/jpeg", "image/octet-stream");
      download.setAttribute("href", canvas);
    },
  },
  mounted() {
    this.getMode();
    this.loadCadastro();
    this.getListaBancos();
    // this.setValidCpf(this.cadastro.cpf);
    // // if (this.userParams.admin >= 2) this.form_active = true;
  },
  computed: mapState(["user"]),
};
</script>

<style scoped>
form {
  margin-bottom: 20px;
}
.bg {
  background-color: antiquewhite;
}
.custom-file-input:lang(pt-BR) ~ .custom-file-label::after {
  content: "Selecionar";
}
.web-camera-container {
  margin-top: 2rem;
  margin-bottom: 2rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 500px;
}
.web-camera-container .camera-button {
  margin-bottom: 2rem;
}
.web-camera-container .camera-box .camera-shutter {
  opacity: 0;
  width: 450px;
  height: 337.5px;
  background-color: #fff;
  position: absolute;
}
.web-camera-container .camera-box .camera-shutter.flash {
  opacity: 1;
}
.web-camera-container .camera-shoot {
  margin: 1rem 0;
}
.web-camera-container .camera-shoot button {
  height: 60px;
  width: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 100%;
}
.web-camera-container .camera-shoot button img {
  height: 35px;
  object-fit: cover;
}
.web-camera-container .camera-loading {
  overflow: hidden;
  height: 100%;
  position: absolute;
  width: 100%;
  min-height: 150px;
  margin: 3rem 0 0 -1.2rem;
}
.web-camera-container .camera-loading ul {
  height: 100%;
  position: absolute;
  width: 100%;
  z-index: 999999;
  margin: 0;
}
.web-camera-container .camera-loading .loader-circle {
  display: block;
  height: 14px;
  margin: 0 auto;
  top: 50%;
  left: 100%;
  transform: translateY(-50%);
  transform: translateX(-50%);
  position: absolute;
  width: 100%;
  padding: 0;
}
.web-camera-container .camera-loading .loader-circle li {
  display: block;
  float: left;
  width: 10px;
  height: 10px;
  line-height: 10px;
  padding: 0;
  position: relative;
  margin: 0 0 0 4px;
  background: #999;
  animation: preload 1s infinite;
  top: -50%;
  border-radius: 100%;
}
.web-camera-container .camera-loading .loader-circle li:nth-child(2) {
  animation-delay: 0.2s;
}
.web-camera-container .camera-loading .loader-circle li:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes preload {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
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
.input-group > .input-group-flex-20 {
  flex: 0 0 20%;
}
.input-group > .input-group-flex-30 {
  flex: 0 0 30%;
}
.input-group > .input-group-flex-40 {
  flex: 0 0 40%;
}
</style>
