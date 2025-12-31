import { usePermissionStore } from '@/stores/permissionStore'

/**
 * Determines the post-login redirect route based on user capabilities.
 * STRICTLY capability-driven. No role-based routing for internal modules.
 * 
 * @param {Object} userData - The user object containing permissions/capabilities
 * @returns {String} The target route path
 */
export const getPostLoginRoute = (userData) => {
    if (!userData) return '/login'

    const permissionStore = usePermissionStore()
    const role = (userData.role?.name || userData.role || '').toUpperCase()

    // 1. Super Admin
    if (role === 'SUPERADMIN') return '/dashboards/crm'

    // 2. Tenant Owner (Provider/Organization) - HIGHEST PRIORITY for Admins
    if (['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER'].includes(role)) return '/provider/providerhome'

    // 3. Veterinary Staff (Strict Capability Check via Store)
    if (permissionStore.hasCapability('VETERINARY_CORE')) {
        return '/veterinary/dashboard'
    }

    // 4. Other Employees (Fallback)
    return '/employee/dashboard'
}
