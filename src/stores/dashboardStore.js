import { providerApi } from '@/plugins/axios'
import { defineStore } from 'pinia'
import { usePermissionStore } from './permissionStore'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    widgets: [],
    userLayout: [],
    isLoading: false,
    isLoaded: false,
  }),

  getters: {
    visibleWidgets: state => {
      const permissionStore = usePermissionStore()

      return state.widgets.filter(widget => {
        const required = widget.required_capabilities || []
        const logic = widget.logic_type || 'OR'

        if (required.length === 0) return true

        if (logic === 'AND') {
          return required.every(cap => permissionStore.hasPermission(cap))
        } else {
          return required.some(cap => permissionStore.hasPermission(cap))
        }
      })
    },
  },

  actions: {
    async fetchDashboardConfig() {
      this.isLoading = true
      try {
        // Fetch both widgets and layout in parallel
        const [widgetsRes, layoutRes] = await Promise.all([
          providerApi.get('/api/provider/dashboard/widgets/'),
          providerApi.get('/api/provider/dashboard/layout/'),
        ])

        this.widgets = widgetsRes.data
        this.userLayout = layoutRes.data.layout_json || []
        this.isLoaded = true
      } catch (error) {
        console.error('Failed to fetch dashboard config:', error)
      } finally {
        this.isLoading = false
      }
    },

    async saveLayout(layout) {
      try {
        await providerApi.post('/api/provider/dashboard/layout/', {
          layout_json: layout,
        })
        this.userLayout = layout
      } catch (error) {
        console.error('Failed to save dashboard layout:', error)
      }
    },
  },
})
