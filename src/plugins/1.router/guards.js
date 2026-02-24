
import { ability } from '@/plugins/casl/ability'
import { usePermissionStore } from '@/stores/permissionStore'
import { useCookie } from '@/@core/composable/useCookie'
import { getPostLoginRoute } from '@/utils/routeHelpers'

export const setupGuards = router => {
  // 👉 router.beforeEach
  // Docs: https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards
  router.beforeEach(async (to, from) => {
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
    console.log('🛡️ Router Guard: Target:', to.path, 'Name:', to.name)
    console.log('🛡️ Router Guard: Meta:', JSON.stringify(to.meta, null, 2))
    console.log('🛡️ Router Guard: Action:', to.meta.action, 'Subject:', to.meta.subject)

    // =======================================================
    // 1. STRICT AUTHENTICATION CHECK
    // =======================================================
    // If user is NOT logged in, and route is NOT public, and NOT unauthenticatedOnly
    // -> Redirect to Login immediately.
    if (!isLoggedIn && !to.meta.public && !to.meta.unauthenticatedOnly) {
      console.warn('⛔ Unauthenticated access to protected route. Redirecting to login.')

      return { name: 'login', query: { to: to.fullPath } }
    }

    /*
         * If it's a public route, continue navigation. This kind of pages are allowed to visited by login & non-login users. Basically, without any restrictions.
         * Examples of public routes are, 404, under maintenance, etc.
         */
    console.log('🛡️ Router Guard: Navigating to:', to.path, 'Name:', to.name, 'Meta:', to.meta)
    if (to.meta.public) {
      // Special case: If unauthenticated user tries to access not-authorized page, send them to login
      // Check for name 'not-authorized' or path containing 'not-authorized'
      const isNotAuthorizedPage = to.name === 'not-authorized' || to.path.includes('not-authorized')

      if (isNotAuthorizedPage && !isLoggedIn) {
        return { name: 'login', query: { to: to.fullPath } }
      }
      console.log('🛡️ Router Guard: Public route, allowing.')

      return
    }

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

    const permissionStore = usePermissionStore()

    // ✅ Permission Check
    if (to.meta.permission) {
      if (!permissionStore.hasPermission(to.meta.permission)) {
        console.warn(`Access denied. Missing permission: ${to.meta.permission}`)

        return '/' // Let getPostLoginRoute handle the correct dashboard redirection
      }
    }

    // =======================================================
    // 🛡️ CAPABILITY-BASED ROUTING GUARDS
    // =======================================================
    if (isLoggedIn && user) {
      const role = (user.role?.name || user.role || '').toLowerCase()
      const isSuperAdmin = role === 'superadmin' || role === 'admin'

      if (!isSuperAdmin && (!permissionStore.isPermissionsLoaded || !permissionStore.isDynamicAccessLoaded)) {
        console.log(`🛡️ [${new Date().toISOString()}] Router Guard: Full access data missing/stale. Fetching fresh data...`)
        try {
          const startTime = performance.now()
          await Promise.all([
            permissionStore.fetchPermissions(),
            permissionStore.fetchDynamicAccess()
          ])
          const endTime = performance.now()
          console.log(`🛡️ [${new Date().toISOString()}] Router Guard: Fetching complete in ${(endTime - startTime).toFixed(2)}ms`)
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
      if (to.path.startsWith('/provider/')) {
        const roleUpper = (user.role?.name || user.role || '').toUpperCase()
        const isProviderAdmin = ['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER', 'SERVICE_PROVIDER'].includes(roleUpper)
          || !!user.provider_type

        // Specific redirect for Profile
        if (to.path === '/provider/profile' && !isProviderAdmin) {
          console.warn('⛔ Employee attempted to access Provider Profile -> Redirecting to Employee Profile')
          return '/employee/profile'
        }

        // STRICT: Only Admins can see the Main Dashboard/Home
        // Employees are redirected to their restricted dashboard
        if ((to.path.startsWith('/provider/dashboard') || to.path.startsWith('/provider/providerhome')) && !isProviderAdmin) {
          console.warn('⛔ Employee attempted to access Admin Dashboard -> Redirecting to Employee Dashboard')
          return '/employee/dashboard'
        }
      }

      // 4. Protect Pet Owner Routes
      if (to.path.startsWith('/pet-owner')) {
        const roleUpper = (user.role?.name || user.role || '').toUpperCase()
        // Allow if role is explicitly PET_OWNER or similar
        // We assume the role for pet owners is 'PET_OWNER', 'PET OWNER', 'PETOWNER', or 'CUSTOMER'
        const isPetOwner = ['PET_OWNER', 'PET OWNER', 'PETOWNER', 'CUSTOMER'].includes(roleUpper)

        if (!isPetOwner) {
          console.warn('⛔ Non-Pet Owner attempted to access Pet Dashboard -> Redirecting to Home')
          // If they are a provider, send them to provider home
          if (['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER', 'SERVICE_PROVIDER'].includes(roleUpper)) {
            return '/provider/providerhome'
          }
          // Otherwise generic home or login
          return '/'
        }
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
        // Since we already checked authentication at the start, 
        // if we are here and access is denied, it MUST be a permission issue.
        // So we redirect to not-authorized.
        return { name: 'not-authorized' }
      }
    }
  })
}
