import { defineStore } from 'pinia'
import { providerApi } from '@/plugins/axios'

export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    events: [],
    resourceUtilization: [], // Rooms, Tables, etc.
    stats: {
      scheduled: 0,
      waiting: 0,
      engaged: 0,
      done: 0,
    },
    lockConflicts: [],
    isLoading: false,
    viewMode: 'timeGridWeek', // 'timeGridDay' | 'timeGridWeek'
  }),

  actions: {
    async fetchCalendarData(startDate, endDate) {
      this.isLoading = true
      try {
        const response = await providerApi.get('/api/provider/calendar-feed/', {
          params: { start: startDate, end: endDate },
        })

        // Map backend BookingItems to FullCalendar events
        this.events = response.data.map(item => ({
          id: item.id,
          title: `${item.pet_name} - ${item.service_name}`,
          start: item.selected_time,
          end: item.end_time,
          backgroundColor: this.getStatusColor(item.status),
          borderColor: 'transparent',
          extendedProps: {
            item,
          },
        }))

        // Mocking stats for the operational hub
        this.stats = {
          scheduled: this.events.length,
          waiting: Math.floor(this.events.length * 0.2),
          engaged: 2,
          done: 5,
        }
      } catch (err) {
        console.error('Failed to fetch calendar data:', err)
      } finally {
        this.isLoading = false
      }
    },

    async fetchResourceUtilization() {
      // In real app, this calls the capacity-aware resource occupancy API
      try {
        const response = await providerApi.get('/api/provider/resource-occupancy/')

        this.resourceUtilization = response.data
      } catch (err) {
        console.error('Error fetching utilization:', err)
      }
    },

    getStatusColor(status) {
      const colors = {
        'PENDING': '#F59E0B',
        'CONFIRMED': '#3B82F6',
        'IN_PROGRESS': '#8B5CF6',
        'COMPLETED': '#10B981',
        'CANCELLED': '#EF4444',
      }

      
      return colors[status] || '#94A3B8'
    },
  },
})
