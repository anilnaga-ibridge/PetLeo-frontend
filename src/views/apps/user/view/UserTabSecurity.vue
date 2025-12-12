<script setup>
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

const isOldPinVisible = ref(false)
const isNewPinVisible = ref(false)
const isConfirmPinVisible = ref(false)

const oldPin = ref('')
const newPin = ref('')
const confirmPin = ref('')
const loading = ref(false)

const smsVerificationNumber = ref('+1(968) 819-2547')
const isTwoFactorDialogOpen = ref(false)

const changePin = async () => {
  if (!oldPin.value || !newPin.value || !confirmPin.value) {
    // You might want to add a toast notification here
    alert("Please fill all fields")
    return
  }

  if (newPin.value !== confirmPin.value) {
    alert("New PINs do not match")
    return
  }

  loading.value = true
  try {
    const { data, error } = await useApi('http://127.0.0.1:8000/auth/change-pin/', {
      method: 'POST',
      body: {
        old_pin: oldPin.value,
        new_pin: newPin.value,
        confirm_new_pin: confirmPin.value
      }
    })

    if (error.value) {
      console.error("Change PIN Error:", error.value)
      alert(error.value.detail || "Failed to change PIN")
    } else {
      alert("PIN changed successfully!")
      oldPin.value = ''
      newPin.value = ''
      confirmPin.value = ''
    }
  } catch (err) {
    console.error("Change PIN Exception:", err)
    alert("An error occurred")
  } finally {
    loading.value = false
  }
}

const recentDeviceHeader = [
  {
    title: 'BROWSER',
    key: 'browser',
  },
  {
    title: 'DEVICE',
    key: 'device',
  },
  {
    title: 'LOCATION',
    key: 'location',
  },
  {
    title: 'RECENT ACTIVITY',
    key: 'activity',
  },
]

const recentDevices = [
  {
    browser: ' Chrome on Windows',
    icon: 'tabler-brand-windows',
    color: 'info',
    device: 'HP Spectre 360',
    location: 'Switzerland',
    activity: '10, July 2021 20:07',
  },
  {
    browser: 'Chrome on Android',
    icon: 'tabler-brand-android',
    color: 'success',
    device: 'Oneplus 9 Pro',
    location: 'Dubai',
    activity: '14, July 2021 15:15',
  },
  {
    browser: 'Chrome on macOS',
    icon: 'tabler-brand-apple',
    color: 'secondary',
    device: 'Apple iMac',
    location: 'India',
    activity: '16, July 2021 16:17',
  },
  {
    browser: 'Chrome on iPhone',
    icon: 'tabler-device-mobile',
    color: 'error',
    device: 'iPhone 12x',
    location: 'Australia',
    activity: '13, July 2021 10:10',
  },
]
</script>

<template>
  <VRow>
    <VCol cols="12">
      <!-- 👉 Change PIN -->
      <VCard title="Change PIN">
        <VCardText>
          <VAlert
            closable
            variant="tonal"
            color="warning"
            class="mb-4"
            title="Ensure that these requirements are met"
            text="PIN must be 4-6 digits long."
          />

          <VForm @submit.prevent="changePin">
            <VRow>
              <VCol
                cols="12"
                md="4"
              >
                <AppTextField
                  v-model="oldPin"
                  label="Old PIN"
                  placeholder="······"
                  :type="isOldPinVisible ? 'text' : 'password'"
                  :append-inner-icon="isOldPinVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isOldPinVisible = !isOldPinVisible"
                />
              </VCol>
              <VCol
                cols="12"
                md="4"
              >
                <AppTextField
                  v-model="newPin"
                  label="New PIN"
                  placeholder="······"
                  :type="isNewPinVisible ? 'text' : 'password'"
                  :append-inner-icon="isNewPinVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isNewPinVisible = !isNewPinVisible"
                />
              </VCol>
              <VCol
                cols="12"
                md="4"
              >
                <AppTextField
                  v-model="confirmPin"
                  label="Confirm New PIN"
                  placeholder="······"
                  :type="isConfirmPinVisible ? 'text' : 'password'"
                  :append-inner-icon="isConfirmPinVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isConfirmPinVisible = !isConfirmPinVisible"
                />
              </VCol>

              <VCol cols="12">
                <VBtn
                  type="submit"
                  :loading="loading"
                >
                  Change PIN
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12">
      <!-- 👉 Two step verification -->
      <VCard
        title="Two-steps verification"
        subtitle="Keep your account secure with authentication step."
      >
        <VCardText>
          <div class="text-h6 mb-1">
            SMS
          </div>
          <AppTextField placeholder="+1(968) 819-2547">
            <template #append>
              <IconBtn color="secondary">
                <VIcon
                  icon="tabler-edit"
                  size="22"
                />
              </IconBtn>
              <IconBtn color="secondary">
                <VIcon
                  icon="tabler-user-plus"
                  size="22"
                />
              </IconBtn>
            </template>
          </AppTextField>

          <p class="mb-0 mt-4">
            Two-factor authentication adds an additional layer of security to your account by requiring more than just a password to log in. <a
              href="javascript:void(0)"
              class="text-decoration-none"
            >Learn more</a>.
          </p>
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12">
      <!-- 👉 Recent devices -->

      <VCard title="Recent devices">
        <VDivider />
        <VDataTable
          :items="recentDevices"
          :headers="recentDeviceHeader"
          hide-default-footer
          class="text-no-wrap"
        >
          <template #item.browser="{ item }">
            <div class="d-flex align-center gap-x-4">
              <VIcon
                :icon="item.icon"
                :color="item.color"
                :size="22"
              />
              <div class="text-body-1 text-high-emphasis">
                {{ item.browser }}
              </div>
            </div>
          </template>
          <!-- TODO Refactor this after vuetify provides proper solution for removing default footer -->
          <template #bottom />
        </VDataTable>
      </VCard>
    </VCol>
  </VRow>

  <!-- 👉 Enable One Time Password Dialog -->
  <TwoFactorAuthDialog
    v-model:is-dialog-visible="isTwoFactorDialogOpen"
    :sms-code="smsVerificationNumber"
  />
</template>
