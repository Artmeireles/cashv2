<!-- eslint-disable vue/multi-word-component-names -->
<template>
    <div
        style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
        <div class="grid grid-nogutter surface-section text-800" style="border-radius: 53px">
            <div class="col-12 md:col-6 p-6 text-center md:text-left flex align-items-center">
                <section>
                    <span class="block text-6xl font-bold mb-1">
                        Bem vindo ao {{ appName }}<small><sup>&copy;</sup></small>
                    </span>
                    <div class="text-6xl text-primary font-bold mb-3">Folhas de Pagamento e Consignados</div>
                    <p class="mt-0 mb-4 text-700 line-height-3">Mega Assessoria e Tecnologia &copy; 2001 - {{ getYear() }}
                    </p>

                    <Button @click="router.push('/signin')" v-if="!store.userStore.id"
                        class="p-button-text p-button-rounded border-none font-light line-height-2 text-blue-500">
                        Entrar&nbsp;<i class="pi pi-sign-in"></i>
                    </Button>
                    <Button label="Sign Out" @click="logout" v-else
                        class="p-button-rounded border-none ml-5 font-light text-white line-height-2 bg-blue-500">
                        <i class="pi pi-sign-out"></i>&nbsp;Sair
                    </Button>
                    <Button @click="router.push('/signup')" v-if="!store.userStore.id"
                        class="p-button-rounded border-none ml-5 font-light text-white line-height-2 bg-blue-500">
                        Inscrever-se&nbsp;<i class="pi pi-user-plus"></i>
                    </Button>
                    <!-- <p>Time on: {{ store.userStore.timeLogged }}</p>
                    <p>Time out: {{ store.userStore.timeToLogOut }}</p> -->
                </section>
            </div>
            <div class="col-12 md:col-6 overflow-hidden">
                <img src="/assets/images/logo-app.svg" alt="Image" class="imgApp align-items-center">
            </div>
        </div>
    </div>
</template>

<script setup>
import { appName } from "@/global"
import { useUserStore } from "@/stores/user"
import { useRouter } from 'vue-router'

const router = useRouter()

const store = useUserStore()

const getYear = () => {
    const date = new Date()
    return date.getFullYear()
}

const logout = () => {
    useUserStore().logout()
}
</script>

<style scope>
.imgApp {
    clip-path: polygon(0% 0, 100% 0%, 100% 100%, 0 100%);
    width: 70%;
    padding: 2rem;
}
</style>