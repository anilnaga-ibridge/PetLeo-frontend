<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePermissionStore } from '@/stores/permissionStore'
import ProviderLayout from '@/components/ProviderLayout.vue'
import ReviewsSection from './components/ReviewsSection.vue'

const router = useRouter()
const permissionStore = usePermissionStore()

onMounted(() => {
  const userData = permissionStore.userData || {}
  const roleUpper = (userData.role?.name || userData.role || '').toUpperCase()
  const isProviderOrOrg = ['ORGANIZATION', 'INDIVIDUAL', 'PROVIDER', 'SERVICE_PROVIDER'].includes(roleUpper)
  
  if (!isProviderOrOrg) {
    console.log('🚫 Access Denied: Redirecting employee to personal reviews')
    router.replace('/employee/reviews')
  }
})
</script>

<template>
  <ProviderLayout>
    <div class="pa-6">
      <div class="mb-6">
        <h1 class="text-h3 font-weight-black text-slate-800 tracking-tight mb-1">Customer Reviews</h1>
        <p class="text-subtitle-1 text-slate-500 font-weight-medium">See what pet owners are saying about your service.</p>
      </div>
      
      <ReviewsSection />
    </div>
  </ProviderLayout>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
