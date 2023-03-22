<template>
  <div>
    <b-modal
      size="xl"
      id="modalForm"
      ref="modalForm"
      hide-footer
      centered
      :title="title"
    >
      <div class="d-block">
        <ComPvOat :pvoat="obj" :mode="mode" @objId="setObjRet" />
      </div>
    </b-modal>
  </div>
</template>

<script>
import ComPvOat from "../comercialPV/ComPvOat";

export default {
  name: "ModalForm",
  props: ["title", "obj", "mode"],
  components: { ComPvOat },
  data: function () {
    return {};
  },
  methods: {
    showModal() {
      this.$refs["modalForm"].show();
    },
    setObjRet() {
      this.$emit("objId", this.obj.id_pv);
      this.hideModal();
    },
    hideModal() {
      this.$refs["modalForm"].hide();
    },
  },
  mounted() {},
};
</script>