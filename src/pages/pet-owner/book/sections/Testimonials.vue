<script setup>
const testimonials = [
  {
    id: 1,
    text: "Finding a reliable specialist for my Labrador used to be a challenge. PetLeo's verification process gives me absolute confidence in every booking.",
    author: "Alexandra Wright",
    role: "Pet Parent",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
    rating: 5
  },
  {
    id: 2,
    text: "The grooming session we found exceeded all expectations. The interface is seamless, and the quality of professionals is truly elite.",
    author: "Jonathan Pierce",
    role: "Pet Health Advocate",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
    rating: 5
  },
  {
    id: 3,
    text: "I appreciate the transparency in reviews and pricing. It's the first platform that actually understands the needs of modern pet owners.",
    author: "Sophia Martinez",
    role: "Pet Stylist",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    rating: 5
  }
]
</script>

<template>
  <section class="testimonials-section py-16 bg-white">
    <VContainer>
      <div class="text-center mb-12">
        <h2 class="text-h3 font-weight-black text-slate-900 mb-2 tracking-tight">Loved by Pet Owners</h2>
        <p class="text-body-1 text-slate-500">Discover why thousands of pet parents trust PetLeo for their companion's needs.</p>
      </div>

      <VRow>
        <VCol v-for="t in testimonials" :key="t.id" cols="12" md="4" class="d-flex">
          <VCard class="testimonial-card-premium pa-10 flex-grow-1" flat rounded="3xl">
            <div class="quote-icon mb-6">
              <VIcon icon="tabler-quote" size="48" color="primary" class="opacity-10" />
            </div>
            <p class="text-h6 text-slate-700 font-weight-medium line-height-relaxed mb-10 italic-soft">
              "{{ t.text }}"
            </p>
            <div class="d-flex align-center mt-auto pt-6 border-top-light">
              <VAvatar size="56" class="mr-4 ring-offset-2 ring-primary ring-2 shadow-sm">
                <VImg :src="t.avatar" cover />
              </VAvatar>
              <div>
                <div class="text-subtitle-1 font-weight-black text-slate-900 leading-tight">{{ t.author }}</div>
                <div class="text-caption text-primary font-weight-black uppercase tracking-widest mt-1">{{ t.role }}</div>
              </div>
            </div>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>
  </section>
</template>

<style scoped>
.testimonial-card-premium {
  transition: all 0.4s cubic-bezier(0.2, 0, 0, 1);
  background: #ffffff;
  border: 1px solid #f1f5f9;
}

.testimonial-card-premium:hover {
  transform: translateY(-8px);
  border-color: #6366f1 !important;
  box-shadow: 0 40px 80px rgba(99, 102, 241, 0.06) !important;
}

.quote-icon {
  height: 48px;
  display: flex;
  align-items: center;
}

.italic-soft { font-style: italic; line-height: 1.6; }
.border-top-light { border-top: 1px solid #f8fafc; }
.ring-primary { box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1); }

.text-slate-900 { color: #0f172a; }
.text-slate-700 { color: #334155; }
.text-slate-500 { color: #64748b; }
.tracking-tight { letter-spacing: -2px !important; }
</style>
