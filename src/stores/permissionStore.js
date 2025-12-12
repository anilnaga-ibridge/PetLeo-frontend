import { defineStore } from 'pinia'
import { api } from '@/plugins/axios'

export const usePermissionStore = defineStore('permission', {
    state: () => ({
        permissions: JSON.parse(localStorage.getItem('provider_permissions') || '[]'),
    }),

    actions: {
        async fetchPermissions() {
            try {
                const res = await api.get('http://127.0.0.1:8002/api/provider/permissions/')
                this.permissions = res.data.permissions || []
                localStorage.setItem('provider_permissions', JSON.stringify(this.permissions))
            } catch (err) {
                console.error('Failed to fetch permissions:', err)
            }
        },

        hasPermission(permission) {
            if (!permission) return true
            return this.permissions.includes(permission)
        },

        clearPermissions() {
            this.permissions = []
            localStorage.removeItem('provider_permissions')
        }
    }
})
