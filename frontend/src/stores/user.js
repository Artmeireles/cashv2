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
  },
  actions: {
    async registerUser(email, password) {
      const url = `${baseApiUrl}/signin`
      await axios
        .post(url, { email, password })
        .then((res) => {
          this.user = res.data;
          if (this.user.id) {
            axios.defaults.headers.common['Authorization'] = `bearer ${this.user.token}`
          } else {
            delete axios.defaults.headers.common['Authorization']
          }
          localStorage.setItem(userKey, JSON.stringify(res.data));
          return this.user
        })
        .catch(error => {
          console.log(error);
        });
    },
    async validateToken(userData) {
      const url = `${baseApiUrl}/validateToken`
      await axios
        .post(url, userData)
        .then((res) => {
          this.isTokenValid = res.data;
          if (this.isTokenValid) {
            this.user = userData
            axios.defaults.headers.common['Authorization'] = `bearer ${this.user.token}`
            this.timeToLogOut = 600
          }
          // else {
          //   this.logout()
          // }
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


// import { defineStore } from 'pinia'
// import axios from 'axios'

// export const useUsers = defineStore('users', {
//   state: () => ({
//     userData: null,
//   }),

//   actions: {
//     async registerUser(email, password) {
//       const url = `${baseApiUrl}/signin`
//       axios
//         .post(url, { email, password })
//         .then((res) => {
//           this.userData = res.data;
//           console.log(this.userData);
//           showTooltip(`Welcome back ${this.userData.name}!`)
//           localStorage.setItem(userKey, JSON.stringify(res.data));
//         })
//         .catch(error => {
//           console.log(error); showTooltip(error)
//         });
//     },
//   },
// })

