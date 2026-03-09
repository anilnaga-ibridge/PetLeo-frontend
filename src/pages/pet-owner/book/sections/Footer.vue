<template>
  <footer class="footer-section pt-24 pb-12 bg-white border-t">
    <VContainer>
      <VRow class="mb-16">
        <VCol
          cols="12"
          md="4"
          class="mb-8 mb-md-0"
        >
          <div class="d-flex align-center gap-2 mb-6 cursor-pointer">
            <VIcon
              icon="tabler-paw-filled"
              color="primary"
              size="32"
            />
            <span class="text-h4 font-weight-black text-slate-900 tracking-tighter">PetLeo</span>
          </div>
          <p class="text-body-1 text-slate-500 max-w-sm mb-8">
            The world's first unified marketplace for pet healthcare, grooming, and specialized care services. Trusted by elite partners and thousands of pet parents.
          </p>
          <div class="d-flex gap-4">
            <VBtn
              icon="tabler-brand-facebook"
              variant="tonal"
              color="slate-400"
              rounded="lg"
            />
            <VBtn
              icon="tabler-brand-instagram"
              variant="tonal"
              color="slate-400"
              rounded="lg"
            />
            <VBtn
              icon="tabler-brand-linkedin"
              variant="tonal"
              color="slate-400"
              rounded="lg"
            />
          </div>
        </VCol>

        <VCol
          cols="6"
          sm="4"
          md="2"
        >
          <h4 class="text-h6 font-weight-bold text-slate-900 mb-6">
            Company
          </h4>
          <ul class="footer-links">
            <li>
              <RouterLink to="/">
                About Us
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/">
                Elite Partners
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/">
                Careers
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/">
                Contact
              </RouterLink>
            </li>
          </ul>
        </VCol>

        <VCol
          cols="6"
          sm="4"
          md="2"
        >
          <h4 class="text-h6 font-weight-bold text-slate-900 mb-6">
            Services
          </h4>
          <ul class="footer-links">
            <li>
              <RouterLink to="/">
                Veterinary
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/">
                Grooming
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/">
                Boarding
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/">
                Training
              </RouterLink>
            </li>
          </ul>
        </VCol>

        <VCol
          cols="12"
          sm="4"
          md="4"
        >
          <h4 class="text-h6 font-weight-bold text-slate-900 mb-6">
            Newsletter
          </h4>
          <p class="text-body-2 text-slate-500 mb-4">
            Join 20,000+ pet parents for care tips and exclusive offers.
          </p>
          <div class="d-flex gap-2">
            <VTextField
              placeholder="Email address"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              class="footer-input"
            />
            <VBtn
              color="primary"
              rounded="lg"
              height="48"
            >
              Join
            </VBtn>
          </div>
        </VCol>
      </VRow>

      <VDivider class="mb-8" />

      <div class="d-flex flex-wrap justify-space-between align-center gap-4 text-body-2 text-slate-400">
        <div>© 2026 PetLeo Technologies Inc. All rights reserved.</div>
        <div class="d-flex gap-6">
          <RouterLink
            to="/"
            class="legal-link"
          >
            Privacy Policy
          </RouterLink>
          <RouterLink
            to="/"
            class="legal-link"
          >
            Terms of Service
          </RouterLink>
          <RouterLink
            to="/"
            class="legal-link"
          >
            Cookie Settings
          </RouterLink>
        </div>
      </div>
    </VContainer>
  </footer>
</template>

<style scoped>
.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 12px;
}

.footer-links a {
  text-decoration: none;
  color: #64748b;
  font-size: 15px;
  font-weight: 500;
  transition: color 0.2s ease;
}

.footer-links a:hover {
  color: #6366f1;
}

.footer-input :deep(.v-field) {
  background: #f8fafc;
}

.legal-link {
  text-decoration: none;
  color: inherit;
}

.legal-link:hover {
  color: #6366f1;
}

.text-slate-900 { color: #0f172a; }
.text-slate-500 { color: #64748b; }
.text-slate-400 { color: #94a3b8; }
.tracking-tighter { letter-spacing: -1px !important; }
.max-w-sm { max-width: 24rem; }
</style>
