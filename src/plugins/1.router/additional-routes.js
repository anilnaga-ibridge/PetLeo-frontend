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
export const routes = [
  // Email filter
  {
    path: "/apps/email/filter/:filter",
    name: "apps-email-filter",
    component: emailRouteComponent,
    meta: {
      navActiveLink: "apps-email",
      layoutWrapperClasses: "layout-content-height-fixed",
    },
  },

  // Email label
  {
    path: "/apps/email/label/:label",
    name: "apps-email-label",
    component: emailRouteComponent,
    meta: {
      // contentClass: 'email-application',
      navActiveLink: "apps-email",
      layoutWrapperClasses: "layout-content-height-fixed",
    },
  },
  {
    path: "/dashboards/logistics",
    name: "dashboards-logistics",
    component: () => import("@/pages/apps/logistics/dashboard.vue"),
  },
  {
    path: "/dashboards/academy",
    name: "dashboards-academy",
    component: () => import("@/pages/apps/academy/dashboard.vue"),
  },
  {
    path: "/apps/ecommerce/dashboard",
    name: "apps-ecommerce-dashboard",
    component: () => import("@/pages/dashboards/ecommerce.vue"),
  },
  {
    path: '/provider/settings/:tab',
    name: 'provider-settings-tab',
    component: () => import('@/pages/provider/settings.vue'),
    meta: { layout: 'blank' },
  },
  {
    path: '/provider/profile',
    name: 'provider-profile',
    component: () => import('@/pages/provider/profile.vue'),
    meta: { layout: 'blank' },
  },
  {
    path: '/provider/dashboard',
    name: 'provider-dashboard',
    component: () => import('@/pages/provider/dashboard.vue'),
    meta: { layout: 'blank' },
  },
  {
    path: '/provider/bookings',
    name: 'provider-bookings',
    component: () => import('@/pages/provider/bookings.vue'),
    meta: { layout: 'blank' },
  },
  {
    path: '/provider/services',
    name: 'provider-services',
    component: () => import('@/pages/provider/services.vue'),
    meta: { layout: 'blank' },
  },
  {
    path: '/provider/pricing',
    name: 'provider-pricing',
    component: () => import('@/pages/provider/pricing.vue'),
    meta: { layout: 'blank' },
  },
  {
    path: '/provider/faq',
    name: 'provider-faq',
    component: () => import('@/pages/provider/faq.vue'),
    meta: { layout: 'blank' },
  },
  {
    path: '/provider/service/:serviceId',
    name: 'provider-service-details',
    component: () => import('@/pages/provider/service-details.vue'),
    meta: { layout: 'blank' },
  },
  {
    path: '/provider/providerhome',
    name: 'provider-providerhome',
    component: () => import('@/pages/provider/providerhome.vue'),
    meta: { layout: 'blank' },
  },
  {
    path: '/provider/home',
    name: 'provider-home',
    component: () => import('@/pages/provider/providerhome.vue'),
    meta: { layout: 'blank' },
  },
  {
    path: '/provider/subscription',
    name: 'provider-subscription',
    component: () => import('@/pages/provider/subscription.vue'),
    meta: { layout: 'blank' },
  },
]
