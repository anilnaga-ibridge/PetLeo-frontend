<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'submit', 'resend'])

const otp = ref('')

watch(() => props.modelValue, val => {
  if (val) {
    otp.value = ''
  }
})

const handleSubmit = () => {
  if (otp.value.length === 4) {
    emit('submit', otp.value)
  }
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="400"
    persistent
    @update:model-value="val => emit('update:modelValue', val)"
  >
    <VCard class="rounded-[24px] overflow-hidden">
      <div class="pa-6 text-center">
        <VAvatar
          color="primary-lighten-5"
          size="64"
          class="mb-4"
        >
          <VIcon
            icon="tabler-lock-check"
            size="32"
            color="primary"
          />
        </VAvatar>
        
        <h3 class="text-h5 font-weight-black text-slate-800 mb-2">
          Service Completion
        </h3>
        <p class="text-body-2 text-slate-500 mb-6">
          Please ask the pet owner for the 4-digit OTP sent to their device to mark this service as completed.
        </p>

        <VOtpInput
          v-model="otp"
          length="4"
          class="mb-6 justify-center"
          type="number"
          :disabled="loading"
        />

        <div
          v-if="error"
          class="text-error text-caption font-weight-bold mb-4 bg-error-lighten-5 pa-2 rounded-lg"
        >
          {{ error }}
        </div>

        <div class="d-flex flex-column gap-3">
          <VBtn
            block
            color="primary"
            height="48"
            class="rounded-xl font-weight-black"
            :loading="loading"
            :disabled="otp.length !== 4"
            @click="handleSubmit"
          >
            Verify & Complete
          </VBtn>
          
          <VBtn
            block
            variant="text"
            color="slate-500"
            height="48"
            class="rounded-xl"
            :disabled="loading"
            @click="emit('update:modelValue', false)"
          >
            Cancel
          </VBtn>

          <VBtn
            variant="plain"
            color="primary"
            size="small"
            class="mt-2"
            :disabled="loading"
            @click="emit('resend')"
          >
            Resend OTP
          </VBtn>
        </div>
      </div>
    </VCard>
  </VDialog>
</template>
