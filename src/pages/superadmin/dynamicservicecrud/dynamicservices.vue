<template>
   <section>
     <div class="service-form-container">
        <div class="form-card">
            <h2 class="form-title">
                🐶 Add New Service
            </h2>

            <form @submit.prevent="addService" class="form-content">
                <!-- Service Name -->
                <div class="form-group">
                    <label>Service Name</label>
                    <input v-model="service.name" type="text" placeholder="Ex: pet_care" required />
                </div>

                <!-- Display Name -->
                <div class="form-group">
                    <label>Display Name</label>
                    <input v-model="service.display_name" type="text" placeholder="Ex: Pet Care Service" required />
                </div>

                <!-- Description -->
                <div class="form-group">
                    <label>Description</label>
                    <textarea v-model="service.description" rows="3"
                        placeholder="This service includes health checkups, grooming and training."></textarea>
                </div>

                <!-- Active / Blocked -->
                <div class="form-checkbox-group">
                    <label class="checkbox">
                        <input v-model="service.is_active" type="checkbox" />
                        <span>Active</span>
                    </label>
                    <label class="checkbox">
                        <input v-model="service.blocked" type="checkbox" />
                        <span>Blocked</span>
                    </label>
                </div>

                <!-- Submit Button -->
                <div class="form-actions">
                    <button type="submit" :disabled="loading">
                        {{ loading ? "Saving..." : "Save Service" }}
                    </button>
                </div>
            </form>

            <!-- Messages -->
            <p v-if="successMessage" class="message success">
                ✅ {{ successMessage }}
            </p>
            <p v-if="errorMessage" class="message error">
                ❌ {{ errorMessage }}
            </p>
        </div>
    </div>
   </section>
</template>

<script setup>
import { useCookie } from '@/@core/composable/useCookie'
import axios from 'axios'
import { ref } from 'vue'

const API_URL = 'http://127.0.0.1:8003/api/superadmin/services/'

const service = ref({
  name: '',
  display_name: '',
  description: '',
  is_active: true,
  blocked: false,
})

const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const addService = async () => {
  const token = useCookie('accessToken').value
  console.log('Token:', token)

  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    // ✅ Correct axios usage
    const res = await axios.post(API_URL, service.value, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    successMessage.value = '✅ Service added successfully!'
    console.log('✅ Response:', res.data)

    // Reset form
    service.value = {
      name: '',
      display_name: '',
      description: '',
      is_active: true,
      blocked: false,
    }
  } catch (err) {
    console.error('❌ Error:', err)
    errorMessage.value = err.response?.data?.detail || 'Failed to add service.'
  } finally {
    loading.value = false
  }
}
</script>


<style scoped lang="scss">
.service-form-container {
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
    min-height: 100vh;
    padding: 2rem;
}

.form-card {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
    padding: 2rem;
    max-width: 600px;
    width: 100%;
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }
}

.form-title {
    font-size: 1.8rem;
    font-weight: 600;
    text-align: center;
    background: linear-gradient(to right, #4f46e5, #6366f1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 1.5rem;
}

.form-content {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.form-group {
    display: flex;
    flex-direction: column;

    label {
        font-weight: 500;
        margin-bottom: 0.4rem;
        color: #4b5563;
    }

    input,
    textarea {
        border: 1px solid #d1d5db;
        border-radius: 8px;
        padding: 0.65rem 0.8rem;
        font-size: 0.95rem;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;

        &:focus {
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }
    }

    textarea {
        resize: none;
    }
}

.form-checkbox-group {
    display: flex;
    justify-content: space-between;
    gap: 1rem;

    .checkbox {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        input {
            accent-color: #4f46e5;
        }

        span {
            color: #374151;
            font-size: 0.95rem;
        }
    }
}

.form-actions {
    display: flex;
    justify-content: center;
    margin-top: 1rem;

    button {
        background: linear-gradient(90deg, #4f46e5, #6366f1);
        color: #fff;
        padding: 0.6rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
            background: linear-gradient(90deg, #4338ca, #4f46e5);
        }

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    }
}

.message {
    text-align: center;
    margin-top: 1.25rem;
    font-weight: 500;

    &.success {
        color: #16a34a;
    }

    &.error {
        color: #dc2626;
    }
}

@media (max-width: 640px) {
    .form-card {
        padding: 1.5rem;
    }

    .form-title {
        font-size: 1.5rem;
    }
}
</style>
