<script setup>
import { ref, onMounted, computed } from 'vue'
import { useCookie } from '@/@core/composable/useCookie'
import { api, providerApi } from '@/plugins/axios'
import { usePermissionStore } from '@/stores/permissionStore'

const userData = useCookie('userData')

// Avatar
const avatarFile = ref(null)

const accountDataLocal = ref({
  avatarImg: userData.value?.avatar || '',
})

const avatarUrl = computed(() => {
  if (avatarFile.value) {
    return URL.createObjectURL(avatarFile.value)
  }
  
  return accountDataLocal.value.avatarImg
})

const onAvatarChange = e => {
  const file = e.target.files[0]
  if (file) {
    avatarFile.value = file
  }
}

const resetAvatar = () => {
  avatarFile.value = null
  accountDataLocal.value.avatarImg = userData.value?.avatar || ''
}

// Dynamic fields
const fields = ref([])
const loading = ref(false)

const fetchProfile = async () => {
  loading.value = true
  try {
    const role = typeof userData.value?.role === 'string' ? userData.value.role.toLowerCase() : ''
    const target = userData.value?.provider_type || (role === 'superadmin' ? 'superadmin' : 'individual')

    const res = await providerApi.get(`/api/provider/profile/`, {
      params: { 
        user: userData.value.id,
        target: target,
      },
    })
    
    // The API returns fields with their definitions and values
    // We map them to ensure reactivity
    fields.value = (res.data.fields || []).map(f => ({
      ...f,
      value: f.value || '', // Ensure value is not null for v-model
    }))
    
    // Update avatar if provided
    if (res.data.avatar) {
      accountDataLocal.value.avatarImg = res.data.avatar

      // Update cookie
      userData.value.avatar = res.data.avatar
    }

  } catch (err) {
    console.error('Failed to fetch profile', err)
  } finally {
    loading.value = false
  }
}

const submitForm = async () => {
  const fd = new FormData()
  
  // Append static avatar if selected
  if (avatarFile.value) {
    fd.append('avatar', avatarFile.value)
  }

  // Construct fields JSON and append files
  const fieldsData = []
  fields.value.forEach(field => {
    if (field.field_type === 'file') {
      if (field.fileValue) {
        fd.append(field.id, field.fileValue)
      }
    } else {
      fieldsData.push({
        field_id: field.id,
        value: field.value,
        metadata: field.metadata || {},
      })
    }
  })

  fd.append('fields', JSON.stringify(fieldsData))
  fd.append('auth_user_id', userData.value.id)
  
  try {
    const res = await providerApi.post(`/api/provider/profile/`, fd)

    // 🔥 SYNC TO GLOBAL STATE (Real-time updates without refresh)
    const profile = res.data.user_profile
    if (profile) {
      // 1. Update Cookie
      const currentData = userData.value || {}
      const updatedData = {
        ...currentData,
        fullName: profile.fullName,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        avatar: profile.avatar || currentData.avatar
      }
      userData.value = updatedData
      localStorage.setItem('userData', JSON.stringify(updatedData))

      // 2. Update local state for avatar preview
      if (profile.avatar) {
        accountDataLocal.value.avatarImg = profile.avatar
      }

      // 3. Sync with PermissionStore (updates Header, Sidebar, etc.)
      const permissionStore = usePermissionStore()
      permissionStore.userData = updatedData
      
      console.log("✅ Profile saved and synced to global state instantly.")
    }

    // Refresh local fields
    fetchProfile()
  } catch (err) {
    console.error('Failed to save profile', err)
  }
}

const resetForm = () => {
  fetchProfile()
}

onMounted(() => {
  if (userData.value) {
    fetchProfile()
  }
})
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard title="Profile Details">
        <VCardText class="d-flex">
          <!-- 👉 Avatar -->
          <VAvatar
            rounded
            size="100"
            class="me-6"
            :image="avatarUrl"
          />

          <!-- 👉 Upload Photo -->
          <form class="d-flex flex-column justify-center gap-4">
            <div class="d-flex flex-wrap gap-2">
              <VBtn
                color="primary"
                @click="$refs.refInputEl.click()"
              >
                <VIcon
                  icon="tabler-cloud-upload"
                  class="d-sm-none"
                />
                <span class="d-none d-sm-block">Upload new photo</span>
              </VBtn>

              <input
                ref="refInputEl"
                type="file"
                name="file"
                accept=".jpeg,.png,.jpg,gif"
                hidden
                @input="onAvatarChange"
              >

              <VBtn
                type="reset"
                color="secondary"
                variant="tonal"
                @click="resetAvatar"
              >
                <span class="d-none d-sm-block">Reset</span>
                <VIcon
                  icon="tabler-refresh"
                  class="d-sm-none"
                />
              </VBtn>
            </div>

            <p class="text-body-1 mb-0">
              Allowed JPG, GIF or PNG. Max size of 800K
            </p>
          </form>
        </VCardText>

        <VDivider />

        <VCardText>
          <!-- 👉 Form -->
          <VForm
            class="mt-6"
            @submit.prevent="submitForm"
          >
            <VRow>
              <!-- 👉 Dynamic Fields Loop -->
              <VCol
                v-for="field in fields"
                :key="field.id"
                cols="12"
                md="6"
              >
                <!-- Text / Number / Email / Phone -->
                <AppTextField
                  v-if="['text', 'number', 'email', 'phone'].includes(field.field_type)"
                  v-model="field.value"
                  :label="field.label"
                  :placeholder="field.placeholder || ''"
                  :type="field.field_type === 'number' ? 'number' : 'text'"
                  :rules="field.is_required ? [v => !!v || `${field.label} is required`] : []"
                />

                <!-- Textarea -->
                <AppTextarea
                  v-else-if="field.field_type === 'textarea'"
                  v-model="field.value"
                  :label="field.label"
                  :placeholder="field.placeholder || ''"
                  :rules="field.is_required ? [v => !!v || `${field.label} is required`] : []"
                  rows="3"
                />

                <!-- Dropdown / Select -->
                <AppSelect
                  v-else-if="field.field_type === 'dropdown' || field.field_type === 'select'"
                  v-model="field.value"
                  :label="field.label"
                  :items="field.options || []"
                  :rules="field.is_required ? [v => !!v || `${field.label} is required`] : []"
                />

                <!-- Multiselect -->
                <AppSelect
                  v-else-if="field.field_type === 'multiselect'"
                  v-model="field.value"
                  :label="field.label"
                  :items="field.options || []"
                  multiple
                  chips
                  closable-chips
                  :rules="field.is_required ? [v => !!v && v.length > 0 || `${field.label} is required`] : []"
                />

                <!-- Date -->
                <AppDateTimePicker
                  v-else-if="field.field_type === 'date'"
                  v-model="field.value"
                  :label="field.label"
                  :rules="field.is_required ? [v => !!v || `${field.label} is required`] : []"
                />

                <!-- File -->
                <VFileInput
                  v-else-if="field.field_type === 'file'"
                  v-model="field.fileValue"
                  :label="field.label"
                  :rules="field.is_required && !field.metadata?.file_url ? [v => !!v || `${field.label} is required`] : []"
                  :hint="field.metadata?.file_url ? `Currently: ${field.metadata.name || 'File uploaded'}` : field.help_text"
                  persistent-hint
                  prepend-icon="tabler-file"
                >
                  <template v-if="field.metadata?.file_url" #append>
                    <VBtn
                      icon
                      size="small"
                      variant="text"
                      :href="field.metadata.file_url"
                      target="_blank"
                    >
                      <VIcon icon="tabler-eye" />
                    </VBtn>
                  </template>
                </VFileInput>

                <!-- Fallback for unknown types -->
                <AppTextField
                  v-else
                  v-model="field.value"
                  :label="field.label"
                  :hint="`Unknown type: ${field.field_type}`"
                  persistent-hint
                />
              </VCol>

              <!-- 👉 Form Actions -->
              <VCol
                cols="12"
                class="d-flex flex-wrap gap-4"
              >
                <VBtn
                  type="submit"
                  :loading="loading"
                >
                  Save changes
                </VBtn>

                <VBtn
                  color="secondary"
                  variant="tonal"
                  type="reset"
                  @click.prevent="resetForm"
                >
                  Reset
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
