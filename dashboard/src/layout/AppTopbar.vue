<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useToast } from 'primevue/usetoast';
import { appName } from '@/global';

const toast = useToast();

const { onMenuToggle } = useLayout();

const outsideClickListener = ref(null);
const topbarMenuActive = ref(false);
const router = useRouter();
const items = [
    {
        label: 'Ver perfil',
        icon: 'pi pi-refresh',
        command: () => {
            toast.add({ severity: 'info', summary: 'Success', detail: 'Ver perfil', life: 3000 });
        }
    },
    {
        label: 'Sair do sistema',
        icon: 'pi pi-times',
        command: () => {
            logout();
        }
    },
    {
        label: 'Trocar senha',
        icon: 'pi pi-external-link',
        command: () => {
            router.push({ path: '/request-password-reset' });
        }
    }
];

const logout = () => {
    useUserStore().logout();
    location.reload();
};

onMounted(() => {
    bindOutsideClickListener();
});

onBeforeUnmount(() => {
    unbindOutsideClickListener();
});

const logoUrl = computed(() => {
    return `assets/images/logo-app.svg`;
});

const onTopBarMenuButton = () => {
    topbarMenuActive.value = !topbarMenuActive.value;
};
const onSettingsClick = () => {
    topbarMenuActive.value = false;
    router.push('/documentation');
};
const topbarMenuClasses = computed(() => {
    return {
        'layout-topbar-menu-mobile-active': topbarMenuActive.value
    };
});

const bindOutsideClickListener = () => {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                topbarMenuActive.value = false;
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
};
const unbindOutsideClickListener = () => {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener);
        outsideClickListener.value = null;
    }
};
const isOutsideClicked = (event) => {
    if (!topbarMenuActive.value) return;

    const sidebarEl = document.querySelector('.layout-topbar-menu');
    const topbarEl = document.querySelector('.layout-topbar-menu-button');

    return !(sidebarEl.isSameNode(event.target) || sidebarEl.contains(event.target) || topbarEl.isSameNode(event.target) || topbarEl.contains(event.target));
};
const menu = ref();
const toggle = (event) => {
    menu.value.toggle(event);
};
const toggleAppConfig = () => {
    const btn = document.getElementById('btnTglAppConfig');
    if (btn) {
        btn.click();
    }
};
</script>

<template>
    <div class="layout-topbar">
        <router-link to="/" class="layout-topbar-logo">
            <img :src="logoUrl" alt="logo" />
            <span>{{ appName }}</span>
        </router-link>

        <button class="p-link layout-menu-button layout-topbar-button" @click="onMenuToggle()">
            <i class="pi pi-bars"></i>
        </button>

        <button class="p-link layout-topbar-menu-button layout-topbar-button" @click="onTopBarMenuButton()">
            <i class="pi pi-ellipsis-v"></i>
        </button>

        <div class="layout-topbar-menu" :class="topbarMenuClasses">
            <Button type="button" label="Toggle" @click="toggle" aria-haspopup="true" aria-controls="overlay_menu" class="p-link layout-topbar-button">
                <i class="pi pi-user"></i>
                <span>Perfil</span>
            </Button>
            <Menu ref="menu" id="overlay_menu" :model="items" :popup="true" />
            <button @click="toggleAppConfig()" class="p-link layout-topbar-button">
                <i class="pi pi-cog"></i>
                <span>Configurações</span>
            </button>
        </div>

        <Toast />
    </div>
</template>

<style lang="scss" scoped></style>
