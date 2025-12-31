import { ability } from '@/plugins/casl/ability'
import { usePermissionStore } from '@/stores/permissionStore'
import { useCookie } from '@/@core/composable/useCookie'
import { getPostLoginRoute } from '@/utils/routeHelpers'

export const setupGuards = router => {
  // 👉 router.beforeEach
  // Docs: https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards
  router.beforeEach(async (to, from) => {
    /*
         * If it's a public route, continue navigation. This kind of pages are allowed to visited by login & non-login users. Basically, without any restrictions.
         * Examples of public routes are, 404, under maintenance, etc.
         */
    console.log('🛡️ Router Guard: Navigating to:', to.path, 'Name:', to.name, 'Meta:', to.meta)
    if (to.meta.public) {
      console.log('🛡️ Router Guard: Public route, allowing.')
      return
    }

    /**
         * Check if user is logged in by checking if token & user data exists in local storage
         * Feel free to update this logic to suit your needs
         */
    const userCookie = useCookie('userData').value
    const tokenCookie = useCookie('accessToken').value

    // Fallback to localStorage if cookies are missing
    const user = userCookie || JSON.parse(localStorage.getItem('userData') || sessionStorage.getItem('userData') || 'null')
    const token = tokenCookie || localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

    const isLoggedIn = Boolean(user && token)
    console.log('🛡️ Router Guard: isLoggedIn:', isLoggedIn, 'Role:', user?.role)

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
    // 🛡️ CAPABILITY-BASED ROUTING GUARDS
    // =======================================================
    if (isLoggedIn && user) {
      const permissionStore = usePermissionStore()

      // Ensure permissions are loaded
      if (!permissionStore.permissions || permissionStore.permissions.length === 0) {
        console.log('🛡️ Router Guard: Permissions missing, fetching...')
        try {
          await permissionStore.fetchPermissions()
        } catch (e) {
          console.error('🛡️ Router Guard: Failed to fetch permissions', e)
        }
      }

      console.log('🛡️ Router Guard: Target Path:', to.path)
      console.log('🛡️ Router Guard: Has VETERINARY_CORE:', permissionStore.hasCapability('VETERINARY_CORE'))

      // 1. Redirect from Login/Home based on CAPABILITIES
      if (to.path === '/' || to.path === '/login') {
        const targetRoute = getPostLoginRoute(user)
        if (targetRoute && targetRoute !== to.path) {
          return targetRoute
        }
      }

      // 2. Protect Module Routes
      if (to.path.startsWith('/veterinary') && !permissionStore.hasCapability('VETERINARY_CORE')) {
        console.warn('⛔ Access denied to Veterinary module')
        return '/employee/dashboard'
      }

      // 3. Protect Provider Routes (Tenant Admin Area)
      if (to.path.startsWith('/provider')) {
        // STRICT BLOCK: Veterinary Staff must NEVER see Provider screens
        // EXCEPTION: Organization/Provider Admins ARE allowed (they have all capabilities)
        const roleUpper = (user.role?.name || user.role || '').toUpperCase()
        const isProviderAdmin = ['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER'].includes(roleUpper)

        console.log('🛡️ Guard Debug:', { roleUpper, isProviderAdmin, hasVetCore: permissionStore.hasCapability('VETERINARY_CORE') })

        if (permissionStore.hasCapability('VETERINARY_CORE') && !isProviderAdmin) {
          console.warn('⛔ Veterinary staff blocked from Provider area')
          return '/veterinary/dashboard'
        }

        // Allow if they have MANAGE_ORGANIZATION or similar? 
        // Or just block employees.
        // For now, if they are an employee (have VETERINARY_CORE but not Organization role), block.
        // Ideally, we should have a capability for this too.

        if (roleUpper !== 'ORGANIZATION' && roleUpper !== 'INDIVIDUAL' && roleUpper !== 'PROVIDER') {
          // Allow specific sub-routes if needed (e.g. service details)
          if (to.name === 'provider-service-details') return

          console.warn('⛔ Employee attempted to access Provider area')
          return '/employee/dashboard'
        }
      }

      // 4. Block Generic Employee Dashboard for Veterinary Staff
      if (to.path.startsWith('/employee') && permissionStore.hasCapability('VETERINARY_CORE')) {
        console.warn('⛔ Veterinary staff redirected from generic employee dashboard')
        return '/veterinary/dashboard'
      }
    }

    // 🛡️ CASL Ability Check (Replaced canNavigate with direct check)
    if (to.matched.length) {
      const targetRoute = to.matched[to.matched.length - 1]
      let canAccess = true

      if (targetRoute?.meta?.action && targetRoute?.meta?.subject) {
        canAccess = ability.can(targetRoute.meta.action, targetRoute.meta.subject)
      } else {
        canAccess = to.matched.some(route => ability.can(route.meta.action, route.meta.subject))
      }

      if (!canAccess) {
        return isLoggedIn
          ? { name: 'not-authorized' }
          : {
            name: 'login',
            query: {
              ...to.query,
              to: to.fullPath !== '/' ? to.path : undefined,
            },
          }
      }
    }
  })
}
