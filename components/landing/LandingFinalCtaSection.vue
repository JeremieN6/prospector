<script setup lang="ts">
const { target, isVisible } = useScrollReveal<HTMLElement>()
</script>

<template>
  <section ref="target" :class="['reveal-section mx-auto max-w-6xl px-6 pb-20', { 'is-revealed': isVisible }]">
    <div class="card flex flex-col items-start justify-between gap-4 p-8 md:flex-row md:items-center">
      <div>
        <h2 class="text-3xl font-bold">Prêt à générer des leads ?</h2>
        <p class="mt-2" style="color: var(--muted)">Renseigne ta cible, lance le script, puis filtre et exporte les résultats.</p>
      </div>
      <NuxtLink to="/auth" class="btn-primary">Générer des leads</NuxtLink>
    </div>
  </section>
</template>
