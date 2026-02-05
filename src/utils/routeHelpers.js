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

  // 2. Tenant Owner (Provider/Organization) -> Provider Home
  const isProviderAdmin = ['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER', 'SERVICE_PROVIDER'].includes(role)
    || userData.provider_type // Fallback if role is missing but provider_type exists

  if (isProviderAdmin) {
    return '/provider/providerhome'
  }

  // 3. Employees / Veterinary Staff -> Employee Dashboard
  return '/employee/dashboard'
}
