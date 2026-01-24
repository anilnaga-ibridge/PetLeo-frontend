<script setup>
import { ref, watch, computed } from 'vue'
import { api } from '@/plugins/axios'

const props = defineProps({
  modelValue: Boolean,
  employee: Object, // { id, full_name, auth_user_id, ... }
})

const emit = defineEmits(['update:modelValue', 'saved'])

const loading = ref(false)
const clinics = ref([])
const assignments = ref([])

const newAssignment = ref({
  clinic: null,
  role: 'Receptionist',
  permissions: [],
})

const roles = ref([])

const fetchRoles = async () => {
  try {
    // Fetch Custom Roles created by the Organization in Service Provider Service
    const res = await api.get('http://127.00.1:8002/api/provider/roles/')

    roles.value = res.data
  } catch (e) {
    console.error("Failed to fetch roles", e)
  }
}

const syncPermissions = roleName => {
  // Find the full role object
  const selectedRole = roles.value.find(r => r.name === roleName)
  if (selectedRole) {
    // Use capabilities defined in the Custom Role
    newAssignment.value.permissions = selectedRole.capabilities || []
  }
}

// Watch modelValue to reset and auto-sync default role
watch(() => props.modelValue, async val => {
  if (val && props.employee) {
    await fetchClinics()
    await fetchAssignments()
    await fetchRoles()
  }
})

const fetchClinics = async () => {
  try {
    const res = await api.get('http://127.0.0.1:8004/veterinary/clinics/')

    clinics.value = res.data
  } catch (e) {
    console.error("Failed to fetch clinics", e)
  }
}

const fetchAssignments = async () => {
  if (!props.employee?.auth_user_id) return
  loading.value = true
  try {
    const res = await api.get(`http://127.0.0.1:8004/veterinary/assignments/?staff_id=${props.employee.auth_user_id}`)

    assignments.value = res.data
  } catch (e) {
    console.error("Failed to fetch assignments", e)
  } finally {
    loading.value = false
  }
}

const addAssignment = async () => {
  if (!newAssignment.value.clinic || !newAssignment.value.role) return
    
  loading.value = true
  try {
    const payload = {
      clinic: newAssignment.value.clinic,
      role: newAssignment.value.role,
      staff_auth_id: props.employee.auth_user_id,
      permissions: newAssignment.value.permissions, // Send Explicit Permissions
    }
        
    await api.post('http://127.0.0.1:8004/veterinary/assignments/', payload)
        
    await fetchAssignments()
    newAssignment.value.clinic = null
    emit('saved')
  } catch (e) {
    alert("Failed to assign: " + (e.response?.data?.detail || e.message))
  } finally {
    loading.value = false
  }
}

const removeAssignment = async id => {
  if (!confirm("Start removal?")) return
  try {
    await api.delete(`http://127.0.0.1:8004/veterinary/assignments/${id}/`)
    fetchAssignments()
  } catch (e) {
    alert("Failed to remove")
  }
}

const getClinicName = id => clinics.value.find(c => c.id === id)?.name || id
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="600"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard title="Assign Clinic & Roles">
      <VCardText>
        <div
          v-if="loading && !assignments.length"
          class="text-center pa-4"
        >
          <VProgressCircular
            indeterminate
            color="primary"
          />
        </div>
            
        <div v-else>
          <!-- Existing Assignments -->
          <VTable
            density="compact"
            class="mb-6 border rounded"
          >
            <thead>
              <tr>
                <th>Clinic</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="assign in assignments"
                :key="assign.id"
              >
                <td>{{ assign.clinic_name || assign.clinic }}</td>
                <td>
                  <VChip
                    size="small"
                    color="primary"
                    variant="tonal"
                  >
                    {{ assign.role }}
                  </VChip>
                </td>
                <td>
                  <VBtn
                    icon="tabler-trash"
                    size="x-small"
                    color="error"
                    variant="text"
                    @click="removeAssignment(assign.id)"
                  />
                </td>
              </tr>
              <tr v-if="!assignments.length">
                <td
                  colspan="3"
                  class="text-center text-disabled"
                >
                  No clinics assigned yet.
                </td>
              </tr>
            </tbody>
          </VTable>
                
          <div class="d-flex flex-column gap-4 bg-grey-lighten-5 pa-4 rounded">
            <div class="d-flex gap-4 align-end">
              <div style="flex: 2">
                <VLabel class="mb-1 text-caption">
                  Clinic
                </VLabel>
                <VAutocomplete 
                  v-model="newAssignment.clinic" 
                  :items="clinics" 
                  item-title="name" 
                  item-value="id" 
                  placeholder="Select Clinic" 
                  density="compact"
                  bg-color="white"
                />
              </div>
              <div style="flex: 2">
                <VLabel class="mb-1 text-caption">
                  Role
                </VLabel>
                <VSelect 
                  v-model="newAssignment.role" 
                  :items="roles" 
                  item-title="name"
                  item-value="name"
                  placeholder="Select Role" 
                  density="compact"
                  bg-color="white"
                  :loading="roles.length === 0"
                  @update:model-value="syncPermissions"
                />
              </div>
            </div>

            <!-- Hidden Permissions Note -->
            <div class="px-1">
              <p class="text-caption text-medium-emphasis mb-0">
                * Permissions are automatically applied based on the selected Role. 
                Manage Roles in <strong class="text-primary">Provider Roles</strong>.
              </p>
            </div>

            <VBtn
              color="primary"
              block
              :loading="loading"
              @click="addAssignment"
            >
              Assign
            </VBtn>
          </div>
        </div>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          text="Close"
          @click="emit('update:modelValue', false)"
        />
      </VCardActions>
    </VCard>
  </VDialog>
</template>
