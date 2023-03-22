<template>
  <div class="sis_event-admin">
    <!-- <div class="item sis_events-details">
      <b-form>
        <input id="sis_event-id" type="hidden" v-model="sis_event.id" />
        <b-row>
          <b-col md="12">
            <b-form-group label="Evento:" class="search_input" :hidden="search_input_hide" label-for="sis_event-name">
              <p class="evt-content" v-html="sis_event.evento"></p>
              <b-button class="mb-3" @click="reset">Ocultar</b-button>
            </b-form-group>
          </b-col>
        </b-row>
      </b-form>
    </div> -->
    <b-row>
      <b-col md="6">
        <b-form-group label="Filtrar por Classe de evento">
          <FormTagSearch @loadInput="chargeTagClasses" :value="valueClasses" :options="optionsClasses" />
        </b-form-group>
      </b-col>
      <b-col md="6">
        <b-form-group label="Filtrar por tabelas">
          <FormTagSearch @loadInput="chargeTagTabelas" :value="valueTabelas" :options="optionsTabelas" />
        </b-form-group>
      </b-col>
    </b-row>
    <b-input-group size="md" class="mt-3 mb-3">
      <b-form-input type="text" placeholder="Digite aqui para filtrar um evento (ao menos quatro caracteres)" v-model.lazy="keyword"
        @input="loadSisEvents" />
      <b-input-group-text slot="append">
        <span class>{{ keyword_res }}&nbsp;</span>
        <b-btn :disabled="!keyword" variant="link" size="sm" @click="getRefresh" class="p-0">
          <i class="fa fa-remove"></i>
        </b-btn>
      </b-input-group-text>
    </b-input-group>
    <b-table hover striped responsive :items="sis_events" :fields="fields">
      <template v-slot:cell(evento)="data">
        <span v-html="data.value"></span>
      </template>
      <!-- <template v-slot:cell(actions)="row">
        <b-button variant="outline-info" size="sm" @click="loadSisEvent(row.item)" class="mr-1" v-b-tooltip.hover
          title="Ver registro">
          <i class="fa fa-eye"></i>
        </b-button>
      </template> -->
    </b-table>
    <b-pagination size="md" v-model="page" :total-rows="count" :per-page="limit" />
  </div>
</template>

<script>
import { baseApiUrl } from "@/env";
import axios from "axios";
import { mapState } from "vuex";
import moment from "moment";
import FormTagSearch from "../template/FormTagSearch";

export default {
  name: "SisEventsAdmin",
  components: { FormTagSearch },
  data: function () {
    return {
      userParams: {},
      filter: "",
      keyword: "",
      keyword_res: "",
      search_input_hide: true,
      sis_event: {},
      sis_events: [],
      optionsTabelas: [],
      valueTabelas: [],
      optionsClasses: [],
      valueClasses: [],
      page: 1,
      limit: 0,
      count: 0,
      fields: [
        { key: "id", label: "Código", sortable: true },
        { key: "evento", label: "Evento", sortable: true },
        { key: "classevento", label: "Classe", sortable: true },
        { key: "user", label: "Usuário", sortable: true },
        { key: "tabela_bd", label: "Tabela", sortable: true },
        { key: "id_registro", label: "Registro", sortable: true },
        {
          key: "created_at",
          label: "Data",
          sortable: true,
          formatter: (value) => moment(value).format("DD-MM-YYYY hh:mm:ss"),
        },
        // { key: "actions", label: "Ações" },
      ],
    };
  },
  methods: {
    loadSisEvents() {
      if (this.keyword.length == 0 || this.keyword.length >= 4) {
        const url = `${baseApiUrl}/sis-events?page=${this.page}&key=${this.keyword}&tabelas_bd=${this.valueTabelas}&classevento=${this.valueClasses}`;
        axios.get(url).then((res) => {
          this.sis_events = res.data.data;
          this.count = res.data.count;
          this.limit = res.data.limit;
          const pluralize = this.count > 1 ? "s" : "";
          this.keyword_res = `${this.count} resultado${pluralize}`;
        });
      }
    },
    loadTabelas(fieldToSearch) {
      const url = `${baseApiUrl}/sis-events/${fieldToSearch}`;
      axios.get(url).then((res) => {
        this.optionsTabelas = res.data.data.map((data) => {
          return data.field;
        });
      });
    },
    loadClasses(fieldToSearch) {
      const url = `${baseApiUrl}/sis-events/${fieldToSearch}`;
      axios.get(url).then((res) => {
        this.optionsClasses = res.data.data.map((data) => {
          return data.field;
        });
      });
    },
    chargeTagTabelas(valueTabelas) {
      this.valueTabelas = valueTabelas;
      this.loadSisEvents();
    },
    chargeTagClasses(valueClasses) {
      this.valueClasses = valueClasses;
      this.loadSisEvents();
    },
    reset() {
      this.search_input_hide = true;
      this.mode = "save";
      this.sis_event = {};
      this.valueTabelas = [];
      this.valueClasses = [];
      this.loadSisEvents();
    },
    getRefresh() {
      this.keyword = "";
      const url = `${baseApiUrl}/sis-events?page=1`;
      axios(url).then((res) => (this.sis_events = res.data.sis_events));
      this.page = 1;
    },
    // loadSisEvent(sis_event, mode = "save") {
    //   this.mode = mode;
    //   this.sis_event = { ...sis_event };
    //   this.search_input_hide = false;
    // },
    loadUserParams() {
      const url = `${baseApiUrl}/users/${this.user.id}`;
      axios.get(url).then((res) => {
        this.userParams = res.data;
      });
    },
  },
  mounted() {
    this.loadTabelas("tabela_bd");
    this.loadClasses("classevento");
    this.loadSisEvents();
    this.loadUserParams();
  },
  watch: {
    page() {
      this.loadSisEvents();
    },
  },
  computed: mapState(["user"]),
};
</script>

<style scoped>
.sis_events-details {
  position: -webkit-sticky;
  position: sticky;
  top: 4rem;
  background-color: rgba(37, 56, 163, 0.959);
  border-radius: 5px;
  z-index: 9999;
}

.evt-content {
  background-color: #ffffff;
}

.search_input {
  margin: 0 auto;
  width: 98%;
}

.search_input label {
  color: #fff;
}

.input-group {
  margin: 0 auto;
  width: 100%;
}

.input-group-text {
  padding: 0 0.5em 0 0.5em;
}

.input-group-text .fa {
  font-size: 12px;
}
</style>
