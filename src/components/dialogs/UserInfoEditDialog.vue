<script setup>
const props = defineProps({
  userData: {
    type: Object,
    required: false,
    default: () => ({
      id: 0,
      fullName: '',
      company: '',
      role: '',
      username: '',
      country: '',
      contact: '',
      email: '',
      currentPlan: '',
      status: '',
      avatar: '',
      taskDone: null,
      projectDone: null,
      taxId: '',
      language: '',
    }),
  },
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  providerProfile: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'submit',
  'update:isDialogVisible',
])

const userData = ref(structuredClone(toRaw(props.userData)))
const dynamicFields = ref([])
const firstName = ref('')
const lastName = ref('')

const isUseAsBillingAddress = ref(false)

const syncNames = () => {
  const parts = (userData.value.fullName || '').split(' ')

  firstName.value = parts[0] || ''
  lastName.value = parts.slice(1).join(' ') || ''
}

const syncDynamicFields = () => {
  // Filter out standard fields that are already handled by specific inputs
  const ignoredFields = [
    'first_name',
    'last_name',
    'email',
    'phone_number',
    'country',
    'language',
    'profile_image',
    'username',
    'status',
    'tax_id',
    'contact',
  ]
  
  if (props.providerProfile) {
    dynamicFields.value = props.providerProfile
      .filter(f => !ignoredFields.includes(f.name) && !['file', 'section'].includes(f.field_type))
      .map(f => ({ ...f })) // Clone to avoid mutating prop
  } else {
    dynamicFields.value = []
  }
}

watch(() => props.userData, () => {
  userData.value = structuredClone(toRaw(props.userData))
  syncNames()
}, { immediate: true })

watch(() => props.providerProfile, () => {
  syncDynamicFields()
}, { immediate: true })

const onFormSubmit = () => {
  userData.value.fullName = `${firstName.value} ${lastName.value}`.trim()
  emit('submit', { ...userData.value, dynamicFields: dynamicFields.value })
  emit('update:isDialogVisible', false)
}

const onFormReset = () => {
  userData.value = structuredClone(toRaw(props.userData))
  syncDynamicFields()
  emit('update:isDialogVisible', false)
}

const dialogModelValueUpdate = val => {
  emit('update:isDialogVisible', val)
}
</script>

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 900"
    :model-value="props.isDialogVisible"
    @update:model-value="dialogModelValueUpdate"
  >
    <!-- Dialog close btn -->
    <DialogCloseBtn @click="dialogModelValueUpdate(false)" />

    <VCard class="pa-sm-10 pa-2">
      <VCardText>
        <!-- 👉 Title -->
        <h4 class="text-h4 text-center mb-2">
          Edit User Information
        </h4>
        <p class="text-body-1 text-center mb-6">
          Updating user details will receive a privacy audit.
        </p>

        <!-- 👉 Form -->
        <VForm
          class="mt-6"
          @submit.prevent="onFormSubmit"
        >
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <AppTextField
                v-model="firstName"
                label="First Name"
                placeholder="John"
              />
            </VCol>

            <!-- 👉 Last Name -->
            <VCol
              cols="12"
              md="6"
            >
              <AppTextField
                v-model="lastName"
                label="Last Name"
                placeholder="Doe"
              />
            </VCol>

            <!-- 👉 Username -->
            <VCol cols="12">
              <AppTextField
                v-model="userData.username"
                label="Username"
                placeholder="john.doe.007"
              />
            </VCol>

            <!-- 👉 Billing Email -->
            <VCol
              cols="12"
              md="6"
            >
              <AppTextField
                v-model="userData.email"
                label="Email"
                placeholder="johndoe@email.com"
              />
            </VCol>

            <!-- 👉 Status -->
            <VCol
              cols="12"
              md="6"
            >
              <AppSelect
                v-model="userData.status"
                label="Status"
                placeholder="Active"
                :items="['Active', 'Inactive', 'Pending']"
              />
            </VCol>

            <!-- 👉 Tax Id -->
            <VCol
              cols="12"
              md="6"
            >
              <AppTextField
                v-model="userData.taxId"
                label="Tax ID"
                placeholder="123456789"
              />
            </VCol>

            <!-- 👉 Contact -->
            <VCol
              cols="12"
              md="6"
            >
              <AppTextField
                v-model="userData.contact"
                label="Phone Number"
                placeholder="+1 9876543210"
              />
            </VCol>

            <!-- 👉 Language -->
            <VCol
              cols="12"
              md="6"
            >
              <AppSelect
                v-model="userData.language"
                closable-chips
                chips
                multiple
                label="Language"
                placeholder="English"
                :items="['English', 'Spanish', 'French']"
              />
            </VCol>

            <!-- 👉 Country -->
            <VCol
              cols="12"
              md="6"
            >
              <AppSelect
                v-model="userData.country"
                label="Country"
                placeholder="United States"
                :items="['United States', 'United Kingdom', 'France']"
              />
            </VCol>

            <!-- 👉 Dynamic Fields -->
            <template
              v-for="field in dynamicFields"
              :key="field.name"
            >
              <VCol
                cols="12"
                md="6"
              >
                <!-- Textarea -->
                <AppTextarea
                  v-if="field.field_type === 'textarea'"
                  v-model="field.value"
                  :label="field.label"
                  rows="2"
                />

                <!-- Select -->
                <AppSelect
                  v-else-if="['dropdown', 'select'].includes(field.field_type)"
                  v-model="field.value"
                  :label="field.label"
                  :items="field.options || []"
                />

                <!-- Text / Default -->
                <AppTextField
                  v-else
                  v-model="field.value"
                  :label="field.label"
                />
              </VCol>
            </template>

            <!-- 👉 Switch -->
            <VCol cols="12">
              <VSwitch
                v-model="isUseAsBillingAddress"
                density="compact"
                label="Use as a billing address?"
              />
            </VCol>

            <!-- 👉 Submit and Cancel -->
            <VCol
              cols="12"
              class="d-flex flex-wrap justify-center gap-4"
            >
              <VBtn type="submit">
                Submit
              </VBtn>

              <VBtn
                color="secondary"
                variant="tonal"
                @click="onFormReset"
              >
                Cancel
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
</template>
