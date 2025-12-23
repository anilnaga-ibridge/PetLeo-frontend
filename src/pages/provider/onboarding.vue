<script setup>
import { ref } from 'vue'
import DynamicProfileForm from '@/pages/superadmin/dynamic-providerfields/dynamicprofileform.vue'
import DocDynamic from '@/pages/superadmin/dynamic-providerfields/docdynamic.vue'

const activeTab = ref('profile')
</script>

<template>
  <div class="onboarding-container">
    <div class="header-section">
      <h1 class="title">Provider Onboarding</h1>
      <p class="subtitle">Complete your profile to unlock your potential</p>
    </div>

    <div class="tabs-wrapper">
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'profile' }"
        @click="activeTab = 'profile'"
      >
        Profile
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'documents' }"
        @click="activeTab = 'documents'"
      >
        Documents
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'done' }"
        @click="activeTab = 'done'"
      >
        Done
      </div>
    </div>

    <div class="content-area">
      <div v-if="activeTab === 'profile'">
        <DynamicProfileForm />
      </div>
      <div v-else-if="activeTab === 'documents'">
        <DocDynamic />
      </div>
      <div v-else-if="activeTab === 'done'" class="done-section">
        <div class="done-card">
          <div class="icon">🎉</div>
          <h2>All Set!</h2>
          <p>Your profile is under review. You will be notified once approved.</p>
          <VBtn color="primary" to="/provider/dashboard">Go to Dashboard</VBtn>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.onboarding-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Inter', sans-serif;
}

.header-section {
  text-align: center;
  margin-bottom: 40px;
}

.title {
  font-size: 32px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 16px;
  color: #6b7280;
}

.tabs-wrapper {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 40px;
  border-bottom: 1px solid #e5e7eb;
}

.tab-item {
  padding: 12px 24px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-item.active {
  color: #4f46e5;
  border-bottom-color: #4f46e5;
}

.content-area {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  padding: 30px;
  min-height: 400px;
}

.done-section {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 60px 0;
}

.done-card {
  text-align: center;
}

.done-card .icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.done-card h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 10px;
}

.done-card p {
  color: #6b7280;
  margin-bottom: 24px;
}
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
