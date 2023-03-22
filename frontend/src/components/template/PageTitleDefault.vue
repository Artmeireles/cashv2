<template>
  <div class="page-title">
    <h1><i v-if="icon" :class="icon"></i> {{ main }}</h1>
    <h2>{{ sub }}</h2>
    <hr />
  </div>
</template>

<script>
export default {
  name: "PageTitleDefault",
  props: ["icon", "main", "sub"],
  components: {},
  data: function () {
    return {
      userParams: {},
      dominios: [],
      keyword: "",
    };
  },
  methods: {},
  mounted() {},
};
</script>

<style>
.page-title h1 {
  margin: 0px;
  color: #3a1413d8;
}

.page-title h2 {
  color: #3a1413c2;
  margin-top: 5px;
  font-size: 1.3rem;
}

.search {
  max-width: 50%;
}
</style>
