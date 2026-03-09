import veterinaryNavigation from './veterinary'
import { usePermissionStore } from '@/stores/permissionStore'

const getProviderNavigation = () => {
  const permissionStore = usePermissionStore()

  // CRITICAL FIX: Use reactive userData from store, not localStorage
  const userData = permissionStore.userData || {}
  const roleUpper = (userData.role?.name || userData.role || '').toUpperCase()

  console.log(`🔍 Provider Navigation: Role = "${roleUpper}" (from permissionStore)`)

  // STRICT: Internal Wait for Dynamic Access
  if (!permissionStore.isDynamicAccessLoaded || !permissionStore.isPermissionsLoaded) {
    console.log('🚧 Provider Nav: Waiting for dynamic access load...')
    
    return []
  }

  /* [REMOVED] STRICT block - Employees can see mixed navigation */

  // Check for Admin Roles
  const isProviderOrOrg = ['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER', 'SERVICE_PROVIDER'].includes(roleUpper)

  // [FIX] Dynamic Dashboard Link
  const dashboardRoute = isProviderOrOrg ? { name: 'provider-dashboard' } : { name: 'employee-dashboard' }

  const navigation = []

  // Only add Home if they are a Provider/Org Owner
  if (isProviderOrOrg) {
    navigation.push({
      title: 'Home',
      to: { name: 'provider-home' },
      icon: { icon: 'tabler-smart-home' },
    })
  }

  // Dashboard is always shown, but route is dynamic (already handled below)
  navigation.push({
    title: 'Dashboard',
    to: dashboardRoute,
    icon: { icon: 'tabler-presentation-analytics' },
  })

  if (isProviderOrOrg) {
    navigation.push(
      {
        title: 'Marketplace Profile',
        to: { name: 'provider-profile', query: { tab: 'marketplace' } },
        icon: { icon: 'tabler-building-store' },
      },
      {
        title: 'Plan Bookings',
        to: { name: 'provider-plan-bookings' },
        icon: { icon: 'tabler-calendar-heart' },
      },
      {
        title: 'My Subscription',
        to: { name: 'provider-subscription' },
        icon: { icon: 'tabler-crown' },
      },
    )
  }

  // Add dynamic service items based on permissions
  const enabledServices = permissionStore.enabledServices
  const serviceItems = []
  const clinicItems = []

  if (enabledServices && enabledServices.length > 0) {
    const processedServiceIds = new Set()
    const processedServiceNames = new Set()

    enabledServices.forEach(service => {
      const serviceId = (service.service_id || '').toUpperCase()
      const serviceName = (service.service_name || '').toLowerCase().trim()

      if (processedServiceIds.has(serviceId) || processedServiceNames.has(serviceName)) return
      processedServiceIds.add(serviceId)
      processedServiceNames.add(serviceName)

      const isVeterinary = serviceName.includes('veterinary') || serviceId.startsWith('VETERINARY_')

      if (!isVeterinary) {
        // Map premium icons based on service names
        let serviceIcon = service.icon || 'tabler-box'
        if (serviceName.includes('grooming')) serviceIcon = 'tabler-cut'
        if (serviceName.includes('day care') || serviceName.includes('daycare')) serviceIcon = 'tabler-paw'
        if (serviceName.includes('training')) serviceIcon = 'tabler-award'

        serviceItems.push({
          title: service.service_name,
          to: { name: 'provider-service-details', params: { serviceId: service.service_id } },
          icon: { icon: serviceIcon },
        })
      }
    })
  }

  // Clinic Section
  const hasVeterinaryAccess = permissionStore.permissions.some(p => {
    const key = (p.service_key || '').toUpperCase()
    const name = (p.service_name || '').toLowerCase()
    
    return (key.startsWith('VETERINARY_') || name.includes('veterinary')) && p.can_view
  })

  if (hasVeterinaryAccess || permissionStore.hasCapability('VETERINARY_CORE')) {
    clinicItems.push({
      title: 'Veterinary',
      to: { name: 'veterinary-dashboard' },
      icon: { icon: 'tabler-building-hospital' },
    })
  }

  if (clinicItems.length > 0) {
    navigation.push({ heading: 'Clinic' })
    navigation.push(...clinicItems)
  }

  // Services Section
  if (isProviderOrOrg && serviceItems.length > 0) {
    navigation.push({ heading: 'Services' })
    navigation.push(...serviceItems)
  }

  // Customer Bookings (New Premium Page)
  // Visible to:
  // 1. Providers/Orgs (Owners) - Always
  // 2. Employees - Always, but with different titles
  const bookingsTitle = isProviderOrOrg ? 'Customer Bookings' : 'My Bookings'

  navigation.push({
    title: bookingsTitle,
    to: isProviderOrOrg ? { name: 'provider-customer-bookings' } : { name: 'employee-bookings' },
    icon: { icon: 'tabler-calendar-star' },
  })

  // My Customers (Employees only)
  if (!isProviderOrOrg) {
    navigation.push({
      title: 'My Customers',
      to: { name: 'employee-customers' },
      icon: { icon: 'tabler-users' },
    })
  }

  // Schedule & Availability
  // Visible to Providers/Orgs and authorized employees
  if (isProviderOrOrg || permissionStore.hasCapability('manage_schedule')) {
    navigation.push({
      title: 'Availability',
      to: isProviderOrOrg ? { name: 'provider-availability' } : { name: 'employee-schedule' },
      icon: { icon: 'tabler-clock' },
    })
  }

  // Reviews/Ratings
  navigation.push({
    title: 'Reviews',
    to: isProviderOrOrg ? { name: 'provider-reviews' } : { name: 'employee-reviews' },
    icon: { icon: 'tabler-star' },
  })

  // Organization Section - Only for ORGANIZATION type providers
  // Individual providers don't manage employees, roles or multi-clinics
  const isOrganization = roleUpper === 'ORGANIZATION' ||
    (userData.provider_type || '').toUpperCase() === 'ORGANIZATION'

  if (isOrganization) {
    navigation.push(
      { heading: 'Organization' },
      {
        title: 'Employees',
        to: { name: 'provider-employees' },
        icon: { icon: 'tabler-users-group' },
      },
      {
        title: 'Roles',
        to: { name: 'provider-roles' },
        icon: { icon: 'tabler-user-shield' },
      },
      {
        title: 'Clinics',
        to: { name: 'provider-clinics' },
        icon: { icon: 'tabler-map-pin' },
      },
    )
  }




  return navigation
}

export default getProviderNavigation
