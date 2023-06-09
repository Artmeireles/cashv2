import { defineStore } from 'pinia'
import { baseApiUrl } from "@/env"
import { userKey } from "@/global"
import axios from '@/axios-interceptor'

export const useUserStore = defineStore('users', {
  state: () => ({
    user: {},
    ip: '',
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
      this.ip = ipify.data.ip || undefined
      axios.interceptors.request.use(config => {
        if (ipify && ipify.data.ip) {
          config.headers['X-IP-Address'] = this.ip;
        }
        return config;
      });
      await axios
        .post(url, { email, password })
        .then((res) => {
          this.user = res.data;
          if (this.user.id) {
            this.user.timeLogged = Math.floor(Date.now() / 1000)
            axios.defaults.headers.common['Authorization'] = `bearer ${this.user.token}`
            localStorage.setItem(userKey, JSON.stringify({ ...res.data, ip: this.ip }));
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
    async findUser(cpf) {
      const url = `${baseApiUrl}/signin`
      await axios
        .post(url, { cpf })
        .then((res) => {
          this.user = res.data;
        })
        .catch(error => {
          return { data: error }
        });
    },
    async validateToken(userData) {
      const url = `${baseApiUrl}/validateToken`
      // Pra validar movimentação/troca de IP
      if (userData && userData.ip) userData.ipSignin = userData.ip // comentar esta linha e descomentar as duas seguintes
      // let ipify = await axios.get("https://api.ipify.org?format=json")
      // userData.ipSignin = ipify.data.ip || undefined
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
      delete axios.defaults.headers.common['X-IP-Address']
      localStorage.removeItem(userKey);
    },
  },

})