import { useCookie } from '@/@core/composable/useCookie'
import { useCookieStore } from '@/stores/cookieStore'

export function fullLogout(router) {
  // Clear cookies
  useCookie('accessToken').value = null
  useCookie('refreshToken').value = null
  useCookie('userData').value = null
  useCookie('userAbilityRules').value = null

  // Clear localStorage
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('userData')
  localStorage.removeItem('remember_me')

  // Clear sessionStorage
  sessionStorage.removeItem('accessToken')
  sessionStorage.removeItem('userData')
  sessionStorage.removeItem('session_id')

  // Clear Pinia store if used
  try {
    const cookieStore = useCookieStore()
    cookieStore.$reset()
  } catch (e) {}

  // Redirect to login
  router.replace('/login')
}
