import { usePermissionStore } from '@/stores/permissionStore'

const getProviderNavigation = () => {
    const permissionStore = usePermissionStore()

    // Get User Role
    let userData = {}
    try {
        userData = JSON.parse(localStorage.getItem('userData') || '{}')
    } catch (e) {
        console.error('❌ provider.js: Error parsing userData', e)
    }
    const roleUpper = (userData.role?.name || userData.role || '').toUpperCase()
    const isProviderAdmin = ['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER'].includes(roleUpper)

    // STRICT: Veterinary Staff (Non-Admins) see NO Provider navigation
    if (permissionStore.hasCapability('VETERINARY_CORE') && !isProviderAdmin) {
        return []
    }

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
            console.log('🧭 Navigation Debug:', { name: service.service_name, id: service.service_id })
            const isVeterinary = service.service_name.toLowerCase().includes('veterinary') ||
                service.service_id === '2dff446f-c95f-4310-ba4d-05e3395dd7eb' ||
                service.service_id === 'VETERINARY_CORE' // Add explicit check for string ID if applicable

            navigation.push({
                title: service.service_name,
                to: isVeterinary
                    ? { name: 'veterinary-dashboard' }
                    : {
                        name: 'provider-service-details',
                        params: { serviceId: service.service_id }
                    },
                icon: { icon: service.icon || (isVeterinary ? 'tabler-stethoscope' : 'tabler-box') },
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
    if (roleUpper === 'ORGANIZATION') {
        navigation.push({
            title: 'Employees',
            to: { name: 'provider-employees' },
            icon: { icon: 'tabler-users' },
        })
    }



    return navigation
}

export default getProviderNavigation
