
<script setup>
import { ref } from 'vue'
import AboutManagement from './AboutManagement.vue'
import ServicesManagement from './ServicesManagement.vue'
import BannerUpload from './BannerUpload.vue'
import CertificationsManagement from './CertificationsManagement.vue'
import GalleryManagement from './GalleryManagement.vue'
import PolicyManagement from './PolicyManagement.vue'

const subTab = ref(null)

const subTabs = [
  { title: 'Banner', icon: 'tabler-photo', component: BannerUpload },
  { title: 'About', icon: 'tabler-info-circle', component: AboutManagement },
  { title: 'Services', icon: 'tabler-list-check', component: ServicesManagement },
  { title: 'Gallery', icon: 'tabler-camera', component: GalleryManagement },
  { title: 'Certifications', icon: 'tabler-certificate', component: CertificationsManagement },
  { title: 'Policies', icon: 'tabler-script', component: PolicyManagement },
]
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VTabs
        v-model="subTab"
        show-arrows
        class="mb-6"
      >
        <VTab
          v-for="tab in subTabs"
          :key="tab.title"
          :value="tab.title"
        >
          <VIcon
            :icon="tab.icon"
            size="18"
            class="me-2"
          />
          {{ tab.title }}
        </VTab>
      </VTabs>

      <VWindow v-model="subTab">
        <VWindowItem
          v-for="tab in subTabs"
          :key="tab.title"
          :value="tab.title"
        >
          <component :is="tab.component" />
        </VWindowItem>
      </VWindow>
    </VCol>
  </VRow>
</template>
