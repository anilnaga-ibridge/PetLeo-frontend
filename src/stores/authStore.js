import { defineStore } from 'pinia'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useAbility } from '@casl/vue'
import { useCookie } from '@/@core/composable/useCookie'

const API_BASE = "http://localhost:8000"

export const useAuthStore = defineStore('authStore', () => {
  const router = useRouter()
  const ability = useAbility()

  // ------------- LOGOUT FUNCTION -------------
  const logout = async () => {
    try {
      const accessToken = useCookie('accessToken').value

      const refreshToken =
        localStorage.getItem('refreshToken') ||
        sessionStorage.getItem('refreshToken')

      if (refreshToken) {
        await axios.post(
          `${API_BASE}/auth/api/auth/logout/`,
          {
            refresh: refreshToken,
            revoke_all: true,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        )
      }
    } catch (err) {
      console.error('Backend logout failed:', err?.response?.data)
    }

    // FRONTEND CLEANUP
    useCookie('accessToken').value = null
    useCookie('userData').value = null
    useCookie('userAbilityRules').value = null

    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userData')
    localStorage.removeItem('session_id')
    localStorage.removeItem('remember_me')
    localStorage.removeItem('auth_phone')
    localStorage.removeItem('pin_phone')
    localStorage.removeItem('reset_pin_phone')
    localStorage.removeItem('pin_length')
    localStorage.removeItem('lock_screen_phone')

    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('refreshToken')
    sessionStorage.removeItem('userData')
    sessionStorage.removeItem('lock_screen_phone')

    ability.update([])

    router.replace({ name: 'login' })
  }

  return {
    logout,
  }
})
