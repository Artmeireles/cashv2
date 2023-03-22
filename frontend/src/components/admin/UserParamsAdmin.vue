<template>
  <div class="user-admin">
    <b-form :hidden="form_input_hide">
      <input id="user-id" type="hidden" v-model="userF.id" />
      <b-row>
        <b-col md="3" sm="12">
          <b-form-group label="Nome:" label-for="user-name">
            <b-form-input
              id="user-name"
              type="text"
              v-model="userF.name"
              :disabled="mode === 'remove' || mode === 'key'"
              placeholder="Informe o Nome do Usuário..."
            />
          </b-form-group>
        </b-col>
        <b-col md="3" sm="12">
          <b-form-group label="Telefone:" label-for="user-telefone">
            <the-mask
              id="user-telefone"
              class="form-control"
              type="text"
              v-model="userF.telefone"
              :mask="['(##) #########']"
              placeholder="Informe o Telefone do usuário..."
              :disabled="mode === 'remove' || mode === 'key'"
            />
          </b-form-group>
        </b-col>
        <b-col md="3" sm="12">
          <b-form-group label="E-mail:" label-for="user-email">
            <b-form-input
              id="user-email"
              type="text"
              v-model="userF.email"
              :disabled="mode === 'save' || mode === 'remove' || mode === 'key'"
              placeholder="Informe o E-mail do Usuário..."
            />
          </b-form-group>
        </b-col>
        <b-col md="3" sm="12">
          <b-form-group label="CPF:" label-for="user-cpf">
            <the-mask
              id="user-cpf"
              :class="`form-control ${
                !cpfValid ? 'is-invalid' : cpfValid ? 'is-valid' : ''
              }`"
              type="text"
              v-model="cpfHide"
              :disabled="userF.id > 0 || mode === 'remove'"
              placeholder="Informe o CPF do usuário..."
              @input="setValidCpf"
              :mask="user.admin ? ['###########'] : ['##*.***.**#-##']"
            />
          </b-form-group>
        </b-col>
      </b-row>
      <b-row>
        <b-col
          md="4"
          sm="12"
          v-if="this.userF.id === user.id && mode === 'key'"
        >
          <b-form-group label="Senha:" label-for="user-password">
            <b-form-input
              id="user-password"
              type="password"
              v-model="userF.password"
              :placeholder="
                userF.id
                  ? 'Se uma senha não for informada, nenhuma alteração será feita...'
                  : 'Informe a Senha do Usuário...'
              "
            />
          </b-form-group>
        </b-col>
        <b-col
          md="4"
          sm="12"
          v-if="this.userF.id === user.id && mode === 'key'"
        >
          <b-form-group
            label="Confirmação de Senha:"
            label-for="user-confirm-password"
          >
            <b-form-input
              id="user-confirm-password"
              type="password"
              v-model="userF.confirmPassword"
              placeholder="Confirme a Senha do Usuário..."
            />
          </b-form-group>
        </b-col>
        <b-col md="1" sm="12" v-show="user.admin >= 1" v-if="mode != 'key'">
          <b-form-group label="Admin?" label-for="user-admin">
            <b-form-select
              id="user-admin"
              :options="admins"
              :disabled="mode === 'remove'"
              v-model="userF.admin"
            />
          </b-form-group>
        </b-col>
        <b-col md="1" sm="12" v-show="user.gestor == 1" v-if="mode != 'key'">
          <b-form-group label="Gestor?" label-for="user-gestor">
            <b-form-select
              id="user-gestor"
              :options="sn"
              :disabled="mode === 'remove'"
              v-model="userF.gestor"
            />
          </b-form-group>
        </b-col>
        <b-col md="1" sm="12" v-show="user.gestor == 1" v-if="mode != 'key'">
          <b-form-group label="Multi?" label-for="user-multiCliente">
            <b-form-select
              id="user-multiCliente"
              :options="sn"
              :disabled="mode === 'remove'"
              v-model="userF.multiCliente"
            />
          </b-form-group>
        </b-col>
        <b-col md="2" sm="12" v-show="user.admin >= 1" v-if="mode != 'key'">
          <b-form-group label="Tipo usuário:" label-for="user-tipo">
            <b-form-select
              id="user-tipo"
              :options="tipos"
              :disabled="mode === 'remove'"
              v-model="userF.tipoUsuario"
            />
          </b-form-group>
        </b-col>
        <b-col
          md="2"
          sm="12"
          v-show="user.multiCliente == 1"
          v-if="mode != 'key'"
        >
          <b-form-group label="Cliente:" label-for="user-cliente">
            <b-form-select
              id="user-cliente"
              :options="clientes"
              :disabled="mode === 'remove'"
              v-model="userF.cliente"
              @input="
                userF.cliente && userF.cliente.length
                  ? loadDominios()
                  : undefined
              "
            />
          </b-form-group>
        </b-col>
        <b-col
          md="2"
          sm="12"
          v-show="user.multiCliente == 1"
          v-if="mode != 'key'"
        >
          <b-form-group label="Domínio:" label-for="user-dominio">
            <b-form-select
              id="user-dominio"
              :options="dominios"
              :disabled="dominios.length == 0 || mode === 'remove'"
              v-model="userF.dominio"
            />
          </b-form-group>
        </b-col>
        <b-col md="3" sm="12">
          <b-row>
            <b-col
              md="6"
              sm="12"
              v-if="
                ((user.gestor == 1 || this.user.id == this.userF.id) &&
                  mode === 'save') ||
                mode === 'key'
              "
            >
              <b-form-group :label="userF.id ? 'Editando' : 'Novo usuário'">
                <b-button
                  block
                  variant="primary"
                  @click="save"
                  v-b-tooltip.hover
                  title="Salvar registro"
                  >Salvar</b-button
                >
              </b-form-group>
            </b-col>
            <b-col md="6" sm="12" v-if="user.gestor == 1 && mode === 'remove'">
              <b-form-group label="Excluíndo">
                <b-button
                  block
                  variant="outline-danger"
                  @click="remove"
                  v-b-tooltip.hover
                  title="Remover registro"
                  >Excluir</b-button
                >
              </b-form-group>
            </b-col>
            <b-col md="6" sm="12">
              <b-form-group label=".">
                <b-button
                  block
                  class="ml-2"
                  @click="reset"
                  v-b-tooltip.hover
                  title="Cancelar edição"
                  >Cancelar</b-button
                >
              </b-form-group>
            </b-col>
          </b-row>
        </b-col>
      </b-row>
    </b-form>
    <b-table
      hover
      striped
      responsive
      :items="users"
      :fields="fields"
      v-if="user.admin"
    >
      <template v-slot:cell(name)="data">
        <span v-html="data.value"></span>
      </template>
      <template v-slot:cell(dominio)="data">
        <!-- <span v-html="data.dominio"></span> -->
        {{ `${capitalize(data.item.dominio)}` }}
      </template>
      <template v-slot:cell(actions)="row">
        <b-button
          :variant="
            row.item.admin >= 1 && user.admin == 0 ? 'light' : 'outline-warning'
          "
          size="sm"
          @click="loadUser(row.item)"
          class="mr-1"
          :disabled="
            row.item.admin >= 1 && user.admin == 0 ? 'disabled' : false
          "
          v-b-tooltip.hover
          title="Editar registro"
          href="#header"
        >
          <i class="fa fa-pencil"></i>
        </b-button>
        <b-button
          :variant="
            row.item.admin >= 1 || getOwn(row.item.id)
              ? 'light'
              : 'outline-danger'
          "
          size="sm"
          @click="loadUser(row.item, 'remove')"
          class="mr-1"
          :disabled="
            row.item.admin >= 1 || getOwn(row.item.id) ? 'disabled' : false
          "
          v-b-tooltip.hover
          :title="
            getOwn(row.item.id)
              ? 'Você não pode e excluir o próprio registro'
              : row.item.admin
              ? 'Usuário Adm não pode ser removido'
              : 'Remover registro'
          "
          href="#header"
        >
          <i class="fa fa-trash"></i>
        </b-button>
        <b-button
          :variant="getOwn(row.item.id) ? 'outline-dark' : 'light'"
          size="sm"
          @click="loadUser(row.item, 'key')"
          :disabled="getOwn(row.item.id) ? false : 'disabled'"
          v-b-tooltip.hover
          :title="
            getOwn(row.item.id)
              ? 'Editar senha'
              : 'Apenas o usuário pode alterar a própria senha'
          "
          href="#header"
        >
          <i class="fa fa-key"></i>
        </b-button>
      </template>
    </b-table>
  </div>
</template>

<script>
import { userKey, showError } from "@/global";
import { baseApiUrl } from "@/env";
import { titleCase, capitalizeFirst } from "@/config/globalFacilities";
import axios from "axios";
import { mapState } from "vuex";
import { cpf } from "cpf-cnpj-validator";
import { TheMask } from "vue-the-mask";

export default {
  name: "UserAdmin",
  components: { TheMask },
  data: function () {
    return {
      userParams: {},
      mode: "save",
      userF: {},
      users: [],
      dominios: [],
      capitalize: capitalizeFirst,
      clientes: [],
      cpfHide: "",
      form_input_hide: true,
      cpfValid: false,
      tipos: [
        { value: "-1", text: "Suporte" },
        { value: "0", text: "Servidor" },
        { value: "1", text: "Consignatário" },
      ],
      sn: [
        { value: "0", text: "Não" },
        { value: "1", text: "Sim" },
      ],
      admins: [
        { value: "0", text: "Não" },
        { value: "1", text: "Supt" },
        { value: "2", text: "Dev" },
      ],
      alcadas: [
        { value: "0", text: "Acesso Negado" },
        { value: "1", text: "Pesquisa" },
        { value: "2", text: "Insere" },
        { value: "3", text: "Edita" },
        { value: "4", text: "Exclui" },
      ],
      fields: [
        {
          key: "id",
          label: "Código",
          sortable: true,
          thClass: "d-none",
          tdClass: "d-none",
        },
        {
          key: "name",
          label: "Nome",
          sortable: true,
          formatter: (value) => titleCase(value),
        },
        { key: "email", label: "E-mail", sortable: true },
        {
          key: "gestor",
          label: "Gestor",
          sortable: true,
          formatter: (value) => (value == "1" ? "Sim" : "Não"),
        },
        {
          key: "tipoUsuario",
          label: "Tipo usuário",
          sortable: true,
          formatter: (value) =>
            value == "0"
              ? "Servidor"
              : value == "1"
              ? "Consignatário"
              : "Suporte",
        },
        { key: "dominio", label: "Domínio", sortable: true },
        { key: "actions", label: "Ações", thClass: "col-actions3" },
      ],
    };
  },
  methods: {
    getOwn(id) {
      return id == this.user.id;
    },
    getGetAlcadasLabel(value) {
      let status = "";
      switch (value) {
        case 1:
          status = "Pode Pesquisar";
          break;
        case 2:
          status = "Pode Inserir";
          break;
        case 3:
          status = "Pode Editar";
          break;
        case 4:
          status = "Pode Excluir";
          break;
        default:
          status = "Acesso negado";
          break;
      }
      return status;
    },
    loadClientes() {
      const param = {
        dominio: "root",
        meta: "clientName",
        forceDominio: true,
      };
      axios.post(`${baseApiUrl}/params`, param).then((res) => {
        this.clientes = res.data.data.map((data) => {
          return {
            value: data.value,
            text: capitalizeFirst(data.label.replace("_", " ")),
          };
        });
      });
    },
    loadDominios() {
      const param = {
        dominio: this.userF.cliente,
        meta: "domainName",
        forceDominio: true,
      };
      axios.post(`${baseApiUrl}/params`, param).then((res) => {
        this.dominios = res.data.data.map((data) => {
          return {
            value: data.value,
            text: capitalizeFirst(data.label.replace("_", " ")),
          };
        });
      });
    },
    loadUsers() {
      const url = `${baseApiUrl}/users`;
      axios.get(url).then((res) => {
        this.users = res.data;
        if (this.users.length == 1) this.loadUser(this.users[0]);
      });
    },
    reset() {
      if (this.user.admin >= 1) {
        this.mode = "save";
        this.userF = {};
        this.form_input_hide = true;
        this.loadUsers();
        this.dominios = [];
        this.clientes = [];
      } else this.$router.push({ path: "/" });
    },
    save() {
      const method = this.userF.id ? "put" : "post";
      const id = this.userF.id ? `/${this.userF.id}` : "";
      const url = `${baseApiUrl}/users${id}`;
      axios[method](url, this.userF)
        .then(() => {
          // Caso o update esteja senho feita no mesmo usuário logado
          // então renova a variável localStorage: userKey
          if (this.userF.id === this.user.id) {
            // user.reload dispensa a validação de usuário e senha
            // e deve ser usada apenas nesse caso
            this.userF.reload = true;
            axios
              .post(`${baseApiUrl}/signin`, this.userF)
              .then((res) => {
                this.$store.commit("setUser", res.data);
                localStorage.removeItem(userKey);
                localStorage.setItem(userKey, JSON.stringify(res.data));
                this.$store.commit("setUser", null);
                this.$toasted.global.defaultSuccess();
                this.$router.push({ path: "/" });
                location.reload();
              })
              .catch(showError);
          } else {
            this.loadUsers();
            this.$toasted.global.defaultSuccess();
          }
        })
        .catch(showError);
    },
    remove() {
      const id = this.userF.id;
      axios
        .delete(`${baseApiUrl}/users/${id}`)
        .then(() => {
          this.$toasted.global.defaultSuccess();
          this.reset();
        })
        .catch(showError);
    },
    loadUser(userF, mode = "save") {
      this.mode = mode;
      this.userF = { ...userF };
      const cpf = this.userF.cpf;
      this.cpfHide = `${cpf.substring(0, 2)}${cpf.substring(
        8,
        9
      )}-${cpf.substring(9)}`;
      this.form_input_hide = false;
      if (mode != "remove") this.userF.confirmPassword = this.userF.password;
      if (mode === "key")
        this.userF.confirmPassword = this.userF.password = null;
    },
    setValidCpf() {
      if (this.userF.cpf.length == 11) {
        // valida o CPF
        this.cpfValid = cpf.isValid(this.userF.cpf);
      } else this.cpfValid = false;
    },
    loadUserParams() {
      const url = `${baseApiUrl}/users/${this.user.id}`;
      axios.get(url).then((res) => {
        this.userParams = res.data;
      });
    },  
  },
  mounted() {
    this.loadUsers();
    this.loadUserParams();
    this.loadClientes();
  },
  computed: mapState(["user"]),
};
</script>

<style>
.alcada0 {
  color: #212529;
}
.alcada1 {
  color: #28a745;
}
.alcada2 {
  color: #007bff;
}
.alcada3 {
  color: #ffc107;
}
.alcada4 {
  color: #dc3545;
}
.alcadas {
  text-align: center;
}
</style>
