import { canNavigate } from '@layouts/plugins/casl'
import { usePermissionStore } from '@/stores/permissionStore'

export const setupGuards = router => {
  // 👉 router.beforeEach
  // Docs: https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards
  router.beforeEach(to => {
    /*
         * If it's a public route, continue navigation. This kind of pages are allowed to visited by login & non-login users. Basically, without any restrictions.
         * Examples of public routes are, 404, under maintenance, etc.
         */
    if (to.meta.public)
      return

    /**
         * Check if user is logged in by checking if token & user data exists in local storage
         * Feel free to update this logic to suit your needs
         */
    const user = useCookie('userData').value
    const token = useCookie('accessToken').value
    const isLoggedIn = Boolean(user && token)

    /*
          If user is logged in and is trying to access login like page, redirect to home
          else allow visiting the page
          (WARN: Don't allow executing further by return statement because next code will check for permissions)
         */
    if (to.meta.unauthenticatedOnly) {
      if (isLoggedIn)
        return '/'
      else
        return undefined
    }

    // ✅ Permission Check
    if (to.meta.permission) {
      const permissionStore = usePermissionStore()
      if (!permissionStore.hasPermission(to.meta.permission)) {
        console.warn(`Access denied. Missing permission: ${to.meta.permission}`)
        return { name: 'provider-dashboard' } // Redirect to dashboard
      }
    }

    // =======================================================
    // 🛡️ ROLE-BASED ROUTING GUARDS
    // =======================================================
    if (isLoggedIn && user) {
      const role = (user.role?.name || user.role || '').toLowerCase()

      // 1. Redirect from Login/Home based on role
      if (to.path === '/' || to.path === '/login') {
        if (role === 'organization' || role === 'individual') return '/provider/providerhome'
        if (role === 'employee') return '/employee/dashboard'
      }

      // 2. Protect Provider Routes
      if (to.path.startsWith('/provider') && role === 'employee') {
        // Allow employees to access service details
        if (to.name === 'provider-service-details') {
          return
        }
        console.warn('⛔ Employee attempted to access Provider area')
        return '/employee/dashboard'
      }

      // 3. Protect Employee Routes
      if (to.path.startsWith('/employee') && role !== 'employee') {
        console.warn('⛔ Non-employee attempted to access Employee area')
        return '/provider/dashboard'
      }
    }

    if (!canNavigate(to) && to.matched.length) {
      /* eslint-disable indent */
      return isLoggedIn
        ? { name: 'not-authorized' }
        : {
          name: 'login',
          query: {
            ...to.query,
            to: to.fullPath !== '/' ? to.path : undefined,
          },
        }
      /* eslint-enable indent */
    }
  })
}
