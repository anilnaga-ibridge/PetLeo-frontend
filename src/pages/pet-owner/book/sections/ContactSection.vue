<script setup>
import { ref } from 'vue'

const form = ref({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
})

const submitting = ref(false)
const submitted = ref(false)
const error = ref('')

const handleSubmit = async () => {
  submitting.value = true
  error.value = ''
  try {
    // In production, wire this to your contact API
    await new Promise(res => setTimeout(res, 1200))
    submitted.value = true
    form.value = { name: '', email: '', phone: '', subject: '', message: '' }
  } catch (e) {
    error.value = 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section
    id="contact-section"
    class="contact-section"
  >
    <!-- Background shape -->
    <div class="contact-bg-shape" />

    <div class="contact-inner">
      <!-- Left: Contact Info -->
      <div class="contact-info-col">
        <div class="section-eyebrow">
          Contact Us
        </div>
        <h2 class="contact-title">
          Let's Talk<br>Pet Care
        </h2>
        <p class="contact-sub">
          Have questions, feedback, or need help? Our team is available 7 days a week to help you and your pet.
        </p>

        <!-- Contact Details -->
        <div class="contact-details">
          <div class="contact-detail-item">
            <div class="detail-icon-box email">
              <VIcon
                icon="tabler-mail"
                size="20"
                color="white"
              />
            </div>
            <div>
              <div class="detail-label">
                Email Us
              </div>
              <a
                href="mailto:support@petleo.in"
                class="detail-value"
              >support@petleo.in</a>
            </div>
          </div>

          <div class="contact-detail-item">
            <div class="detail-icon-box phone">
              <VIcon
                icon="tabler-phone"
                size="20"
                color="white"
              />
            </div>
            <div>
              <div class="detail-label">
                Call Us
              </div>
              <a
                href="tel:+918000000000"
                class="detail-value"
              >+91 80000 00000</a>
            </div>
          </div>

          <div class="contact-detail-item">
            <div class="detail-icon-box location">
              <VIcon
                icon="tabler-map-pin"
                size="20"
                color="white"
              />
            </div>
            <div>
              <div class="detail-label">
                Head Office
              </div>
              <div class="detail-value">
                PetLeo Technologies Inc.<br>Bangalore, Karnataka 560001
              </div>
            </div>
          </div>

          <div class="contact-detail-item">
            <div class="detail-icon-box hours">
              <VIcon
                icon="tabler-clock"
                size="20"
                color="white"
              />
            </div>
            <div>
              <div class="detail-label">
                Support Hours
              </div>
              <div class="detail-value">
                Mon – Sun, 8 AM – 10 PM
              </div>
            </div>
          </div>
        </div>

        <!-- Social -->
        <div class="social-row">
          <a
            href="#"
            class="social-btn"
            title="Instagram"
          >
            <VIcon
              icon="tabler-brand-instagram"
              size="20"
            />
          </a>
          <a
            href="#"
            class="social-btn"
            title="Facebook"
          >
            <VIcon
              icon="tabler-brand-facebook"
              size="20"
            />
          </a>
          <a
            href="#"
            class="social-btn"
            title="LinkedIn"
          >
            <VIcon
              icon="tabler-brand-linkedin"
              size="20"
            />
          </a>
          <a
            href="#"
            class="social-btn"
            title="Twitter"
          >
            <VIcon
              icon="tabler-brand-x"
              size="20"
            />
          </a>
        </div>
      </div>

      <!-- Right: Contact Form -->
      <div class="contact-form-col">
        <!-- Success state -->
        <div
          v-if="submitted"
          class="form-success"
        >
          <div class="success-icon">
            <VIcon
              icon="tabler-circle-check-filled"
              size="48"
              color="white"
            />
          </div>
          <h3 class="success-title">
            Message Sent! 🐾
          </h3>
          <p class="success-sub">
            Our team will get back to you within 24 hours.
          </p>
          <button
            class="reset-btn"
            @click="submitted = false"
          >
            Send Another
          </button>
        </div>

        <!-- Form -->
        <form
          v-else
          class="contact-form"
          @submit.prevent="handleSubmit"
        >
          <h3 class="form-title">
            Send us a Message
          </h3>
          <p class="form-sub">
            We'd love to hear from you. Fill out this form and we'll reply soon.
          </p>

          <div class="form-grid">
            <div class="field-group">
              <label class="field-label">Your Name *</label>
              <input
                v-model="form.name"
                class="field-input"
                placeholder="John Doe"
                required
              >
            </div>
            <div class="field-group">
              <label class="field-label">Email Address *</label>
              <input
                v-model="form.email"
                type="email"
                class="field-input"
                placeholder="john@example.com"
                required
              >
            </div>
          </div>

          <div class="form-grid">
            <div class="field-group">
              <label class="field-label">Phone Number</label>
              <input
                v-model="form.phone"
                type="tel"
                class="field-input"
                placeholder="+91 98765 43210"
              >
            </div>
            <div class="field-group">
              <label class="field-label">Subject *</label>
              <input
                v-model="form.subject"
                class="field-input"
                placeholder="e.g. Booking issue"
                required
              >
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Your Message *</label>
            <textarea
              v-model="form.message"
              class="field-input field-textarea"
              placeholder="Tell us how we can help you and your pet…"
              rows="5"
              required
            />
          </div>

          <div
            v-if="error"
            class="error-msg"
          >
            {{ error }}
          </div>

          <button
            type="submit"
            class="submit-btn"
            :disabled="submitting"
          >
            <VIcon
              v-if="!submitting"
              icon="tabler-send"
              size="18"
              class="mr-2"
            />
            <VProgressCircular
              v-else
              indeterminate
              size="18"
              width="2"
              color="white"
              class="mr-2"
            />
            {{ submitting ? 'Sending…' : 'Send Message' }}
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.contact-section {
  background: #f8fafc;
  padding: 100px 0;
  position: relative;
  overflow: hidden;
}

.contact-bg-shape {
  position: absolute;
  top: -200px;
  right: -200px;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 60%);
  border-radius: 50%;
  pointer-events: none;
}

.contact-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 80px;
  align-items: start;
}

/* Eyebrow */
.section-eyebrow {
  display: inline-block;
  background: #eef2ff;
  color: #6366f1;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  padding: 6px 16px;
  border-radius: 100px;
  margin-bottom: 20px;
}

/* Info Column */
.contact-title {
  font-size: 48px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -2.5px;
  line-height: 1.1;
  margin: 0 0 16px;
}

.contact-sub {
  font-size: 16px;
  font-weight: 500;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 40px;
}

/* Contact Details */
.contact-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 36px;
}

.contact-detail-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.detail-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.detail-icon-box.email { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
.detail-icon-box.phone { background: linear-gradient(135deg, #10b981, #059669); }
.detail-icon-box.location { background: linear-gradient(135deg, #f59e0b, #f97316); }
.detail-icon-box.hours { background: linear-gradient(135deg, #06b6d4, #3b82f6); }

.detail-label {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #94a3b8;
  margin-bottom: 3px;
}

.detail-value {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  text-decoration: none;
  line-height: 1.5;
  transition: color 0.2s;
}

a.detail-value:hover { color: #6366f1; }

/* Social */
.social-row {
  display: flex;
  gap: 10px;
}

.social-btn {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: white;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.2s ease;
  text-decoration: none;
}

.social-btn:hover {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
  transform: translateY(-2px);
}

/* Form Column */
.contact-form-col {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 28px;
  padding: 44px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.04);
}

.form-title {
  font-size: 26px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.8px;
  margin: 0 0 6px;
}

.form-sub {
  font-size: 14px;
  font-weight: 500;
  color: #94a3b8;
  margin: 0 0 28px;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: 'Outfit', sans-serif;
  box-sizing: border-box;
}

.field-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  background: white;
}

.field-input::placeholder { color: #94a3b8; }

.field-textarea {
  height: auto;
  padding: 14px 16px;
  resize: vertical;
  min-height: 120px;
}

.error-msg {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #ef4444;
}

.submit-btn {
  height: 52px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  box-shadow: 0 6px 20px rgba(99,102,241,0.3);
  font-family: 'Outfit', sans-serif;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.06);
  box-shadow: 0 12px 28px rgba(99,102,241,0.35);
}

.submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

/* Success */
.form-success {
  text-align: center;
  padding: 40px 0;
}

.success-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.success-title {
  font-size: 26px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -0.8px;
  margin: 0 0 8px;
}

.success-sub {
  font-size: 15px;
  color: #64748b;
  margin: 0 0 24px;
}

.reset-btn {
  padding: 12px 28px;
  background: #eef2ff;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 800;
  color: #6366f1;
  cursor: pointer;
  transition: background 0.2s;
  font-family: 'Outfit', sans-serif;
}

.reset-btn:hover { background: #e0e7ff; }

@media (max-width: 960px) {
  .contact-inner { grid-template-columns: 1fr; gap: 48px; padding: 0 20px; }
  .contact-title { font-size: 36px; }
  .form-grid { grid-template-columns: 1fr; }
  .contact-form-col { padding: 28px; }
}
</style>
