<template>
  <div class="document-validation">
    <PageTitleDefault
      icon="fa fa-cogs"
      :main="document.pageTitle"
      :sub="document.pageSubTitle"
    />
    <div class="document-validation-viewer">
      <b-row>
        <b-col offset-xl="3" xl="6" offset-lg="2" lg="8" offset-md="1" md="10">
          <b-card
            :title="document.panelTitle"
            :sub-title="document.panelSubTitle"
          >
            <b-card-text
              v-if="document && document.id"
              v-html="document.panelText"
            />
            <b-card-text v-else>
              <p>Não foi localizado um documento com o token informado</p>
              <p>
                <strong>Token:</strong>
                {{
                  this.$route.params && this.$route.params.tk
                    ? "" + this.$route.params.tk
                    : " inválido ou não informado."
                }}
              </p>
              <p>Por favor, verifique e tente novamente.</p>
            </b-card-text>
          </b-card>
        </b-col>
      </b-row>
    </div>
  </div>
</template>

<script>
import { baseApiUrl } from "@/env";
import axios from "axios";
import PageTitleDefault from "../template/PageTitleDefault";
import moment from "moment";

export default {
  name: "Validator",
  components: { PageTitleDefault },
  data: function () {
    return {
      title: "",
      document: {},
    };
  },
  methods: {
    getValidation(token = null) {
      const tk = Buffer.from(token, "base64").toString("ascii").split("_");
      const url = `${baseApiUrl}/validator/${tk[0]}/${token}`;
      axios.get(url).then((res) => {
        this.document = res.data.data;
      });
    },
    getLabel(array, key) {
      const item = array.filter((it) => it.value == key);
      return item && item[0] && item[0].text ? item[0].text : "";
    },
    setDataPt(data) {
      return moment(data, "YYYY-MM-DD").format("DD/MM/YYYY");
    },
    showModal() {
      this.$refs.modalForm.show();
    },
  },
  mounted() {
    this.getValidation(this.$route.params.tk);
  },
};
</script>

<style>
.client-presentation {
  padding: 3px;
}
</style>