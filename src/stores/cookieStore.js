// import { defineStore } from 'pinia'

// export const useCookieStore = defineStore('cookieStore', {
//   state: () => ({
//     session_id: null,
//   }),

//   actions: {
//     setCookie(value) {
//       this.session_id = value
//       localStorage.setItem('session_id', value)
//     },

//     getCookie() {
//       if (!this.session_id) {
//         this.session_id = localStorage.getItem('session_id')
//       }
//       return this.session_id
//     },

//     clearCookie() {
//       this.session_id = null
//       localStorage.removeItem('session_id')
//     },
//   },
// })
// /src/stores/cookieStore.js
// import { defineStore } from 'pinia'
// import { useCookie } from '@/@core/composable/useCookie'

// export const useCookieStore = defineStore('cookieStore', {
//   state: () => ({
//     accessToken: useCookie('accessToken'),
//     userData: useCookie('userData'),
//     userAbilityRules: useCookie('userAbilityRules'),
//   }),
//   actions: {
//     setAccessToken(token) {
//       this.accessToken.value = token
//     },
//     setUserData(data) {
//       this.userData.value = data
//     },
//     setUserAbilityRules(rules) {
//       this.userAbilityRules.value = rules
//     },
//   },
// })
import { defineStore } from 'pinia'

export const useCookieStore = defineStore('cookieStore', {
  state: () => ({
    accessToken: null,
    userData: null,
    userAbilityRules: [],
  }),
  actions: {
    setAccessToken(token) {
      this.accessToken = token        // ✅ no .value here
    },
    setUserData(data) {
      this.userData = data            // ✅
    },
    setUserAbilityRules(rules) {
      this.userAbilityRules = rules   // ✅
    },
    clearAuth() {
      this.accessToken = null
      this.userData = null
      this.userAbilityRules = []
    },
  },
})
