<script setup lang="ts">
const { target, isVisible } = useScrollReveal<HTMLElement>()
</script>

<template>
  <section ref="target" :class="['reveal-section mx-auto max-w-6xl px-6 py-16', { 'is-revealed': isVisible }]">
    <h2 class="mb-8 text-3xl font-bold">FAQ</h2>
    <div class="space-y-4">
      <details class="card p-5">
        <summary class="list-none cursor-pointer font-semibold [&::-webkit-details-marker]:hidden">Comment je lance le script ?</summary>
        <p class="mt-2" style="color: var(--muted)">Tu crées la cible avec business, catégorie et localisation, puis tu ouvres la campagne et tu cliques sur <strong>Générer des leads</strong>.</p>
      </details>
      <details class="card p-5">
        <summary class="list-none cursor-pointer font-semibold [&::-webkit-details-marker]:hidden">Comment sont gérés les doublons ?</summary>
        <p class="mt-2" style="color: var(--muted)">La déduplication se fait sur domaine et email pendant le scraping, puis tu peux ajuster manuellement les statuts avant export ou push.</p>
      </details>
      <details class="card p-5">
        <summary class="list-none cursor-pointer font-semibold [&::-webkit-details-marker]:hidden">Puis-je valider les leads avant envoi vers Brevo ?</summary>
        <p class="mt-2" style="color: var(--muted)">Oui. Tu contrôles les statuts dans la campagne, puis tu envoies uniquement les leads validés vers une liste Brevo dédiée.</p>
      </details>
      <details class="card p-5">
        <summary class="list-none cursor-pointer font-semibold [&::-webkit-details-marker]:hidden">Puis-je utiliser l'outil sans clé Brevo ?</summary>
        <p class="mt-2" style="color: var(--muted)">Oui. Le scraping et l'export CSV fonctionnent sans Brevo. L'envoi vers Brevo reste simplement désactivé tant que la clé API n'est pas renseignée.</p>
      </details>
    </div>
  </section>
</template>
