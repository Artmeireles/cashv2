
<template>
  <div class="flex justify-content-center p-fluid">
    <div v-focustrap class="card">
      <form @submit.prevent="this.signin">
        <h1>Seja bem vindo ao {{ this.appName }}</h1>
        <div class="field mt-2">
          <InputText id="input" v-model="userAuth.name" type="text" placeholder="Name" focused />
        </div>
        <div class="field mt-4">
          <div class="p-input-icon-right">
            <i class="pi pi-envelope" />
            <InputText id="email" v-model="userAuth.email" type="email" placeholder="Email" />
          </div>
        </div>
        <div class="field">
          <div class="p-float-label">
            <Password v-model="userAuth.password" toggleMask>
              <template #header>
                <h6>Pick a password</h6>
              </template>
              <template #footer>
                <Divider />
                <p class="mt-2">Suggestions</p>
                <ul class="pl-2 ml-2 mt-0" style="line-height: 1.5">
                  <li>At least one lowercase</li>
                  <li>At least one uppercase</li>
                  <li>At least one numeric</li>
                  <li>Minimum 8 characters</li>
                </ul>
              </template>
            </Password>
            <label for="password">Password</label>
          </div>
        </div>
        <div class="field-checkbox">
          <Checkbox id="accept" v-model="userAuth.accept" name="accept" value="Accept" />
          <label for="accept">I agree to the terms and conditions*</label>
        </div>
        <Button type="submit" label="Submit" class="mt-2" />
      </form>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { appName } from "@/global"
import { useUserStore } from "@/stores/user"
export default {
  name: "SignInView",
  data: () => {
    return {
      appName: appName,
      userAuth: {},
    }
  },
  emits: ['signin'],
  inject: ['dialogRef'],
  methods: {
    async signin() {
      const store = useUserStore()
      await store.registerUser(this.userAuth.email, this.userAuth.password)
      console.log(store.userStore);
      if (store.userStore && store.userStore.id) {
        this.closeDialog();
        this.$toast.add({ severity: 'success', detail: `Seja bem vindo ${store.userStore.name}!`, life: 3000 });
        this.$router.push({ path: "/" });
      }
    },
    closeDialog() {
      this.dialogRef.close();
    },
  },
  computed: {
    ...mapState(useUserStore, ['userStore']),
  },
}
</script>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
