// src/stores/serviceStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useCookie } from '@/@core/composable/useCookie'   // ← same helper as your component

export const useServiceStore = defineStore('servicestore', () => {
  const services = ref([])

  const fetchServices = async () => {
    try {
      const token = useCookie('accessToken').value
      console.log('service TOKEN =', token)

      if (!token) {
        console.warn('No access token found. Skipping fetchServices (login required).')
        services.value = []
        return
      }

      const res = await axios.get('http://127.0.0.1:8003/api/superadmin/services/', {
        headers: { Authorization: `Bearer ${token}` },
      })

      services.value = res.data || []
    } catch (err) {
      console.error('❌ Fetch Services Error:', err)
      services.value = []
    }
  }

  return { services, fetchServices }
})


// <script setup>
// import { onMounted } from 'vue'
// import { useServiceStore } from '@/stores/serviceStore'

// const serviceStore = useServiceStore()

// onMounted(serviceStore.fetchServices)
// </script>

// <template>
//   <VSelect
//     label="Select Service"
//     :items="serviceStore.services"
//     item-title="display_name"  <!-- ✅ Show Display Name -->
//     item-value="id"            <!-- ✅ Store Service ID -->
//     placeholder="Choose a service"
//   />
// </template>
