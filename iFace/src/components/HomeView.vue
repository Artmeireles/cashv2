<template>
  <div class="card flex justify-content-center" v-if="!store.userStore.id">
    <h1>Seja bem vindo ao {{ appName }}</h1>
    <Divider />
    <div class="p-inputgroup flex-1">
      <Button icon="pi pi-user" />
      <InputText id="txt" v-model="text" type="email" @blur="testeEmail" placeholder="Seu usuário" />
      <Button icon="pi pi-check" severity="success" @click="showSignin" />
      <Button icon="pi pi-times" severity="danger" @click="text = undefined" v-if="text" />
    </div>
    <Button label="Novo por aqui? Clique para se registrar!" link icon="pi pi-sign-in"
      class="btn btn-primary btn-lg btn-block" />
  </div>
  <div v-else>
    <Button label="Sair" @click="logout" icon="pi pi-user"></Button>
  </div>
</template>
  
<script setup>
import { ref } from 'vue';
import SignInView from '@/views/pages/SignInView.vue'
import { useUserStore } from "@/stores/user"
import { useDialog } from 'primevue/usedialog';
import { useToast } from "primevue/usetoast";
import { useRouter } from 'vue-router'
import { appName } from "@/global"
import { emailOrError } from "@/global"
const dialog = useDialog();
const toast = useToast();
const store = useUserStore()
const router = useRouter()

const text = ref()
const userState = ref()
const errorMessage = ref()

const showSignin = () => {
  if ((text.value && testeEmail())) {
    dialog.open(SignInView, {
      props: {
        header: `Seja bem vindo ao ${appName}`,
        style: { width: '50vw' },
        modal: true
      },
      data: {
        email: text.value
      },
      emits: {
        onSignin: (e) => {
          toast.add({ severity: 'success', detail: `Seja bem vindo ${e.user.name}!`, life: 3000 });
        },
        onFail: () => {
          toast.add({ severity: 'error', detail: `Combinação de usuário e senha não localizado!`, life: 3000 });
        }
      },
    });
  }
  else {
    toast.add({ severity: 'error', detail: `Usuário não informado ou inválido!`, life: 3000 });
    userState.value = "p-invalid"
  }
}

const testeEmail = () => {
  const texto = text.value
  if (texto.replace(/([^\d])+/gim, "").length == 11 || emailOrError(texto)) {
    userState.value = ""
    errorMessage.value = undefined
    return true
  }
  else {
    errorMessage.value = `Email inválido!`
    toast.add({ severity: 'error', detail: `Email inválido!`, life: 3000 });
    userState.value = "p-invalid"
    return false
  }
}

const logout = () => {
  router.push({ path: "/" });
  useUserStore().logout()
}
</script>

<style scoped></style>