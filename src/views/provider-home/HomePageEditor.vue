<template>
  <div>
    <v-card class="pa-4">
      <v-card-title>
        {{ isEdit ? "Edit Home Page" : "Create Home Page" }}
      </v-card-title>

      <v-divider class="my-3" />

      <!-- Basic Details -->
      <v-text-field v-model="form.slug" label="Slug" />
      <v-select
        v-model="form.provider_type"
        :items="providerTypes"
        label="Provider Type"
      />
      <v-switch v-model="form.is_published" label="Published?" />

      <v-btn color="primary" @click="savePage">
        {{ isEdit ? "Update" : "Create" }}
      </v-btn>
    </v-card>

    <div v-if="isEdit">
      <v-card class="mt-5 pa-4">
        <v-card-title>Sections</v-card-title>

        <v-expansion-panels>
          <v-expansion-panel title="Hero Banners">
            <HeroBannerEditor :home-id="id" />
          </v-expansion-panel>

          <v-expansion-panel title="Banner Slider">
            <BannerSliderEditor :home-id="id" />
          </v-expansion-panel>

          <v-expansion-panel title="Image Gallery">
            <ImageGalleryEditor :home-id="id" />
          </v-expansion-panel>

          <v-expansion-panel title="Features">
            <FeatureCardsEditor :home-id="id" />
          </v-expansion-panel>

          <v-expansion-panel title="Testimonials">
            <TestimonialsEditor :home-id="id" />
          </v-expansion-panel>

          <v-expansion-panel title="Videos">
            <VideosEditor :home-id="id" />
          </v-expansion-panel>

          <v-expansion-panel title="Services">
            <ServicesEditor :home-id="id" />
          </v-expansion-panel>

          <v-expansion-panel title="FAQ">
            <FAQEditor :home-id="id" />
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "./api";

// child editors
import HeroBannerEditor from "./sections/HeroBannerEditor.vue";
import BannerSliderEditor from "./sections/BannerSliderEditor.vue";
import ImageGalleryEditor from "./sections/ImageGalleryEditor.vue";
import FeatureCardsEditor from "./sections/FeatureCardsEditor.vue";
import TestimonialsEditor from "./sections/TestimonialsEditor.vue";
import VideosEditor from "./sections/VideosEditor.vue";
import ServicesEditor from "./sections/ServicesEditor.vue";
import FAQEditor from "./sections/FAQEditor.vue";

const route = useRoute();
const router = useRouter();
const id = route.params.id;

const form = ref({
  slug: "",
  provider_type: "",
  is_published: false
});

const providerTypes = ["individual", "organization", "both"];
const isEdit = !!id;

onMounted(() => {
  if (isEdit) {
    api.getPage(id).then(res => {
      form.value = res.data;
    });
  }
});

function savePage() {
  if (isEdit) {
    api.updatePage(id, form.value).then(() => {
      alert("Page updated");
    });
  } else {
    api.createPage(form.value).then(res => {
      router.push(`/superadmin/provider-home/${res.data.id}`);
    });
  }
}
</script>
