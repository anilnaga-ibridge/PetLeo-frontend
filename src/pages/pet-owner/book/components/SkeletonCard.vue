<template>
  <VCard
    flat
    variant="outlined"
    rounded="xl"
    class="skeleton-card-emotional"
  >
    <VCardText class="pa-5 d-flex flex-column h-100">
      <div class="d-flex gap-4 mb-4">
        <!-- Thumbnail Skeleton -->
        <div class="skeleton-thumb">
          <div class="shimmer" />
        </div>

        <div class="flex-grow-1 d-flex flex-column justify-center gap-2">
          <!-- Name Skeleton -->
          <div class="skeleton-line title w-80">
            <div class="shimmer" />
          </div>
          <!-- Org Skeleton -->
          <div class="skeleton-line subtitle w-60">
            <div class="shimmer" />
          </div>
        </div>
      </div>

      <div class="d-flex flex-column gap-3 mb-6 border-top pt-4">
        <div class="skeleton-line meta w-40">
          <div class="shimmer" />
        </div>
        <div class="skeleton-line meta w-90">
          <div class="shimmer" />
        </div>
      </div>

      <div class="d-flex align-center justify-space-between mt-auto">
        <div class="d-flex flex-column gap-1 w-30">
          <div class="skeleton-line title">
            <div class="shimmer" />
          </div>
        </div>
        <div class="skeleton-btn w-30">
          <div class="shimmer" />
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped>
.skeleton-card-emotional {
  border: 1px solid #f1f5f9 !important;
  background: #fff;
  height: 100%;
}

.skeleton-thumb {
  width: 110px;
  height: 84px;
  background: #f8fafc;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.skeleton-line {
  background: #f8fafc;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.skeleton-line.title { height: 20px; }
.skeleton-line.subtitle { height: 14px; }
.skeleton-line.meta { height: 12px; }

.skeleton-btn {
  height: 40px;
  background: #f8fafc;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.shimmer {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.border-top { border-top: 1px dashed #f1f5f9 !important; }

.w-90 { width: 90%; }
.w-80 { width: 80%; }
.w-60 { width: 60%; }
.w-40 { width: 40%; }
.w-30 { width: 30%; }
</style>
