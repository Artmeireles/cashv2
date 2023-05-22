import { defineStore } from 'pinia'
import { baseApiUrl } from "@/env"
import { userKey } from "@/global"
import axios from 'axios'

export const useUserStore = defineStore('users', {
  state: () => ({
    user: {},
    timeToLogOut: 600,
    isTokenValid: false,
  }),
  getters: {
    userStore(state) {
      return state.user
    },
    userTimeToLogOut(state) {
      setInterval(() => {
        state.timeToLogOut--
        let timeTo = state.user.timeLogged + state.timeToLogOut
        console.log(timeTo);
        return timeTo
      }, 1000);

    },
  },
  actions: {
    async registerUser(email, password) {
      const url = `${baseApiUrl}/signin`
      let ipify = await axios.get("https://api.ipify.org?format=json")
      ipify = ipify.data.ip || undefined
      await axios
        .post(url, { email, password, ipify })
        .then((res) => {
          this.user = res.data;
          if (this.user.id) {
            this.user.timeLogged = Math.floor(Date.now() / 1000)

            axios.defaults.headers.common['Authorization'] = `bearer ${this.user.token}`
            localStorage.setItem(userKey, JSON.stringify(res.data));
          } else {
            this.user = {}
            delete axios.defaults.headers.common['Authorization']
            localStorage.removeItem(userKey);
          }
          return this.user
        })
        .catch(error => {
          return { data: error }
        });
    },
    async findUser(email) {
      const url = `${baseApiUrl}/signin`
      await axios
        .post(url, { email: email })
        .then((res) => {
          this.user = res.data;
        })
        .catch(error => {
          return { data: error }
        });
    },
    async findUserSignUp(cpf) {
      const url = `${baseApiUrl}/signup`
      await axios
        .post(url, { cpf: cpf })
        .then((res) => {
          this.user = res.data;
        })
        .catch(error => {
          return { data: error }
        });
    },
    async validateToken(userData) {
      const url = `${baseApiUrl}/validateToken`
      return await axios
        .post(url, userData)
        .then((res) => {
          this.isTokenValid = res.data;
          if (this.isTokenValid) {
            this.user = userData
            axios.defaults.headers.common['Authorization'] = `bearer ${this.user.token}`
            this.timeToLogOut = 600
          }
        })
        .catch(error => {
          console.log(error);
        });
    },
    logout() {
      this.user = {}
      delete axios.defaults.headers.common['Authorization']
      localStorage.removeItem(userKey);
    },
  },

})