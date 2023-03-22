<template>
  <div class="contracts-panel">
    <PageTitle icon="fa fa-cogs" main="Administração de Contratos" sub="Contratos, parcelas & Cia" />
    <div class="contracts-panel-tabs">
      <b-card no-body id="contracts-panel">
        <b-tabs card>
          <b-tab title="Contratos">
            <ContratosGrid ref="ContratosGrid" />
          </b-tab>
        </b-tabs>
      </b-card>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import ContratosGrid from "./ContratosGrid";
import PageTitle from "../template/PageTitle";

export default {
  name: "ContrAdminPanels",
  components: { ContratosGrid, PageTitle },
  data: function () {
    return {
    };
  },
  methods: {
  },
  mounted() {
  },
  computed: mapState(["user"]),
};
</script>

<style>
</style>