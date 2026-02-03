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

  // STRICT: Internal Wait for Dynamic Access
  if (!permissionStore.isDynamicAccessLoaded || !permissionStore.isPermissionsLoaded) {
    console.log('🚧 Provider Nav: Waiting for dynamic access load...')
    return []
  }

  /* [REMOVED] STRICT block - Employees can see mixed navigation */

  // Base navigation items that are always visible
  // [FIX] Dashboard link depends on role
  const dashboardRoute = isProviderAdmin ? { name: 'provider-dashboard' } : { name: 'employee-service-dashboard' }

  const navigation = [
    {
      title: 'Home',
      to: { name: 'provider-providerhome' },
      icon: { icon: 'tabler-home' },
    },
    {
      title: 'Dashboard',
      to: dashboardRoute,
      icon: { icon: 'tabler-smart-home' },
    }
  ]

  // Admin-only items
  if (isProviderAdmin) {
    navigation.push(
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
      {
        title: 'My Subscription',
        to: { name: 'provider-subscription' },
        icon: { icon: 'tabler-id' },
      }
    )
  }

  // Add dynamic service items based on permissions
  const enabledServices = permissionStore.enabledServices

  if (enabledServices && enabledServices.length > 0) {
    // Optional: Add a section header
    navigation.push({ heading: 'Services' })

    let addedVet = false
    const processedServiceIds = new Set()
    const processedServiceNames = new Set()

    enabledServices.forEach(service => {
      console.log('🧭 Navigation Debug:', { name: service.service_name, id: service.service_id })

      const serviceId = (service.service_id || '').toUpperCase()
      const serviceName = (service.service_name || '').toLowerCase().trim()

      // Deduplication Check (ID or Name)
      if (processedServiceIds.has(serviceId)) {
        return
      }
      if (processedServiceNames.has(serviceName)) {
        return
      }

      processedServiceIds.add(serviceId)
      processedServiceNames.add(serviceName)

      // Skip granular veterinary keys (they are handled by the internal Veterinary Menu)
      const granularVetKeys = [
        'VETERINARY_VISITS',
        'VETERINARY_VITALS',
        'VETERINARY_PRESCRIPTIONS',
        'VETERINARY_LABS',
        'VETERINARY_MEDICINE_REMINDERS',
        'VETERINARY_DOCTOR',
        'VETERINARY_PHARMACY'
      ]
      if (granularVetKeys.includes(serviceId)) return

      const isVeterinary = serviceName.includes('veterinary') ||
        serviceId === '2DFF446F-C95F-4310-BA4D-05E3395DD7EB' || // Legacy ID
        serviceId === 'VETERINARY_CORE'

      // Clean Duplicate Veterinary items (Double check just in case legacy ID vs name mismatch)
      if (isVeterinary) {
        if (addedVet) return
        addedVet = true
      }

      navigation.push({
        title: service.service_name,
        to: isVeterinary
          ? { name: 'veterinary-dashboard' }
          : (isProviderAdmin
            ? { name: 'provider-service-details', params: { serviceId: service.service_id } }
            : { path: `/employee/services/${service.service_id}` }),
        icon: { icon: service.icon || (isVeterinary ? 'tabler-stethoscope' : 'tabler-box') },
        canView: () => permissionStore.canViewService(service.service_name),
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

  // Check for Organization role to show Employees and Roles
  if (roleUpper === 'ORGANIZATION') {
    navigation.push({
      title: 'Employees',
      to: { name: 'provider-employees' },
      icon: { icon: 'tabler-users' },
    })
    navigation.push({
      title: 'Roles',
      to: { name: 'provider-roles' },
      icon: { icon: 'tabler-user-shield' },
    })
    navigation.push({
      title: 'Clinics',
      to: { name: 'provider-clinics' },
      icon: { icon: 'tabler-building-hospital' },
    })
  }



  return navigation
}

export default getProviderNavigation
