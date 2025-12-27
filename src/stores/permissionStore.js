import { defineStore } from 'pinia'
import { api } from '@/plugins/axios'

export const usePermissionStore = defineStore('permission', {
    state: () => {
        const safeParse = (key, fallback) => {
            try {
                const item = localStorage.getItem(key)
                return item ? JSON.parse(item) : fallback
            } catch (e) {
                console.warn(`Error parsing ${key} from localStorage`, e)
                return fallback
            }
        }
        return {
            // Structure: [{ service_id, service_name, can_view, categories: [...], ... }]
            permissions: safeParse('provider_permissions', []),
            planDetails: safeParse('provider_plan_details', null),
            isLoading: false,
        }
    },

    getters: {
        // Get all services that have can_view = true
        enabledServices: (state) => {
            return state.permissions.filter(p => p.can_view)
        },

        // Check if a specific service is viewable
        canViewService: (state) => (serviceName) => {
            if (!serviceName) return false
            const service = state.permissions.find(
                p => p.service_name?.toLowerCase() === serviceName.toLowerCase()
            )
            return !!service?.can_view
        },

        // Get permissions for a specific category within a service

        // Get permissions for a specific category within a service
        getCategoryPermissions: (state) => (serviceName, categoryName) => {
            const service = state.permissions.find(
                p => p.service_name?.toLowerCase() === serviceName.toLowerCase()
            )
            if (!service || !service.categories) return null

            return service.categories.find(
                c => c.name?.toLowerCase() === categoryName.toLowerCase()
            )
        }
    },

    actions: {
        async fetchPermissions() {
            this.isLoading = true
            try {
                // Fetch permissions from the Service Provider Service (Port 8002)
                const res = await api.get('http://127.0.0.1:8002/api/provider/permissions/')

                this.permissions = res.data.permissions || []
                this.planDetails = res.data.plan || null

                localStorage.setItem('provider_permissions', JSON.stringify(this.permissions))
                if (this.planDetails) {
                    localStorage.setItem('provider_plan_details', JSON.stringify(this.planDetails))
                }
            } catch (err) {
                console.error('Failed to fetch permissions:', err)
            } finally {
                this.isLoading = false
            }
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

            // 2. If Organization, GRANT ALL
            if (role === 'organization') return true

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

            // 2. If Organization, GRANT ALL
            if (role === 'organization') return true

            // 3. Normal checks
            if (!serviceName || !action) return false

            const service = this.permissions.find(
                p => p.service_name?.toLowerCase() === serviceName.toLowerCase()
            )

            if (!service) return false

            // Map action to property name
            const propMap = {
                'create': 'can_create',
                'edit': 'can_edit',
                'delete': 'can_delete',
                'view': 'can_view'
            }

            const prop = propMap[action]
            return !!service[prop]
        }
    }
})
