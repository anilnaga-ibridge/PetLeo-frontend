<script setup>
import { ref, onMounted, computed } from 'vue';
import { useCookie } from '@/@core/composable/useCookie';
import { api } from '@/plugins/axios';

const userData = useCookie('userData');

// Local form data
const firstName = ref('');
const lastName = ref('');
const email = ref('');
const organization = ref('');
const phoneNumber = ref('');
const address = ref('');
const state = ref('');
const zipCode = ref('');
const country = ref('');
const language = ref('');
const timezone = ref('');
const currency = ref('');

// Avatar
const avatarFile = ref(null);
const accountDataLocal = ref({
  avatarImg: userData.value?.avatar || '',
});

const avatarUrl = computed(() => {
  if (avatarFile.value) {
    return URL.createObjectURL(avatarFile.value);
  }
  return accountDataLocal.value.avatarImg;
});

const onAvatarChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    avatarFile.value = file;
  }
};

const resetAvatar = () => {
  avatarFile.value = null;
  accountDataLocal.value.avatarImg = userData.value?.avatar || '';
};

// Dynamic fields
const fields = ref([]);
const loading = ref(false);

const fetchProfile = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/api/provider/profile/?user=${userData.value.id}`);
    fields.value = res.data.fields || [];
    
    // Update avatar if provided
    if (res.data.avatar) {
      accountDataLocal.value.avatarImg = res.data.avatar;
      // Update cookie
      userData.value.avatar = res.data.avatar;
    }

    // Map fields to local refs if needed, or use a dynamic object
    // For now, we are keeping the static fields as per user request, 
    // but we can populate them if the backend returns them.
  } catch (err) {
    console.error('Failed to fetch profile', err);
  } finally {
    loading.value = false;
  }
};

const submitForm = async () => {
  const fd = new FormData();
  
  // Append static avatar if selected
  if (avatarFile.value) {
    fd.append('avatar', avatarFile.value);
  }

  // Append other fields...
  // For now, just avatar is critical based on recent tasks.
  
  try {
    const res = await api.post(`/api/provider/profile/?user=${userData.value.id}`, fd);
    // Update cookie with new avatar
    if (res.data.avatar) {
      userData.value.avatar = res.data.avatar;
      accountDataLocal.value.avatarImg = res.data.avatar;
    }
  } catch (err) {
    console.error('Failed to save profile', err);
  }
};

const resetForm = () => {
  if (userData.value) {
    firstName.value = userData.value.fullName?.split(' ')[0] || '';
    lastName.value = userData.value.fullName?.split(' ')[1] || '';
    email.value = userData.value.email || '';
    organization.value = '';
    phoneNumber.value = '';
    address.value = '';
    state.value = '';
    zipCode.value = '';
    country.value = '';
    language.value = '';
    timezone.value = '';
    currency.value = '';
  }
};

onMounted(() => {
  if (userData.value) {
    firstName.value = userData.value.fullName?.split(' ')[0] || '';
    lastName.value = userData.value.fullName?.split(' ')[1] || '';
    email.value = userData.value.email || '';
    // ... init other fields
    fetchProfile();
  }
});
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
          <VForm class="mt-6" @submit.prevent="submitForm">
            <VRow>
              <!-- 👉 First Name -->
              <VCol
                md="6"
                cols="12"
              >
                <AppTextField
                  v-model="firstName"
                  label="First Name"
                />
              </VCol>

              <!-- 👉 Last Name -->
              <VCol
                md="6"
                cols="12"
              >
                <AppTextField
                  v-model="lastName"
                  label="Last Name"
                />
              </VCol>

              <!-- 👉 Email -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="email"
                  label="E-mail"
                />
              </VCol>

              <!-- 👉 Organization -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="organization"
                  label="Organization"
                />
              </VCol>

              <!-- 👉 Phone -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="phoneNumber"
                  label="Phone Number"
                />
              </VCol>

              <!-- 👉 Address -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="address"
                  label="Address"
                />
              </VCol>

              <!-- 👉 State -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="state"
                  label="State"
                />
              </VCol>

              <!-- 👉 Zip Code -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="zipCode"
                  label="Zip Code"
                />
              </VCol>

              <!-- 👉 Country -->
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  v-model="country"
                  label="Country"
                  :items="['USA', 'Canada', 'UK', 'India', 'Australia']"
                />
              </VCol>

              <!-- 👉 Language -->
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  v-model="language"
                  label="Language"
                  :items="['English', 'Spanish', 'French', 'German', 'Hindi']"
                />
              </VCol>

              <!-- 👉 Timezone -->
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  v-model="timezone"
                  label="Timezone"
                  :items="['(GMT-11:00) International Date Line West', '(GMT-11:00) Midway Island', '(GMT-10:00) Hawaii']"
                />
              </VCol>

              <!-- 👉 Currency -->
              <VCol
                cols="12"
                md="6"
              >
                <AppSelect
                  v-model="currency"
                  label="Currency"
                  :items="['USD', 'EUR', 'GBP', 'INR', 'AUD']"
                />
              </VCol>

              <!-- 👉 Form Actions -->
              <VCol
                cols="12"
                class="d-flex flex-wrap gap-4"
              >
                <VBtn type="submit">
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
