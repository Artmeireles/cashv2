<script setup>
import { useLayout } from '@/layout/composables/layout';
import { computed } from 'vue';
import { softwareHouse } from '@/global';

const { layoutConfig } = useLayout();

const logoUrl = computed(() => {
    return `/assets/images/logo-app.svg`;
});
</script>

<template>
    <div class="layout-footer">
        <img :src="logoUrl" alt="Logo" height="20" class="mr-2" />
        by
        <span class="font-medium ml-2">{{ softwareHouse }}</span>
    </div>
</template>
<style lang="scss" scoped></style>
