<script setup>
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const router = useRouter()

// Redirect /employee/services to dashboard
definePage({
  meta: {
    layout: 'blank',
    public: false,
  },
})

onMounted(() => {
  router.replace('/employee/dashboard')
})
</script>

<template>
  <div class="pa-4 text-center">
    <p>Redirecting...</p>
  </div>
</template>
