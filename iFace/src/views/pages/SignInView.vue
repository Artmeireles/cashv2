
<template>
  <div class="flex justify-content-center p-fluid">
    <div v-focustrap class="card">
      <form @submit.prevent="this.signin">
        <div class="field col-12 md:col-4">
          <div class="p-inputgroup">
            <span class="p-inputgroup-addon">
              <i class="pi pi-user"></i>
            </span>
            <span class="p-float-label">
              <InputText v-model="this.userAuth.password" type="password" id="password" />
              <label for="password">Sua senha</label>
            </span>
          </div>
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
      if (store.userStore && store.userStore.id) {
        this.closeDialog();
        this.$emit('signin', { user: store.userStore });
        this.$router.push({ path: "/" });
      } else {
        this.$emit('fail');
      }
    },
    closeDialog() {
      this.dialogRef.close();
    },
  },
  mounted() {
    this.userAuth.email = this.dialogRef.data.email
    delete this.userAuth.password
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
