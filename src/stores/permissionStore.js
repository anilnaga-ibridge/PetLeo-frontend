import { defineStore } from 'pinia'
import { providerApi } from '@/plugins/axios'

import { useCookie } from '@/@core/composable/useCookie'

export const usePermissionStore = defineStore('permission', {
  state: () => {
    const safeParse = (key, fallback) => {
      try {
        const item = localStorage.getItem(key)
        const parsed = item ? JSON.parse(item) : fallback

        // Normalize Permissions immediately on load
        if (key === 'provider_permissions' && Array.isArray(parsed)) {
          const unique = []
          const seen = new Set()
          parsed.forEach(p => {
            if (!p || !p.service_id) return
            if (seen.has(p.service_id)) return
            seen.add(p.service_id)
            if (p.can_view) unique.push(p)
          })
          return unique
        }
        return parsed
      } catch (e) {
        console.warn(`Error parsing ${key} from localStorage`, e)

        return fallback
      }
    }

    return {
      // Structure: [{ service_id, service_name, can_view, categories: [...], ... }]
      permissions: safeParse('provider_permissions', []),
      planDetails: safeParse('provider_plan_details', null),
      userData: safeParse('userData', null) || useCookie('userData').value,
      dynamicCapabilities: safeParse('dynamic_capabilities', []),
      dynamicModules: safeParse('dynamic_modules', []),
      isLoading: false,
      isPermissionsLoaded: false,
      isDynamicAccessLoaded: false,
    }
  },

  getters: {
    // Get all services that have can_view = true
    enabledServices: state => {
      // console.log('🔍 enabledServices DEBUG: Raw Permissions:', JSON.stringify(state.permissions, null, 2))
      return state.permissions.filter(p => {
        // [FIX] Ensure we only check boolean true, not just truthy existence if strict
        const canView = p.can_view === true || p.can_view === 'true'
        // console.log(`   - Service: ${p.service_name} (${p.service_key}) -> can_view: ${canView}`)
        return canView
      })
    },

    // Check if a specific service is viewable
    canViewService: state => serviceName => {
      if (!serviceName) return false

      const service = state.permissions.find(
        p => (p.service_key?.toLowerCase() === serviceName.toLowerCase()) ||
          (p.service_name?.toLowerCase() === serviceName.toLowerCase()),
      )


      return !!service?.can_view
    },

    // Get permissions for a specific category within a service

    // Get permissions for a specific category within a service
    getCategoryPermissions: state => (serviceName, categoryName) => {
      const service = state.permissions.find(
        p => (p.service_key?.toLowerCase() === serviceName.toLowerCase()) ||
          (p.service_name?.toLowerCase() === serviceName.toLowerCase()),
      )

      if (!service || !service.categories) return null

      return service.categories.find(
        c => c.name?.toLowerCase() === categoryName.toLowerCase(),
      )
    },
  },

  actions: {
    async fetchPermissions() {
      this.isLoading = true
      try {
        // Fetch permissions from the Service Provider Service (Port 8002)
        console.log('🔑 PermissionStore: Fetching from /api/provider/permissions/...')

        const res = await providerApi.get('/api/provider/permissions/')

        console.log('🚨 VINOD FIX DEBUG - RAW API RESPONSE:')
        console.log('  Response Status:', res.status)
        console.log('  Permissions Count:', res.data.permissions?.length)
        console.log('  Services:')
        res.data.permissions?.forEach(p => {
          console.log(`    - ${p.service_name} (${p.service_key}) can_view=${p.can_view}`)
        })

        console.log('🔑 PermissionStore: RAW API Response:', JSON.stringify(res.data, null, 2))
        console.log('🔑 PermissionStore: Permissions Array:', res.data.permissions?.length)
        const vetCore = res.data.permissions?.find(p => p.service_key === 'VETERINARY_CORE' || p.service_name === 'Veterinary')
        if (vetCore) {
          console.log('🔑 PermissionStore: VETERINARY_CORE Categories:', vetCore.categories?.map(c => c.name || c.category_key))
        }

        // --- NORMALIZATION START ---

        // 1. Normalize Permissions (Remove duplicates, ensure valid objects)
        const rawPermissions = Array.isArray(res.data.permissions) ? res.data.permissions : []
        const uniquePermissions = []
        const seenServices = new Set()

        rawPermissions.forEach(p => {
          // Relaxed Check: Allow if ID OR Name is present
          if (!p || (!p.service_id && !p.service_name)) return
          const uniqueKey = p.service_id || p.service_name
          if (seenServices.has(uniqueKey)) return // Skip duplicates

          seenServices.add(uniqueKey)

          // Ensure booleans
          p.can_view = !!p.can_view
          p.can_create = !!p.can_create
          p.can_edit = !!p.can_edit
          p.can_delete = !!p.can_delete

          // Use 'modules' as the source of truth if available (backend should send this)
          // But strict compliance: only show if can_view is true
          if (p.can_view) {
            uniquePermissions.push(p)
          }
        })
        console.log('✅ PermissionStore: Normalization Complete. Valid Items:', uniquePermissions.map(p => `${p.service_name} (${p.can_view})`))


        // CRITICAL FIX: Always update with fresh API data
        // The old "preservation logic" was incorrectly treating employee permissions
        // (1 service with categories) as "empty" and preserving stale org data (4 services)
        // Employees should ONLY see what the backend returns for their role!
        console.log('✅ PermissionStore: Updating with fresh API data')
        this.permissions = uniquePermissions

        // 2. Normalize Plan Details (Prevent null crashes)
        const rawPlan = res.data.plan || {}
        this.planDetails = {
          title: rawPlan.title || rawPlan.plan_title || 'Free Plan',
          subtitle: rawPlan.subtitle || (rawPlan.billing_cycle_name ? `${rawPlan.billing_cycle_name} Plan` : 'Monthly Plan'),
          plan_title: rawPlan.plan_title || 'Free Plan',
          billing_cycle_name: rawPlan.billing_cycle_name || 'Monthly',
          days_left: typeof rawPlan.days_left === 'number' ? rawPlan.days_left : 30,
          is_expiring_soon: !!rawPlan.is_expiring_soon,
          price_amount: rawPlan.price_amount || '0.00',
          price_currency: rawPlan.price_currency || 'INR',
          start_date: rawPlan.start_date || new Date().toISOString(),
          end_date: rawPlan.end_date || new Date().toISOString(),
          ...rawPlan
        }

        // --- NORMALIZATION END ---

        // --- UPDATE USER PROFILE (Name & Role) ---
        if (res.data.user_profile) {
          const userDataCookie = useCookie('userData')
          const currentData = userDataCookie.value || JSON.parse(localStorage.getItem('userData') || '{}')

          // Only overwrite if the new value is truthy (prevent null/empty overwrite)
          const updatedData = {
            ...currentData,
            fullName: res.data.user_profile.fullName || currentData.fullName || currentData.username,
            avatar: res.data.user_profile.avatar || currentData.avatar,
            role: res.data.user_profile.role || currentData.role,
            email: res.data.user_profile.email || currentData.email,
          }

          userDataCookie.value = updatedData
          localStorage.setItem('userData', JSON.stringify(updatedData))
          this.userData = updatedData

          console.log("✅ PermissionStore: Profile Sync Result:", {
            incoming: res.data.user_profile,
            merged: {
              fullName: updatedData.fullName,
              avatar: updatedData.avatar,
              role: updatedData.role
            }
          })
        }
        // -----------------------------------------

        this.isPermissionsLoaded = true
        localStorage.setItem('provider_permissions', JSON.stringify(this.permissions))
        if (this.planDetails) {
          localStorage.setItem('provider_plan_details', JSON.stringify(this.planDetails))
        }
      } catch (err) {
        console.error('Failed to fetch permissions:', err)
        // Fallback to empty state on error, do not leave stale data if possible?
        // Actually, better to keep stale than empty if network fails.
      } finally {
        this.isLoading = false
      }
    },

    // Inject permissions immediately after purchase to avoid race conditions
    injectPurchasedPermissions(apiResponse) {
      console.log('🚀 PermissionStore: Injecting Purchased Permissions...', apiResponse)

      const { permissions, templates, purchased_plan } = apiResponse
      if (!permissions || !templates) return

      // 1. Build Hierarchical Tree (Frontend-side reconstruction)
      const serviceMap = {}
      const categoryMap = {}
      const facilityMap = {}

      // Index templates for quick lookup
      templates.services.forEach(s => serviceMap[s.id] = s)
      templates.categories.forEach(c => categoryMap[c.id] = c)
      templates.facilities.forEach(f => facilityMap[f.id] = f)

      const tree = {}

      permissions.forEach(p => {
        const sid = p.service_id
        if (!sid) return

        if (!tree[sid]) {
          const tmpl = serviceMap[sid]
          tree[sid] = {
            service_id: sid,
            service_name: tmpl?.display_name || 'Unknown Service',
            service_key: (tmpl?.name || sid).toUpperCase(),
            icon: tmpl?.icon || 'tabler-box',
            can_view: false,
            can_create: false,
            can_edit: false,
            can_delete: false,
            categories: []
          }
        }

        const cid = p.category_id
        if (!cid) {
          // Service level perms
          tree[sid].can_view = tree[sid].can_view || !!p.permissions?.can_view
          tree[sid].can_create = tree[sid].can_create || !!p.permissions?.can_create
          tree[sid].can_edit = tree[sid].can_edit || !!p.permissions?.can_edit
          tree[sid].can_delete = tree[sid].can_delete || !!p.permissions?.can_delete
          return
        }

        // Find or create category in tree[sid].categories
        let cat = tree[sid].categories.find(c => c.category_id === cid)
        if (!cat) {
          const tmpl = categoryMap[cid]
          cat = {
            category_id: cid,
            category_name: tmpl?.name || 'Unknown Category',
            linked_capability: tmpl?.linked_capability,
            can_view: false,
            can_create: false,
            can_edit: false,
            can_delete: false,
            facilities: []
          }
          tree[sid].categories.push(cat)
        }

        const fid = p.facility_id
        if (!fid) {
          // Category level perms
          cat.can_view = cat.can_view || !!p.permissions?.can_view
          cat.can_create = cat.can_create || !!p.permissions?.can_create
          cat.can_edit = cat.can_edit || !!p.permissions?.can_edit
          cat.can_delete = cat.can_delete || !!p.permissions?.can_delete

          // Implies parent view
          tree[sid].can_view = true
          return
        }

        // Facility level perms
        const f_tmpl = facilityMap[fid]
        cat.facilities.push({
          facility_id: fid,
          facility_name: f_tmpl?.name || 'Unknown Facility',
          can_view: !!p.permissions?.can_view,
          can_create: !!p.permissions?.can_create,
          can_edit: !!p.permissions?.can_edit,
          can_delete: !!p.permissions?.can_delete
        })

        // Implies parents view
        cat.can_view = true
        tree[sid].can_view = true
      })

      // Convert to flat list for the store
      this.permissions = Object.values(tree).filter(p => p.can_view)

      // 2. Update Plan Details
      if (purchased_plan) {
        this.planDetails = {
          title: purchased_plan.plan_title,
          subtitle: `${purchased_plan.billing_cycle} Plan`,
          plan_title: purchased_plan.plan_title,
          billing_cycle_name: purchased_plan.billing_cycle,
          start_date: purchased_plan.start_date,
          end_date: purchased_plan.end_date,
          days_left: 30, // Fallback
          is_expiring_soon: false
        }
      }

      // 3. Persist
      localStorage.setItem('provider_permissions', JSON.stringify(this.permissions))
      localStorage.setItem('provider_plan_details', JSON.stringify(this.planDetails))

      console.log('✅ PermissionStore: Injected state:', this.permissions)
    },

    clearPermissions() {
      this.permissions = []
      this.planDetails = null
      localStorage.removeItem('provider_permissions')
      localStorage.removeItem('provider_plan_details')
    },

    // Check if user has a specific permission (simple check for now)
    hasPermission(permissionName) {
      // 1. Get user role from localStorage
      let role = ''
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}')

        role = (userData.role?.name || userData.role || '').toLowerCase()
      } catch (e) {
        console.warn('Error parsing userData for permissions', e)
      }

      // 2. Normal checks

      // 3. Normal checks
      if (!permissionName) return true
      if (permissionName === 'manage_employees') return true // Default for now

      return this.canViewService(permissionName)
    },

    // Check specific action on a service (create, edit, delete)
    canPerformAction(serviceName, action) {
      // 1. Get user role
      let role = ''
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}')

        role = (userData.role?.name || userData.role || '').toLowerCase()
      } catch (e) {
        console.warn('Error parsing userData for permissions', e)
      }

      // 2. Normal checks

      // 3. Normal checks
      if (!serviceName || !action) return false

      const service = this.permissions.find(
        p => (p.service_key?.toLowerCase() === serviceName.toLowerCase()) ||
          (p.service_name?.toLowerCase() === serviceName.toLowerCase()),
      )

      if (!service) return false

      // Map action to property name
      const propMap = {
        'create': 'can_create',
        'edit': 'can_edit',
        'delete': 'can_delete',
        'view': 'can_view',
      }

      const prop = propMap[action]

      return !!service[prop]
    },

    // Check if a specific capability (Category) exists within a Service
    hasCapability(serviceName, categoryName, action = 'view') {
      // 1. Get user role
      let role = ''
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}')

        role = (userData.role?.name || userData.role || '').toLowerCase()
      } catch (e) {
        console.warn('Error parsing userData for permissions', e)
      }

      // 2. Normal checks

      if (!serviceName) return false

      // [FIX] Virtual Capability: PROVIDER_ADMIN & VETERINARY_CORE Bypass
      // Used to hide "Back to Provider" and "Settings" from Employees
      // Also ensures Admins can see all Veterinary modules (Visits, Vitals etc.) regardless of sync

      const adminRoles = [
        'organization',
        'individual',
        'organization_provider',
        'organization_admin',
        'super_admin',
        'provider' // Just in case
      ]
      const isAdmin = adminRoles.includes(role)

      if (serviceName === 'PROVIDER_ADMIN') {
        return isAdmin
      }

      // NOTE: Admin roles must still purchase services to access them
      // We removed the unconditional veterinary bypass - admins see only what's in their plan

      const service = this.permissions.find(
        p => (p.service_key?.toLowerCase() === serviceName.toLowerCase()) ||
          (p.service_name?.toLowerCase() === serviceName.toLowerCase()) ||
          (p.service_id?.toLowerCase() === serviceName.toLowerCase()),
      )

      if (!service) {
        // [FIX] Deep Search: If not found as a top-level service, check if it's a CATEGORY inside any service
        // This is crucial for granular permissions like VETERINARY_VISITS which are inside VETERINARY_CORE
        for (const s of this.permissions) {
          if (s.categories) {
            // console.log(`🔍 Deep Search in ${s.service_key}:`, s.categories.map(c => c.name))
            const nestedCategory = s.categories.find(c =>
              c.name?.toLowerCase() === serviceName.toLowerCase() ||
              c.category_key?.toLowerCase() === serviceName.toLowerCase()
            )

            if (nestedCategory) {
              // Found it! Check permissions on this category
              // Map action to property name
              const propMap = {
                'create': 'can_create',
                'edit': 'can_edit',
                'delete': 'can_delete',
                'view': 'can_view',
              }
              const prop = propMap[action] || 'can_view'
              return !!(nestedCategory[prop] || nestedCategory.permissions?.[prop])
            }
          }
        }

        if (serviceName.startsWith('VETERINARY')) {
          console.log(`🚫 hasCapability('${serviceName}'): Service/Category NOT FOUND even after deep search. Available keys:`, this.permissions.map(p => p.service_key))
        }

        // Backend now correctly includes VETERINARY_CORE in all cases,
        // so we don't need the implicit grant fallback anymore

        return false
      }

      // If checking for the service itself (e.g. VETERINARY_CORE)
      if (!categoryName) {
        // [FIX] Backend sends can_view at the root of the Service object
        const result = !!(service.can_view || service.permissions?.can_view)
        if (!result && serviceName.startsWith('VETERINARY')) {
          console.log(`🚫 hasCapability('${serviceName}'): Found service but can_view is false`, service)
        }
        return result
      }




      // If checking for a category (e.g. VETERINARY_VISITS)
      if (service.categories) {
        const category = service.categories.find(
          c => c.name?.toLowerCase() === categoryName.toLowerCase(),
        )

        if (!category) return false

        // Map action to property name
        const propMap = {
          'create': 'can_create',
          'edit': 'can_edit',
          'delete': 'can_delete',
          'view': 'can_view',
        }

        const prop = propMap[action] || 'can_view'

        // [FIX] Backend sends can_view at the root of the Category object
        return !!(category[prop] || category.permissions?.[prop])
      }

      return false
    },

    async fetchDynamicAccess() {
      this.isLoading = true
      try {
        console.log('🧭 PermissionStore: Fetching Dynamic Access...')
        const res = await providerApi.get('/api/provider/permissions/my-access/')

        this.dynamicCapabilities = res.data.capabilities || []
        this.dynamicModules = res.data.modules || []

        localStorage.setItem('dynamic_capabilities', JSON.stringify(this.dynamicCapabilities))
        localStorage.setItem('dynamic_modules', JSON.stringify(this.dynamicModules))

        this.isDynamicAccessLoaded = true
        console.log("✅ Fetched Dynamic Access:", this.dynamicModules.length, "modules")
      } catch (e) {
        console.error("Failed to fetch dynamic access", e)
        // Even on error, we mark it as "loaded" to prevent infinite spinner 
        // if the user has cached data or we want to show what we have.
        // But for strict fix, maybe we should handle it differently.
        this.isDynamicAccessLoaded = true
      } finally {
        this.isLoading = false
      }
    },

    hasDynamicCapability(key) {
      return this.dynamicCapabilities.includes(key)
    }
  },
})
