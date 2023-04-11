<template>
    <div class="grid grid-nogutter surface-section text-800">
        <div class="col-12 md:col-6 p-6 text-center md:text-left flex align-items-center ">
            <section>
                <span class="block text-6xl font-bold mb-1">
                    Bem vindo ao {{ appName }}<small><sup>&copy;</sup></small>
                </span>
                <div class="text-6xl text-primary font-bold mb-3">Folhas de Pagamento e Consignados</div>
                <p class="mt-0 mb-4 text-700 line-height-3">Mega Assessoria e Tecnologia &copy; 2001 - {{ getYear() }}</p>

                <Button label="SignIn" @click="this.$router.push('/signin')"
                    class="p-button-text p-button-rounded border-none font-light line-height-2 text-blue-500"
                    icon="pi-sign-in">
                    SignIn&nbsp;<i class="pi pi-sign-in"></i>
                </Button>
                <Button @click="this.$router.push('/signup')"
                    class="p-button-rounded border-none ml-5 font-light text-white line-height-2 bg-blue-500">
                    SignUp&nbsp;<i class="pi pi-user-plus"></i>
                </Button>

            </section>
        </div>
        <div class="col-12 md:col-6 overflow-hidden">
            <img src="/assets/images/logo.png" alt="Image" class="imgApp align-items-center" style="imgApp">
        </div>
    </div>
</template>

<script setup>
import { appName } from "@/global"

const getYear = () => {
    const date = new Date()
    return date.getFullYear()
}
</script>

<style scope>
.imgApp {
    clip-path: polygon(0% 0, 100% 0%, 100% 100%, 0 100%);
    width: 100%;
    padding: 2rem;
}
</style>