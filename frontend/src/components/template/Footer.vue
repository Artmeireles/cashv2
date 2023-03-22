<template>
  <footer class="footer">
    <span>
      Copyright <strong>MG Cash</strong> © {{ year }} -
      <strong>Mega Assessoria</strong> © 2001 - {{ year }}
    </span>
  </footer>
</template>

<script>
export default {
  name: "Footer",
  data: function () {
    return {
      year: "",
    };
  },
  methods: {
    getYear() {
      this.year = new Date().getFullYear();
    },
  },
  mounted() {
    this.getYear();
  },
};
</script>

<style>
.footer {
  grid-area: footer;
  background-color: #ddd;
  color: #333;

  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
}
</style>
