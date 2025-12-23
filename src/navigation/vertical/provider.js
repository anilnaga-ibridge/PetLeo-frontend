import { usePermissionStore } from '@/stores/permissionStore'

const getProviderNavigation = () => {
    const permissionStore = usePermissionStore()

    // Base navigation items that are always visible
    const navigation = [
        {
            title: 'Dashboard',
            to: { name: 'provider-dashboard' },
            icon: { icon: 'tabler-smart-home' },
        },
        {
            title: 'Plan Cart',
            to: { name: 'provider-cart' },
            icon: { icon: 'tabler-shopping-cart' },
        },
        {
            title: 'Plan Bookings',
            to: { name: 'provider-plan-bookings' },
            icon: { icon: 'tabler-list-check' },
        },
    ]

    // Add dynamic service items based on permissions
    const enabledServices = permissionStore.enabledServices

    if (enabledServices && enabledServices.length > 0) {
        // Optional: Add a section header
        navigation.push({ heading: 'Services' })

        enabledServices.forEach(service => {
            navigation.push({
                title: service.service_name,
                to: {
                    name: 'provider-service-details',
                    params: { serviceId: service.service_id }
                },
                icon: { icon: service.icon || 'tabler-box' }, // Use service icon or default
            })
        })
    }

    // Add other conditional items
    if (permissionStore.canViewService('bookings')) {
        navigation.push({
            title: 'Bookings',
            to: { name: 'provider-bookings' },
            icon: { icon: 'tabler-calendar' },
        })
    }

    // Check for Organization role to show Employees
    const userData = JSON.parse(localStorage.getItem('userData') || '{}')
    const userRole = userData.role ? userData.role.toLowerCase() : ''

    if (userRole === 'organization') {
        navigation.push({
            title: 'Employees',
            to: { name: 'provider-employees' },
            icon: { icon: 'tabler-users' },
        })
    }

    return navigation
}

export default getProviderNavigation
