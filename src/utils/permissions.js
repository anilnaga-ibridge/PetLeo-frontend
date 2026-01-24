import { veterinaryApi as axios } from '@/plugins/axios'

/**
 * Maps backend permission tree to frontend capability strings.
 * @param {Array} permissionTree - The permissions array from /api/provider/permissions/
 * @returns {Array<string>} - List of capability strings (e.g., 'VETERINARY_MODULE')
 */
export const flattenPermissions = permissionTree => {
  const capabilities = new Set()

  if (!Array.isArray(permissionTree)) return []

  permissionTree.forEach(service => {
    console.log('FLATTEN DEBUG: Processing Service:', service.service_name, service.service_key)
    const serviceName = (service.service_name || '').toLowerCase()

    // Service Level Mapping
    if (serviceName.includes('veterinary')) {
      capabilities.add('VETERINARY_MODULE')
      capabilities.add('VETERINARY_CORE')
    }
    if (service.service_key) {
      capabilities.add(service.service_key.toUpperCase())
    }

    // Category Level Mapping
    if (Array.isArray(service.categories)) {
      service.categories.forEach(cat => {
        // Only grant capability if user has 'can_view' permission
        if (cat.can_view) {
          // 1. Use explicit linked_capability from backend if provided
          if (cat.linked_capability) {
            capabilities.add(cat.linked_capability.toUpperCase())
          }

          // 2. Fallback to name-based logic for backward compatibility or unlinked items
          const catName = (cat.name || '').toLowerCase()

          if (catName.includes('vitals')) capabilities.add('VETERINARY_VITALS')
          if (catName.includes('prescriptions')) capabilities.add('VETERINARY_PRESCRIPTIONS')
          if (catName.includes('lab')) capabilities.add('VETERINARY_LABS')
          if (catName.includes('pharmacy')) capabilities.add('VETERINARY_PHARMACY')
          if (catName.includes('visits')) capabilities.add('VETERINARY_VISITS')
          if (catName.includes('doctor')) capabilities.add('VETERINARY_DOCTOR')
          if (catName.includes('billing')) capabilities.add('VETERINARY_BILLING')
          if (catName.includes('settings')) capabilities.add('VETERINARY_SETTINGS')
          if (catName.includes('online')) capabilities.add('VETERINARY_ONLINE_CONSULT')
          if (catName.includes('offline')) capabilities.add('VETERINARY_OFFLINE_VISIT')
          if (catName.includes('medicine')) capabilities.add('VETERINARY_MEDICINE_REMINDERS')
          if (catName.includes('vaccine')) capabilities.add('VETERINARY_VACCINES')
        }
      })
    }
  })

  return Array.from(capabilities)
}

/**
 * Fetches permissions from backend and merges them into userData.
 * @param {Object} userData - The initial userData object from login
 * @returns {Promise<Object>} - The updated userData with capabilities
 */
export const fetchAndMergePermissions = async userData => {
  try {
    // Only fetch for providers/employees who might have dynamic plans
    const role = (userData.role || '').toUpperCase()
    if (!['ORGANIZATION', 'INDIVIDUAL', 'EMPLOYEE', 'PROVIDER'].includes(role)) {
      return userData
    }

    const response = await axios.get('/provider/permissions/')
    const permissionTree = response.data.permissions || []

    const dynamicCapabilities = flattenPermissions(permissionTree)

    // Merge with existing capabilities (if any)
    const existingCapabilities = userData.capabilities || []

    userData.capabilities = [...new Set([...existingCapabilities, ...dynamicCapabilities])]

    console.log('Merged Dynamic Capabilities:', userData.capabilities)

    return userData
  } catch (error) {
    console.error('Failed to fetch dynamic permissions:', error)

    // Return original userData on failure to avoid blocking login
    return userData
  }
}
