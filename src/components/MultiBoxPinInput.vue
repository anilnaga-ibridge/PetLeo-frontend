<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'

const props = defineProps({
  length: {
    type: Number,
    default: 4,
  },
  modelValue: {
    type: String,
    default: '',
  },
  error: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'complete'])

const digits = ref([])
const inputRefs = ref([])

// Initialize digits array based on length
const initDigits = () => {
  digits.value = new Array(props.length).fill('')

  // If modelValue exists, pre-fill
  if (props.modelValue && props.modelValue.length === props.length) {
    digits.value = props.modelValue.split('')
  }
}

watch(() => props.modelValue, newVal => {
  if (newVal !== digits.value.join('')) {
    if (!newVal) {
      digits.value = new Array(props.length).fill('')
    } else if (newVal.length === props.length) {
      digits.value = newVal.split('')
    }
  }
})

watch(() => props.length, newLength => {
  // Resize digits array, preserving existing values if possible
  const newDigits = new Array(newLength).fill('')

  digits.value.forEach((val, i) => {
    if (i < newLength) newDigits[i] = val
  })
  digits.value = newDigits

  // Emit update if value changed (truncated)
  emit('update:modelValue', digits.value.join(''))
})

const handleInput = (index, event) => {
  const val = event.target.value
  
  // Ensure only numbers
  if (!/^\d*$/.test(val)) {
    digits.value[index] = ''
    
    return
  }

  // Take only the last character if multiple entered (though maxlength is 1)
  const lastChar = val.slice(-1)

  digits.value[index] = lastChar

  // Emit update
  const newValue = digits.value.join('')

  emit('update:modelValue', newValue)

  if (newValue.length === props.length) {
    emit('complete', newValue)
  }

  // Move focus to next
  if (lastChar && index < props.length - 1) {
    nextTick(() => {
      inputRefs.value[index + 1]?.focus()
    })
  }
}

const handleKeyDown = (index, event) => {
  if (event.key === 'Backspace') {
    if (!digits.value[index] && index > 0) {
      // If empty and backspace pressed, go to previous
      inputRefs.value[index - 1]?.focus()
    } else {
      // Clear current
      digits.value[index] = ''
      emit('update:modelValue', digits.value.join(''))
    }
  } else if (event.key === 'ArrowLeft' && index > 0) {
    inputRefs.value[index - 1]?.focus()
  } else if (event.key === 'ArrowRight' && index < props.length - 1) {
    inputRefs.value[index + 1]?.focus()
  }
}

const handlePaste = event => {
  event.preventDefault()

  const pastedData = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, props.length)
  
  if (pastedData) {
    pastedData.split('').forEach((char, i) => {
      digits.value[i] = char
    })

    const newValue = digits.value.join('')

    emit('update:modelValue', newValue)
    
    if (newValue.length === props.length) {
      emit('complete', newValue)
    }
    
    // Focus the last filled input or the next empty one
    const nextIndex = Math.min(pastedData.length, props.length - 1)

    nextTick(() => {
      inputRefs.value[nextIndex]?.focus()
    })
  }
}

onMounted(() => {
  initDigits()
})
</script>

<template>
  <div class="pin-input-container">
    <div class="pin-inputs">
      <input
        v-for="(digit, index) in length"
        :key="index"
        :ref="el => inputRefs[index] = el"
        type="text"
        inputmode="numeric"
        maxlength="1"
        :value="digits[index]"
        class="pin-box"
        :class="[{ 'has-error': error, 'is-filled': digits[index] }]"
        autocomplete="one-time-code"
        @input="event => handleInput(index, event)"
        @keydown="event => handleKeyDown(index, event)"
        @paste="handlePaste"
      >
    </div>
  </div>
</template>

<style scoped>
.pin-input-container {
  display: flex;
  justify-content: center;
  margin: 1rem 0;
}

.pin-inputs {
  display: flex;
  gap: 12px;
}

.pin-box {
  width: 56px;
  height: 64px;
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  border: 2px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 16px;
  background-color: rgba(var(--v-theme-surface), 0.8);
  color: rgb(var(--v-theme-on-surface));
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

/* Dark mode adjustment */
.v-theme--dark .pin-box {
  border-color: rgba(255, 255, 255, 0.1);
  background-color: rgba(30, 41, 59, 0.5);
}

.pin-box:focus {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgb(var(--v-theme-surface));
  box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.15), 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.pin-box.is-filled {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.pin-box.has-error {
  border-color: rgb(var(--v-theme-error));
  color: rgb(var(--v-theme-error));
  background-color: rgba(var(--v-theme-error), 0.05);
  animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

/* Mobile responsiveness */
@media (max-width: 400px) {
  .pin-inputs {
    gap: 8px;
  }
  .pin-box {
    width: 40px;
    height: 48px;
    font-size: 1.25rem;
  }
}
</style>
