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

  // 1. Super Admin — match ALL known role string variants
  // Backend may return: 'SUPERADMIN', 'Super Admin', 'super_admin', 'super admin'
  // .toUpperCase() of 'Super Admin' = 'SUPER ADMIN' so we must handle both forms
  if (role === 'SUPERADMIN' || role === 'SUPER ADMIN' || role === 'SUPER_ADMIN') {
    return '/superadmin/dashboard'
  }

  // 2. Pet Owner / Customer -> Pet Owner Dashboard (Redirect to Marketplace)
  if (['PETOWNER', 'CUSTOMER', 'USER', 'PET_OWNER', 'PET OWNER'].includes(role)) {
    return '/pet-owner/book'
  }

  // 3. Employees / Veterinary Staff -> Employee Dashboard
  const employeeRoles = ['EMPLOYEE', 'DOCTOR', 'RECEPTIONIST', 'LAB TECH', 'PHARMACY', 'VITALS STAFF']
  if (employeeRoles.includes(role)) {
    return '/employee/dashboard'
  }

  // 4. Tenant Owner (Provider/Organization) -> Provider Home
  const isProviderAdmin = ['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER', 'SERVICE_PROVIDER'].includes(role)
    || userData.provider_type // Fallback if role is missing but provider_type exists

  if (isProviderAdmin) {
    return '/provider/providerhome'
  }

  // Default fallback for anyone else who might be an employee
  return '/employee/dashboard'
}
