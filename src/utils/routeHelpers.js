import { usePermissionStore } from '@/stores/permissionStore'

/**
 * Determines the post-login redirect route based on user capabilities.
 * STRICTLY capability-driven. No role-based routing for internal modules.
 * 
 * @param {Object} userData - The user object containing permissions/capabilities
 * @returns {String} The target route path
 */
export const getPostLoginRoute = userData => {
  if (!userData) return '/login'

  const permissionStore = usePermissionStore()
  const role = (userData.role?.name || userData.role || '').toUpperCase()

  // DRAG & DROP DEBUG (Visible to developers in console)
  console.log('🚀 [Redirection] userData:', userData)
  console.log('🚀 [Redirection] computed role:', role)

  // 1. Super Admin (Strict Check)
  // Only redirect to SuperAdmin if role is explicitly SUPERADMIN and no provider info is present
  if (role === 'SUPERADMIN' && !userData.provider_type) {
    return '/superadmin/dashboard'
  }

  // 2. Tenant Owner (Provider/Organization)
  // Robust check: Role variants OR Provider Capability OR presence of provider_type
  const isProvider = ['ORGANIZATION', 'PROVIDER', 'INDIVIDUAL', 'SERVICEPROVIDER', 'SERVICE_PROVIDER', 'SERVICE PROVIDER'].includes(role)
    || permissionStore.hasCapability('PROVIDER_MODULE')
    || userData.capabilities?.includes('PROVIDER_MODULE')
    || !!userData.provider_type

  console.log('🚀 [Redirection] isProvider:', isProvider)

  if (isProvider) {
    return '/provider/providerhome'
  }

  // 3. Veterinary Staff (Strict Capability Check via Store)
  if (permissionStore.hasCapability('VETERINARY_CORE')) {
    return '/veterinary/dashboard'
  }

  // 3.5 Dynamic Capabilities Routing (First Available)
  if (permissionStore.dynamicModules && permissionStore.dynamicModules.length > 0) {
    const sorted = [...permissionStore.dynamicModules].sort((a, b) => (a.sequence || 99) - (b.sequence || 99))
    const first = sorted[0];
    if (first && first.route) {
      return first.route.startsWith('/') ? first.route : `/${first.route}`
    }
  }

  // 4. Other Employees (Fallback)
  return '/employee/dashboard'
}
