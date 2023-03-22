<template>
  <b-breadcrumb :items="items"></b-breadcrumb>
</template>

<script>
export default {
  name: "BreadCrumb",
  props: ["items"],
};
</script>