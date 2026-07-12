<script setup lang="ts">
const { target, isVisible } = useScrollReveal<HTMLElement>()
</script>

<template>
  <section ref="target" id="comment-ca-marche" :class="['reveal-section mx-auto max-w-6xl px-6 py-16', { 'is-revealed': isVisible }]">
    <h2 class="mb-8 text-3xl font-bold">Comment ça marche</h2>
    <div class="grid gap-4 md:grid-cols-4">
      <article class="card p-6">
        <p class="text-sm font-semibold" style="color: var(--accent)">01</p>
        <h3 class="mt-2 text-xl font-semibold">Configure tes clés</h3>
        <p class="mt-2" style="color: var(--muted)">Ajoute Google Places (New) et Brevo depuis l’onboarding avec les bons guides.</p>
      </article>
      <article class="card p-6">
        <p class="text-sm font-semibold" style="color: var(--accent)">02</p>
        <h3 class="mt-2 text-xl font-semibold">Prépare la cible</h3>
        <p class="mt-2" style="color: var(--muted)">Business, catégorie Google Places et localisation cible alimentent le script.</p>
      </article>
      <article class="card p-6">
        <p class="text-sm font-semibold" style="color: var(--accent)">03</p>
        <h3 class="mt-2 text-xl font-semibold">Lance le script</h3>
        <p class="mt-2" style="color: var(--muted)">Le scraping part, récupère les leads, et remplit la table automatiquement.</p>
      </article>
      <article class="card p-6">
        <p class="text-sm font-semibold" style="color: var(--accent)">04</p>
        <h3 class="mt-2 text-xl font-semibold">Valide et exporte</h3>
        <p class="mt-2" style="color: var(--muted)">Tu filtres les résultats, puis tu exportes en CSV ou tu pushes vers Brevo.</p>
      </article>
    </div>
  </section>
</template>
