<template>
  <div class="user-admin">
    <b-form :hidden="form_input_hide">
      <input id="user-id" type="hidden" v-model="userF.id" />
      <b-row>
        <b-col md="3" sm="12">
          <b-form-group label="Nome:" label-for="user-name">
            <b-form-input id="user-name" type="text" v-model="userF.name" v-if="userParams.admin >= 2"
              placeholder="Informe o Nome do Usuário..." />
            <span v-else class="form-control">{{ userF.name }}</span>
          </b-form-group>
        </b-col>
        <b-col md="2" sm="12">
          <b-form-group label="Telefone:" label-for="user-telefone">
            <the-mask v-if="userParams.admin >= 2" id="user-telefone" class="form-control" type="text"
              v-model="userF.telefone" :mask="['(##) #########']" placeholder="Informe o Telefone do usuário..."
              :disabled="['remove', 'key'].includes(mode)" />
            <span v-else class="form-control disabled">{{ userF.telefone }}</span>
          </b-form-group>
        </b-col>
        <b-col md="3" sm="12">
          <b-form-group label="E-mail:" label-for="user-email">
            <b-form-input v-if="userParams.admin >= 2" id="user-email" type="text" v-model="userF.email"
              :disabled="userParams.admin < 2" placeholder="Informe o E-mail do Usuário..." />
            <span v-else class="form-control">{{ userF.email ? userF.email : 'Não declarado' }}</span>
          </b-form-group>
        </b-col>
        <b-col md="2" sm="12" v-if="userParams.gestor >= 1">
          <b-form-group label="." label-for="user-name" label-class="invis">
            <b-form-checkbox switch size="lg" v-model="userF.gestor" id="user-gestor"
              :disabled="userF.id == userParams.id || userParams.gestor < 1">
              Gestor
            </b-form-checkbox>
          </b-form-group>
        </b-col>
        <b-col md="2" sm="12">
          <b-form-group label="." label-for="user-averbaOnline" label-class="invis">
            <b-form-checkbox switch size="lg" v-model="userF.averbaOnline" id="user-averbaOnline"
              :disabled="userParams.gestor < 1">
              Averba Online
            </b-form-checkbox>
          </b-form-group>
        </b-col>
        <b-col md="2" sm="12" v-if="userParams.admin >= 1">
          <b-form-group label="Multi Cliente (Suporte)" label-for="user-multiCliente">
            <b-form-select :options="multiCli" v-model="userF.multiCliente" id="user-multiCliente"
              :disabled="!(userParams.gestor >= 1 && userParams.tipoUsuario == 2)">
              Multi Cliente
            </b-form-select>
          </b-form-group>
        </b-col>
        <b-col md="2" sm="12" v-if="userParams.admin >= 1">
          <b-form-group label="Tipo Usuário" label-for="user-tipoUsuario">
            <b-form-select :options="tipos" v-model="userF.tipoUsuario" id="user-tipoUsuario">
              Tipo Usuário
            </b-form-select>
          </b-form-group>
        </b-col>
        <b-col md="2" sm="12" v-if="userParams.gestor >= 1">
          <b-form-group label="Cadastros" label-for="user-cad_servidores">
            <b-form-select :options="alcadas" v-model="userF.cad_servidores" id="user-cad_servidores"
              :disabled="!(userParams.gestor >= 1 && userParams.tipoUsuario == 2)">
              Cadastros
            </b-form-select>
          </b-form-group>
        </b-col>
        <b-col md="2" sm="12" v-if="userParams.gestor >= 1">
          <b-form-group label="Financeiro" label-for="user-financeiro">
            <b-form-select :options="alcadas" v-model="userF.financeiro" id="user-financeiro"
              :disabled="!(userParams.gestor >= 1 && userParams.tipoUsuario == 2)">
              Financeiro
            </b-form-select>
          </b-form-group>
        </b-col>
        <b-col md="2" sm="12" v-if="userParams.gestor >= 1">
          <b-form-group label="Contratos" label-for="user-con_contratos">
            <b-form-select :options="alcadas" v-model="userF.con_contratos" id="user-con_contratos"
              :disabled="!(userParams.gestor >= 1 && userParams.tipoUsuario >= 1)">
              Contratos
            </b-form-select>
          </b-form-group>
        </b-col>
        <b-col md="2" sm="12" v-if="userParams.gestor >= 1">
          <b-form-group label="Orgão" label-for="user-cad_orgao">
            <b-form-select :options="alcadas" v-model="userF.cad_orgao" id="user-cad_orgao"
              :disabled="!(userParams.gestor >= 1 && userParams.tipoUsuario == 2)">
              Orgão
            </b-form-select>
          </b-form-group>
        </b-col>
        <b-col md="2" sm="12" v-if="
          (user.id == userF.id || userParams.gestor == 1) && mode !== 'remove'
        ">
          <b-form-group :label="userF.id ? 'Editando' : 'Novo usuário'">
            <b-button block variant="primary" @click="save" v-b-tooltip.hover title="Salvar registro">Salvar</b-button>
          </b-form-group>
        </b-col>
        <b-col md="2" sm="12" v-if="userParams.gestor == 1 && mode === 'remove'">
          <b-form-group label="Excluíndo">
            <b-button block variant="outline-danger" @click="remove" v-b-tooltip.hover title="Remover registro">Excluir
            </b-button>
          </b-form-group>
        </b-col>
        <b-col md="2" sm="12">
          <b-form-group label="." label-class="invis">
            <b-button block class="" @click="reset" v-b-tooltip.hover title="Cancelar edição">Cancelar</b-button>
          </b-form-group>
        </b-col>
      </b-row>
    </b-form>

    <b-input-group size="md" class="mb-1" v-if="userParams.gestor + userParams.admin >= 1">
      <b-form-input type="text" placeholder="Digite aqui: nome" title="Para CPF, utilize apenas números"
        v-b-tooltip.hover v-model="keyword" @input="loadUsers" ref="keyword" />
      <template #prepend>
        <b-input-group-text><i class="fa fa-search"></i></b-input-group-text>
      </template>
      <b-input-group-text slot="append">
        <span class>{{ keyword_res }}&nbsp;</span>
      </b-input-group-text>
      <b-btn slot="append" variant="outline-info" size="sm" @click="reset">Limpar</b-btn>
    </b-input-group>
    <b-table hover striped responsive :items="users" :fields="fields" v-if="userParams.gestor + userParams.admin >= 1">
      <template v-slot:cell(name)="data">
        <span v-html="data.value"></span>
      </template>
      <template v-slot:cell(dominio)="data">
        <!-- <span v-html="data.dominio"></span> -->
        {{ `${capitalize(data.item.dominio)}` }}
      </template>
      <template v-slot:cell(actions)="row">
        <b-button :variant="
          row.item.admin >= 1 && userParams.admin == 0
            ? 'light'
            : 'outline-warning'
        " size="sm" @click="loadUser(row.item)" class="mr-1" :disabled="
          row.item.admin >= 1 && userParams.admin == 0 ? 'disabled' : false
        " v-b-tooltip.hover title="Editar registro" href="#header">
          <i class="fa fa-pencil"></i>
        </b-button>
        <b-button :variant="
          row.item.admin >= 1 || getOwn(row.item.id)
            ? 'light'
            : 'outline-danger'
        " size="sm" @click="loadUser(row.item, 'remove')" class="mr-1" :disabled="
          row.item.admin >= 1 || getOwn(row.item.id) ? 'disabled' : false
        " v-b-tooltip.hover :title="
          getOwn(row.item.id)
            ? 'Você não pode e excluir o próprio registro'
            : row.item.admin
              ? 'Usuário Adm não pode ser removido'
              : 'Remover registro'
        " href="#header">
          <i class="fa fa-trash"></i>
        </b-button>
        <b-button :variant="getOwn(row.item.id) ? 'outline-dark' : 'light'" size="sm" @click="requestPassReset"
          :disabled="getOwn(row.item.id) ? false : 'disabled'" v-b-tooltip.hover :title="
            getOwn(row.item.id)
              ? 'Editar senha'
              : 'Apenas o usuário pode alterar a própria senha'
          " href="#header">
          <i class="fa fa-key"></i>
        </b-button>
      </template>
    </b-table>
    <b-pagination size="md" v-model="page" :total-rows="count" :per-page="limit"
      v-if="userParams.gestor + userParams.admin >= 1" />
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
      keyword: "",
      keyword_res: "",
      page: 1,
      limit: 0,
      count: 0,
      tipos: [
        { value: "0", text: "Servidor" },
        { value: "1", text: "Consignatário" },
        { value: "2", text: "Operador" },
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
      multiCli: [
        { value: "0", text: "Não (0)" },
        { value: "1", text: "Troca Domínio (1)" },
        { value: "2", text: "Troca Cliente (2)" },
      ],
      alcadas: [
        { value: "0", text: "Acesso Negado" },
        { value: "1", text: "Pesquisa" },
        { value: "2", text: "Insere" },
        { value: "3", text: "Edita" },
        { value: "4", text: "Adm (pode excluir)" },
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
          key: "averbaOnline", label: "Averba", sortable: true,
          formatter: (value) => (value == "1" ? "Sim" : "Não"),
        },
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
                : "Operador",
        },
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
      const url = `${baseApiUrl}/users?page=${this.page}&key=${this.keyword}`;
      axios.get(url).then((res) => {
        this.users = res.data.data;
        if (this.users.length == 1) this.loadUser(this.users[0])
        else {
          this.userF = {}
          this.form_input_hide = true;
        }
        this.count = res.data.count;
        this.limit = res.data.limit;
        this.keyword_res = `#${this.count}`;
      });
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
              .catch((err) => {
                showError(err);
              });
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
      this.userF.gestor = this.userF.gestor == 1;
      this.userF.averbaOnline = this.userF.averbaOnline == 1;
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
    requestPassReset() {
      const userReq = {
        cpf: this.user.cpf,
      };
      axios
        .post(`${baseApiUrl}/request-password-reset`, userReq)
        .then(() => {
          this.$toasted.global.defaultRequestPassword();
        })
        .catch(showError);
    },
    reset() {
      this.keyword = "";
      this.page = 1;
      this.limit = 0;
      this.count = 0;
      if (this.userParams.admin >= 1) {
        this.mode = "save";
        this.userF = {};
        this.form_input_hide = true;
        this.loadUsers();
        this.dominios = [];
        this.clientes = [];
      } else this.$router.push({ path: "/" });
    },
  },
  mounted() {
    this.loadUsers();
    this.loadUserParams();
    this.loadClientes();
  },
  watch: {
    page() {
      this.loadUsers();
    },
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
