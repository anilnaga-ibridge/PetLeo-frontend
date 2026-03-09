<script setup>
const images = [
  'https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544568100-847a948585b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517849845537-4d257902454a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
]
</script>

<template>
  <section class="gallery-section py-24 bg-white">
    <VContainer>
      <div class="text-center mb-16">
        <h2 class="text-h3 font-weight-black text-slate-900 mb-2 tracking-tight">
          Our Work Showcase
        </h2>
        <p class="text-body-1 text-slate-500">
          Glimpses of premium care sessions from our top-rated partners.
        </p>
      </div>

      <VRow>
        <VCol
          v-for="(img, i) in images"
          :key="i"
          cols="12"
          sm="6"
          md="4"
        >
          <div class="gallery-item-wrapper rounded-xl overflow-hidden shadow-sm">
            <VImg
              :src="img"
              height="300"
              cover
              class="gallery-img"
            >
              <div class="gallery-overlay">
                <VBtn
                  icon="tabler-eye"
                  variant="flat"
                  color="white"
                  rounded="circle"
                />
              </div>
            </VImg>
          </div>
        </VCol>
      </VRow>
    </VContainer>
  </section>
</template>

<style scoped>
.gallery-item-wrapper {
  position: relative;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  transform-style: preserve-3d;
}

.gallery-item-wrapper:hover {
  transform: perspective(1000px) translateZ(20px) rotateX(2deg);
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

.gallery-img {
  transition: transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.gallery-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.gallery-item-wrapper:hover .gallery-overlay {
  opacity: 1;
}

.text-slate-900 { color: #0f172a; }
.text-slate-500 { color: #64748b; }
.tracking-tight { letter-spacing: -1.5px !important; }
</style>
