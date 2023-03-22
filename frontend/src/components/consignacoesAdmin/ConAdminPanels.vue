<template>
  <div class="consignations-panel">
    <PageTitle
      icon="fa fa-cogs"
      main="Administração de Consignados"
      sub="Liquidações, Consignatários & Cia"
    />
    <div class="consignations-panel-tabs">
      <b-card no-body id="consignations-panel">
        <b-tabs card>
          <b-tab title="Liquidações" @click="clickConLiquidationsData">
            <ConLiquidationsData
              ref="ConLiquidationsData"
              @click="clickConLiquidationsData"
            />
          </b-tab>
        </b-tabs>
      </b-card>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import ConLiquidationsData from "./ConLiquidationsData";
import PageTitle from "../template/PageTitle";

export default {
  name: "ConAdminPanels",
  components: { ConLiquidationsData, PageTitle },
  data: function () {
    return {
    };
  },
  methods: {
    clickConLiquidationsData: function () {
      this.$refs.ConLiquidationsData.loadContratos();
    },
  },
  mounted() {
  },
  computed: mapState(["user"]),
};
</script>

<style>
</style>