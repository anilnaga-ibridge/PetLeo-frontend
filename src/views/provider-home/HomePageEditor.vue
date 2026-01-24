<template>
  <div>
    <VCard class="pa-4">
      <VCardTitle>
        {{ isEdit ? "Edit Home Page" : "Create Home Page" }}
      </VCardTitle>

      <VDivider class="my-3" />

      <!-- Basic Details -->
      <VTextField
        v-model="form.slug"
        label="Slug"
      />
      <VSelect
        v-model="form.provider_type"
        :items="providerTypes"
        label="Provider Type"
      />
      <VSwitch
        v-model="form.is_published"
        label="Published?"
      />

      <VBtn
        color="primary"
        @click="savePage"
      >
        {{ isEdit ? "Update" : "Create" }}
      </VBtn>
    </VCard>

    <div v-if="isEdit">
      <VCard class="mt-5 pa-4">
        <VCardTitle>Sections</VCardTitle>

        <VExpansionPanels>
          <VExpansionPanel title="Hero Banners">
            <HeroBannerEditor :home-id="id" />
          </VExpansionPanel>

          <VExpansionPanel title="Banner Slider">
            <BannerSliderEditor :home-id="id" />
          </VExpansionPanel>

          <VExpansionPanel title="Image Gallery">
            <ImageGalleryEditor :home-id="id" />
          </VExpansionPanel>

          <VExpansionPanel title="Features">
            <FeatureCardsEditor :home-id="id" />
          </VExpansionPanel>

          <VExpansionPanel title="Testimonials">
            <TestimonialsEditor :home-id="id" />
          </VExpansionPanel>

          <VExpansionPanel title="Videos">
            <VideosEditor :home-id="id" />
          </VExpansionPanel>

          <VExpansionPanel title="Services">
            <ServicesEditor :home-id="id" />
          </VExpansionPanel>

          <VExpansionPanel title="FAQ">
            <FAQEditor :home-id="id" />
          </VExpansionPanel>
        </VExpansionPanels>
      </VCard>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import api from "./api"

// child editors
import HeroBannerEditor from "./sections/HeroBannerEditor.vue"
import BannerSliderEditor from "./sections/BannerSliderEditor.vue"
import ImageGalleryEditor from "./sections/ImageGalleryEditor.vue"
import FeatureCardsEditor from "./sections/FeatureCardsEditor.vue"
import TestimonialsEditor from "./sections/TestimonialsEditor.vue"
import VideosEditor from "./sections/VideosEditor.vue"
import ServicesEditor from "./sections/ServicesEditor.vue"
import FAQEditor from "./sections/FAQEditor.vue"

const route = useRoute()
const router = useRouter()
const id = route.params.id

const form = ref({
  slug: "",
  provider_type: "",
  is_published: false,
})

const providerTypes = ["individual", "organization", "both"]
const isEdit = !!id

onMounted(() => {
  if (isEdit) {
    api.getPage(id).then(res => {
      form.value = res.data
    })
  }
})

function savePage() {
  if (isEdit) {
    api.updatePage(id, form.value).then(() => {
      alert("Page updated")
    })
  } else {
    api.createPage(form.value).then(res => {
      router.push(`/superadmin/provider-home/${res.data.id}`)
    })
  }
}
</script>
