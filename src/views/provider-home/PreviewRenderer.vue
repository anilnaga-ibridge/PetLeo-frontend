<template>
  <div class="preview-root">
    <div class="site-wrapper">
      <!-- HERO -->
      <header
        class="hero"
        :style="heroStyle"
      >
        <div class="hero-inner">
          <div class="hero-text">
            <h1 v-if="page.title">
              {{ page.title }}
            </h1>
            <p
              v-if="page.subtitle"
              class="subtitle"
            >
              {{ page.subtitle }}
            </p>
            <p
              v-if="page.hero_description"
              class="lead"
            >
              {{ page.hero_description }}
            </p>

            <div
              v-if="page.hero_cta_text || page.hero_cta_url"
              class="hero-cta"
            >
              <a
                :href="page.hero_cta_url || '#'"
                class="btn-primary"
              >
                {{ page.hero_cta_text || 'Get Started' }}
              </a>
            </div>
          </div>

          <div class="hero-media">
            <img
              :src="heroImage"
              alt="Hero image"
              loading="lazy"
            >
          </div>
        </div>
      </header>

      <!-- BANNER SLIDER -->
      <section
        v-if="page.banner_slides && page.banner_slides.length"
        class="banner-slider"
      >
        <div class="slides">
          <div
            v-for="slide in page.banner_slides"
            :key="slide.id"
            class="slide"
          >
            <img
              :src="slide.image"
              :alt="slide.title || 'slide'"
            >
            <div class="slide-caption">
              <h3 v-if="slide.title">
                {{ slide.title }}
              </h3>
              <p v-if="slide.subtitle">
                {{ slide.subtitle }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- FEATURES -->
      <section
        v-if="page.features && page.features.length"
        class="features-section"
      >
        <div class="container">
          <h2 class="section-title">
            Features
          </h2>
          <div class="features-grid">
            <div
              v-for="f in page.features"
              :key="f.title"
              class="feature-card"
            >
              <div
                v-if="f.icon"
                class="feature-icon"
              >
                <i :class="f.icon" />
              </div>
              <h4>{{ f.title }}</h4>
              <p>{{ f.description }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- IMAGE GALLERY -->
      <section
        v-if="page.images && page.images.length"
        class="gallery-section"
      >
        <div class="container">
          <h2 class="section-title">
            Gallery
          </h2>
          <div class="gallery-grid">
            <div
              v-for="img in page.images"
              :key="img.id"
              class="gallery-item"
            >
              <img
                :src="img.image"
                :alt="img.caption || 'gallery'"
                loading="lazy"
              >
              <p
                v-if="img.caption"
                class="caption"
              >
                {{ img.caption }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- TESTIMONIALS -->
      <section
        v-if="page.testimonials && page.testimonials.length"
        class="testimonials-section"
      >
        <div class="container">
          <h2 class="section-title">
            What Customers Say
          </h2>
          <div class="testimonials-grid">
            <div
              v-for="t in page.testimonials"
              :key="t.id"
              class="testimonial-card"
            >
              <div
                v-if="t.image"
                class="avatar"
              >
                <img
                  :src="t.image"
                  :alt="t.name"
                  loading="lazy"
                >
              </div>
              <div class="testimonial-body">
                <p class="review">
                  “{{ t.review }}”
                </p>
                <p class="author">
                  — {{ t.name }} <span v-if="t.role">, {{ t.role }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- VIDEOS -->
      <section
        v-if="page.videos && page.videos.length"
        class="videos-section"
      >
        <div class="container">
          <h2 class="section-title">
            How it Works
          </h2>
          <div class="videos-grid">
            <div
              v-for="v in page.videos"
              :key="v.id"
              class="video-item"
            >
              <video
                :src="v.url"
                controls
                :poster="v.thumbnail"
                preload="metadata"
              />
              <h4>{{ v.title }}</h4>
            </div>
          </div>
        </div>
      </section>

      <!-- SERVICES -->
      <section
        v-if="page.services && page.services.length"
        class="services-section"
      >
        <div class="container">
          <h2 class="section-title">
            Services
          </h2>
          <div class="services-grid">
            <div
              v-for="s in page.services"
              :key="s.id"
              class="service-card"
            >
              <div
                v-if="s.icon"
                class="service-icon"
              >
                <i :class="s.icon" />
              </div>
              <h4>{{ s.title }}</h4>
              <p>{{ s.description }}</p>
              <a
                v-if="s.link"
                :href="s.link"
                class="link-more"
              >Learn more</a>
            </div>
          </div>
        </div>
      </section>

      <!-- PLANS (from backend) -->
      <section
        v-if="page.plans && page.plans.length"
        class="plans-section"
      >
        <div class="container">
          <h2 class="section-title">
            Plans
          </h2>
          <div class="plans-grid">
            <div
              v-for="p in page.plans"
              :key="p.id"
              class="plan-card"
            >
              <h3>{{ p.title }}</h3>
              <p v-if="p.subtitle">
                {{ p.subtitle }}
              </p>

              <div
                v-if="p.prices && p.prices.length"
                class="plan-prices"
              >
                <div
                  v-for="price in p.prices"
                  :key="price.id"
                  class="price-row"
                >
                  <strong>{{ price.amount }} {{ price.currency }}</strong>
                  <span class="cycle"> / {{ price.billing_cycle.name }}</span>
                </div>
              </div>

              <ul
                v-if="p.features && p.features.length"
                class="plan-features"
              >
                <li
                  v-for="f in p.features"
                  :key="f"
                >
                  {{ f }}
                </li>
              </ul>

              <div class="plan-cta">
                <a
                  class="btn-secondary"
                  :href="`/purchase?plan=${p.id}`"
                >Purchase</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section
        v-if="page.faqs && page.faqs.length"
        class="faq-section"
      >
        <div class="container">
          <h2 class="section-title">
            FAQ
          </h2>
          <div class="faq-list">
            <div
              v-for="q in page.faqs"
              :key="q.id"
              class="faq-item"
            >
              <h4 class="question">
                {{ q.question }}
              </h4>
              <div
                class="answer"
                v-html="q.answer"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="site-footer">
        <div class="container">
          <p>© {{ new Date().getFullYear() }} Your Company. All rights reserved.</p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { api as axios } from "@/plugins/axios"
import { useRoute } from "vue-router"

const route = useRoute()
const id = route.params.id

const page = ref({
  // default skeleton so Vue doesn't break if fields missing
  title: "",
  subtitle: "",
  hero_description: "",
  hero_banners: [],
  banner_slides: [],
  images: [],
  features: [],
  testimonials: [],
  videos: [],
  services: [],
  faqs: [],
  plans: [],
})

// fallback dev hero image (your uploaded file)
const DEV_HERO_FALLBACK = "file:///mnt/data/b63f2f68-24f7-4af1-91d0-416a20095817.png"

const heroImage = ref(DEV_HERO_FALLBACK)

function setHeroImage() {
  const hb = (page.value.hero_banners && page.value.hero_banners[0]) || null
  if (hb && hb.image) heroImage.value = hb.image
  else if (page.value.hero_image) heroImage.value = page.value.hero_image
  else heroImage.value = DEV_HERO_FALLBACK
}

const heroStyle = ref({})

onMounted(async () => {
  try {
    // fetch full page JSON (ModelViewSet detail)
    const res = await axios.get(`/api/superadmin/provider-home/pages/${id}/`)

    Object.assign(page.value, res.data || {})

    // If plans are not included, fetch plans separately (public provider_home API returns page+plans)
    if (!page.value.plans || !page.value.plans.length) {
      // try public provider_home endpoint by provider_type if available
      if (page.value.provider_type) {
        const pr = await axios.get(`/api/superadmin/provider-home/home/?provider_type=${page.value.provider_type}`)
        if (pr && pr.data && pr.data.plans) {
          page.value.plans = pr.data.plans
        }
      }
    }

    setHeroImage()

    // build hero background style
    heroStyle.value = {
      backgroundImage: `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.25)), url('${heroImage.value}')`,
      backgroundSize: "cover",
      backgroundPosition: "center center",
    }
  } catch (e) {
    console.error("Failed to load preview page", e)
  }
})
</script>

<style scoped>
.preview-root { font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; color:#1f2937; }

/* basic container */
.container { max-width: 1200px; margin: 0 auto; padding: 36px 16px; }

/* HERO */
.hero { padding: 60px 0; color: #fff; }
.hero-inner { display:flex; gap: 30px; align-items: center; justify-content: space-between; }
.hero-text { max-width: 560px; }
.hero h1 { font-size: 42px; margin: 0 0 12px; line-height: 1.05; }
.subtitle { opacity: 0.9; margin-bottom: 8px; }
.lead { margin-bottom: 16px; color: rgba(255,255,255,0.92); }

/* CTA */
.btn-primary { display:inline-block; background:#FF6A3D; color:#fff; padding:12px 18px; border-radius:6px; text-decoration:none; }

/* hero media */
.hero-media img { max-width: 420px; width:100%; border-radius:8px; box-shadow: 0 8px 30px rgba(15,23,42,0.12); }

/* slider */
.banner-slider .slides { display:flex; gap:14px; overflow-x:auto; padding:12px 16px; }
.banner-slider .slide { min-width: 300px; border-radius:8px; overflow:hidden; background:#fff; box-shadow: 0 6px 18px rgba(15,23,42,0.06); }
.banner-slider .slide img { width:100%; height:180px; object-fit:cover; }
.slide-caption { padding:12px; }

/* features grid */
.features-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; }
.feature-card { padding:18px; background:#fff; border-radius:10px; box-shadow: 0 6px 18px rgba(15,23,42,0.04); text-align:left; }
.feature-icon { font-size:28px; margin-bottom:8px; }

/* gallery */
.gallery-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap:12px; }
.gallery-item img { width:100%; height:160px; object-fit:cover; border-radius:8px; }

/* testimonials */
.testimonials-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; }
.testimonial-card { background:#fff; padding:14px; border-radius:10px; box-shadow: 0 6px 18px rgba(15,23,42,0.04); display:flex; gap:12px; align-items:flex-start; }
.testimonial-card .avatar img { width:64px; height:64px; object-fit:cover; border-radius:50%; }

/* videos */
.videos-grid { display:grid; grid-template-columns: repeat(3,1fr); gap:14px; }
.video-item video { width:100%; border-radius:8px; }

/* services */
.services-grid { display:grid; grid-template-columns: repeat(3,1fr); gap:14px; }
.service-card { background:#fff; padding:18px; border-radius:10px; text-align:left; }

/* plans */
.plans-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; }
.plan-card { background:#fff; padding:18px; border-radius:8px; box-shadow: 0 8px 30px rgba(15,23,42,0.06); text-align:left; }
.plan-prices .price-row { display:flex; justify-content:space-between; margin-top:8px; }

/* faq */
.faq-list .faq-item { background:#fff; padding:14px; border-radius:8px; margin-bottom:10px; }

/* footer */
.site-footer { background:#0f172a; color:#fff; padding:18px 0; text-align:center; margin-top:36px; }

@media (max-width: 980px) {
  .features-grid { grid-template-columns: repeat(2, 1fr); }
  .gallery-grid { grid-template-columns: repeat(2, 1fr); }
  .testimonials-grid { grid-template-columns: 1fr; }
  .hero-inner { flex-direction: column-reverse; text-align:center; }
}
</style>
