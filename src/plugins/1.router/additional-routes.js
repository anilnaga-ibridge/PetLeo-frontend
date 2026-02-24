import { useCookie } from '@/@core/composable/useCookie'
import { getPostLoginRoute } from '@/utils/routeHelpers'

const emailRouteComponent = () => import("@/pages/apps/email/index.vue")

// 👉 Redirects
export const redirects = [
  // ℹ️ We are redirecting to different pages based on role.
  // NOTE: Role is just for UI purposes. ACL is based on abilities.
  {
    path: "/",
    name: "index",
    redirect: to => {
      const userData = useCookie("userData").value || JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || 'null')
      const token = useCookie("accessToken").value || localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

      if (userData && token) {
        // Convert path to route name if possible, or return path (redirect function supports path)
        // But additional-routes uses name usually. 
        // Let's check if getPostLoginRoute returns a path. It does.
        // We can return the path directly or map it.
        // The redirect function in Vue Router can return a string path.
        return getPostLoginRoute(userData)
      }

      return { name: "login", query: to.query }
    },
  },
  {
    path: "/pages/user-profile",
    name: "pages-user-profile",
    redirect: () => ({
      name: "pages-user-profile-tab",
      params: { tab: "profile" },
    }),
  },
  {
    path: "/pages/account-settings",
    name: "pages-account-settings",
    redirect: () => ({
      name: "pages-account-settings-tab",
      params: { tab: "account" },
    }),
  },
]
export const routes = []
