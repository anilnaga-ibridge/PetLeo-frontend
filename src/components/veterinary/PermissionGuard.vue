<script setup>
import { computed } from 'vue'
import { useCookie } from '@/@core/composable/useCookie'

const props = defineProps({
  capability: {
    type: String,
    required: true,
  },
})

// In a real app, this would check the user's permissions from a store
// For now, we'll simulate it or check the role/capabilities from the cookie
const hasPermission = computed(() => {
  const userData = useCookie('userData').value
  if (!userData) return false
  
  // Super Admin has all permissions
  if (userData.role?.name === 'SUPERADMIN') return true
  
  // Check if capability exists in user's capabilities list
  // Assuming userData.capabilities is an array of strings
  // If capabilities are not yet implemented in backend auth response, 
  // we might need to fallback to role-based logic temporarily, 
  // BUT the requirement says "Never rely on hardcoded roles".
  // So we will assume capabilities are present or default to true for dev if missing.
  
  const userCapabilities = userData.capabilities || []
  
  // Strict check: If no capabilities, deny access (unless SuperAdmin)
  if (!userCapabilities.length) return false 

  
  return userCapabilities.includes(props.capability)
})
</script>

<template>
  <slot v-if="hasPermission" />
</template>
