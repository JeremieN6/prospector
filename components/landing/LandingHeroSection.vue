<script setup lang="ts">
const { target, isVisible } = useScrollReveal<HTMLElement>()

const animatedLeads = ref(0)
const animatedValid = ref(0)
const animatedExportable = ref(0)
const animatedProgress = ref(0)

function tweenNumber(targetRef: Ref<number>, endValue: number, duration = 1200) {
  if (!import.meta.client) {
    targetRef.value = endValue
    return
  }

  const startTime = window.performance.now()

  const frame = (now: number) => {
    const rawProgress = Math.min((now - startTime) / duration, 1)
    const eased = 1 - (1 - rawProgress) ** 3
    targetRef.value = Math.round(endValue * eased)

    if (rawProgress < 1) {
      window.requestAnimationFrame(frame)
    }
  }

  window.requestAnimationFrame(frame)
}

onMounted(() => {
  tweenNumber(animatedLeads, 128, 1100)
  tweenNumber(animatedValid, 93, 1300)
  tweenNumber(animatedExportable, 89, 1500)
  tweenNumber(animatedProgress, 74, 1400)
})
</script>

<template>
  <section ref="target" :class="['reveal-section mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 md:grid-cols-2', { 'is-revealed': isVisible }]">
    <div class="space-y-7">
      <p class="inline-flex rounded-full px-3 py-1 text-sm font-semibold" style="background: var(--accent-soft); color: var(--accent)">
        Prospection B2B locale pilotée par script
      </p>
      <h1 class="text-5xl font-bold leading-tight md:text-6xl">
        Génère des leads qualifiés,
        <span style="color: var(--accent)">plus vite</span>,
        sans perdre le contrôle.
      </h1>
      <p class="max-w-xl text-lg" style="color: var(--muted)">
        Prospector automatise la recherche Google Places (New), lance le script de scraping, vérifie les emails et prépare les vagues Brevo par business.
        Tu gardes la main sur la validation avant export et envoi.
      </p>
      <div class="flex flex-wrap gap-3">
        <NuxtLink to="/auth" class="btn-primary">Générer des leads</NuxtLink>
        <a href="#comment-ca-marche" class="btn-secondary">Voir le flux</a>
      </div>
    </div>
    <div class="card relative overflow-hidden p-6">
      <div class="absolute -right-12 -top-10 h-40 w-40 rounded-full" style="background: rgba(18, 102, 79, 0.18)" />
      <div class="absolute -bottom-16 left-0 h-36 w-36 rounded-full" style="background: rgba(219, 182, 91, 0.25)" />
      <div class="relative space-y-4">
        <h2 class="text-2xl font-semibold">Aperçu du script</h2>
        <div class="space-y-3">
          <div class="rounded-xl border p-4" style="border-color: var(--border)">
            <p class="text-sm" style="color: var(--muted)">Ciblage</p>
            <p class="text-xl font-semibold">BUSINESS - CATEGORIE - LOCALISATION CIBLE</p>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div class="rounded-xl border p-3" style="border-color: var(--border)">
              <p class="text-sm" style="color: var(--muted)">Leads</p>
              <p class="text-xl font-bold tabular-nums">{{ animatedLeads }}</p>
            </div>
            <div class="rounded-xl border p-3" style="border-color: var(--border)">
              <p class="text-sm" style="color: var(--muted)">Valides</p>
              <p class="text-xl font-bold tabular-nums">{{ animatedValid }}</p>
            </div>
            <div class="rounded-xl border p-3" style="border-color: var(--border)">
              <p class="text-sm" style="color: var(--muted)">Exportables</p>
              <p class="text-xl font-bold tabular-nums">{{ animatedExportable }}</p>
            </div>
          </div>
          <div class="h-3 w-full overflow-hidden rounded-full" style="background: #e8e9e2">
            <div class="h-full rounded-full transition-[width] duration-700 ease-out" :style="`width: ${animatedProgress}%; background: var(--accent)`" />
          </div>
          <p class="text-sm font-medium uppercase tracking-[0.24em]" style="color: var(--muted)">Script en cours de génération</p>
        </div>
      </div>
    </div>
  </section>
</template>
