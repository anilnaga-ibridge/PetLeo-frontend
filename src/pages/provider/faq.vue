<script setup>
import ProviderLayout from '@/components/ProviderLayout.vue'
import faqIllustration from '@images/illustrations/sitting-girl-with-laptop.png'
import { useApi } from '@/composables/useApi'

const faqSearchQuery = ref('')

const { data: faqData } = await useApi('/pages/faq')

const activeTab = ref('Payment')

const activeTabFaqData = computed(() => {
  return faqData.value?.filter(faq => faq.faqTitle === activeTab.value)
})

const contactUs = [
  {
    icon: 'tabler-phone',
    title: '+ (810) 2548 2568',
    subtitle: 'We are always happy to help!',
  },
  {
    icon: 'tabler-mail',
    title: 'hello@help.com',
    subtitle: 'Best way to get answer faster!',
  },
]
</script>

<template>
  <ProviderLayout>
    <div class="faq-header rounded-lg mb-6 text-center">
      <h4 class="text-h4 mb-2">
        Hello, how can we help?
      </h4>
      <p class="text-body-1 mb-6">
        or choose a category to quickly find the help you need
      </p>

      <AppTextField
        v-model="faqSearchQuery"
        placeholder="Ask a question...."
        prepend-inner-icon="tabler-search"
        class="mx-auto"
        style="max-width: 400px;"
      />
    </div>

    <VRow>
      <VCol
        v-if="faqData"
        cols="12"
        md="3"
      >
        <VTabs
          v-model="activeTab"
          direction="vertical"
          class="v-tabs-pill"
        >
          <VTab
            v-for="faq in faqData"
            :key="faq.faqTitle"
            :value="faq.faqTitle"
          >
            <VIcon
              :icon="faq.faqIcon"
              start
            />
            {{ faq.faqTitle }}
          </VTab>
        </VTabs>
      </VCol>

      <VCol
        cols="12"
        md="9"
      >
        <VWindow
          v-model="activeTab"
          class="disable-tab-transition"
        >
          <VWindowItem
            v-for="faq in faqData"
            :key="faq.faqTitle"
            :value="faq.faqTitle"
          >
            <div class="d-flex align-center mb-6">
              <VAvatar
                rounded
                color="primary"
                variant="tonal"
                class="me-4"
                size="50"
              >
                <VIcon
                  :icon="faq.faqIcon"
                  size="30"
                />
              </VAvatar>

              <div>
                <h5 class="text-h5">
                  {{ faq.faqTitle }}
                </h5>
                <p class="text-body-1 mb-0">
                  {{ faq.faqSubtitle }}
                </p>
              </div>
            </div>

            <VExpansionPanels
              multiple
              class="faq-expansion-panels"
            >
              <VExpansionPanel
                v-for="item in faq.qandA"
                :key="item.question"
                :title="item.question"
                :text="item.answer"
              />
            </VExpansionPanels>
          </VWindowItem>
        </VWindow>
      </VCol>
    </VRow>

    <div class="text-center mt-12">
      <h5 class="text-h5 mb-2">
        You still have a question?
      </h5>
      <p class="text-body-1 mb-6">
        If you cannot find a question in our FAQ, you can always contact us. We will answer to you shortly!
      </p>

      <VRow class="justify-center">
        <VCol
          v-for="contact in contactUs"
          :key="contact.title"
          cols="12"
          md="5"
        >
          <VCard
            flat
            color="rgba(var(--v-theme-on-surface), 0.04)"
            class="pa-2"
          >
            <VCardText>
              <VAvatar
                rounded
                color="primary"
                variant="tonal"
                size="46"
                class="mb-4"
              >
                <VIcon
                  :icon="contact.icon"
                  size="26"
                />
              </VAvatar>

              <h5 class="text-h5">
                {{ contact.title }}
              </h5>
              <p class="text-body-1 mb-0">
                {{ contact.subtitle }}
              </p>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </div>
  </ProviderLayout>
</template>

<style lang="scss">
.faq-header {
  padding: 3rem 1rem;
  background-color: rgba(var(--v-theme-on-surface), 0.03);
}
</style>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
</route>
