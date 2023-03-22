<template>
  <div>
    <!-- :reduce="(label) => label.code" -->
    <v-select
      multiple
      :options="availableOptions"
      v-model="values"
      required
      :placeholder="placeHolder"
      @input="charge"
    >
      <div slot="no-options">
        A opção digitada não existe!!! Tente novamente...
      </div>
    </v-select>
  </div>
</template>

<script>
export default {
  name: "FormTagSearch",
  props: ["value", "options", "placeholder"],
  data: function () {
    return {
      values: [],
      placeHolder: this.placeholder || "Escolha alguma opção...",
    };
  },
  methods: {
    charge() {
      this.$emit("loadInput", this.values);
    },
    reset() {
      this.$emit("loadInput", []);
      this.values = [];
    },
  },
  computed: {
    availableOptions() {
      return this.options.filter((opt) => this.values.indexOf(opt) === -1);
    },
  },
  mounted() {
    this.values = this.value;
  },
};
</script>

<style>
</style>