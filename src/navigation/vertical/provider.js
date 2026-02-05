import veterinaryNavigation from './veterinary'
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

  if (isProviderOrOrg) {
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
  console.log('🧭 ProviderNav: enabledServices received:', enabledServices.length, enabledServices.map(s => s.service_name))
  const serviceItems = []
  const clinicItems = []

  if (enabledServices && enabledServices.length > 0) {
    const processedServiceIds = new Set()
    const processedServiceNames = new Set()

    enabledServices.forEach(service => {
      // console.log('🧭 Navigation Debug:', { name: service.service_name, id: service.service_id })

      const serviceId = (service.service_id || '').toUpperCase()
      const serviceName = (service.service_name || '').toLowerCase().trim()

      // Deduplication Check
      if (processedServiceIds.has(serviceId) || processedServiceNames.has(serviceName)) return
      processedServiceIds.add(serviceId)
      processedServiceNames.add(serviceName)

      // CHECK: Is this Veterinary?
      // Strict check for ANY veterinary key to exclude from Business Services list
      const isVeterinary = serviceName.includes('veterinary') ||
        serviceId.startsWith('VETERINARY_')

      // We explicitly Separated Clinic. So we DO NOT add Veterinary to serviceItems loop.
      // And we handle ClinicItems separately via explicit permission check below.
      if (!isVeterinary) {
        // It is a Business Service (Grooming, Daycare, etc)
        serviceItems.push({
          title: service.service_name,
          to: { name: 'provider-service-details', params: { serviceId: service.service_id } },
          icon: { icon: service.icon || 'tabler-box' },
          canView: () => permissionStore.canViewService(service.service_name),
        })
      }
    })
  }

  // --- STRICT CLINIC CHECK (Permission-Driven) ---
  // Check if user has ANY veterinary permission (even if VETERINARY_CORE is missing from enabledServices list)
  // We check the raw permissions array or use hasCapability check helper if available
  const hasVeterinaryAccess = permissionStore.permissions.some(p => {
    const key = (p.service_key || '').toUpperCase()
    const name = (p.service_name || '').toLowerCase()
    // Check for enabled VETERINARY_* permission
    // Note: p.can_view is already filtered in enabledServices check usually,
    // but here we check raw store permissions just to be safe if filtering logic differs.
    // Actually permissionStore.permissions IS the source.
    return (key.startsWith('VETERINARY_') || name.includes('veterinary')) && p.can_view
  })

  // Also check if they triggered the VETERINARY_CORE "implicit grant" logic in store
  const implicitVetAccess = permissionStore.hasCapability('VETERINARY_CORE')

  if (hasVeterinaryAccess || implicitVetAccess) {
    // Filter children to show only what they have access to 
    // AND exclude the dashboard/heading items to keep it clean if nested
    clinicItems.push({
      title: 'Veterinary', // Hardcoded clean name
      to: { name: 'veterinary-dashboard' },
      icon: { icon: 'tabler-stethoscope' },
      canView: () => true // Access is verified above
    })
  }
  // -----------------------------------------------

  // Push "Clinic" Section
  if (clinicItems.length > 0) {
    navigation.push({ heading: 'Clinic' })
    navigation.push(...clinicItems)
  }

  // Push "Services" Section
  if (serviceItems.length > 0) {
    navigation.push({ heading: 'Services' })
    navigation.push(...serviceItems)
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
  if (roleUpper === 'ORGANIZATION' || roleUpper === 'ORGANIZATION_PROVIDER') {
    navigation.push(
      { heading: 'Organization' },
      {
        title: 'Employees',
        to: { name: 'provider-employees' },
        icon: { icon: 'tabler-users' },
      },
      {
        title: 'Roles',
        to: { name: 'provider-roles' },
        icon: { icon: 'tabler-user-shield' },
      },
      {
        title: 'Clinics',
        to: { name: 'provider-clinics' },
        icon: { icon: 'tabler-building-hospital' },
      }
    )
  }



  return navigation
}

export default getProviderNavigation
