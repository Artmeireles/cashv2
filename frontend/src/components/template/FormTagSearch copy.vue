<template>
  <div>
    <b-form-tags
      v-model="values"
      size="lg"
      add-on-change
      no-outer-focus
      class="mb-2"
      @input="charge"
    >
      <template
        v-slot="{ tags, inputAttrs, inputHandlers, disabled, removeTag }"
      >
        <ul v-if="tags.length > 0" class="list-inline d-inline-block mb-2">
          <li v-for="tag in tags" :key="tag" class="list-inline-item">
            <b-form-tag
              @remove="removeTag(tag)"
              :title="tag"
              :disabled="disabled"
              variant="info"
              >{{ tag }}</b-form-tag
            >
          </li>
        </ul>
        <b-input-group>
          <b-form-select
            v-bind="inputAttrs"
            v-on="inputHandlers"
            :disabled="disabled || availableOptions.length === 0"
            :options="availableOptions"
          >
            <template #first>
              <!-- This is required to prevent bugs with Safari -->
              <option disabled value="">{{ placeHolder }}</option>
            </template>
          </b-form-select>
          <b-input-group-append>
            <b-button
              variant="outline-info"
              title="Limpar filtro"
              @click="reset"
              v-b-tooltip.hover
              >X</b-button
            >
          </b-input-group-append>
        </b-input-group>
      </template>
    </b-form-tags>  
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