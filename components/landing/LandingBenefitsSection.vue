<script setup lang="ts">
const { target, isVisible } = useScrollReveal<HTMLElement>()
</script>

<template>
  <section ref="target" :class="['reveal-section mx-auto max-w-6xl px-6 pb-16', { 'is-revealed': isVisible }]">
    <h2 class="mb-6 text-3xl font-bold">Bénéfices</h2>
    <div class="grid gap-4 md:grid-cols-3">
      <article class="card p-6">
        <h3 class="text-xl font-semibold">Un script clair, pas une boîte noire</h3>
        <p class="mt-2" style="color: var(--muted)">Tu passes par un vrai lancement de script pour récupérer les leads, pas par une campagne abstraite qui cache le flux.</p>
      </article>
      <article class="card p-6">
        <h3 class="text-xl font-semibold">Leads exploitables plus vite</h3>
        <p class="mt-2" style="color: var(--muted)">Business, catégorie Google Places (New), localisation cible: le pipeline transforme ça en liste de leads enrichis.</p>
      </article>
      <article class="card p-6">
        <h3 class="text-xl font-semibold">Une liste Brevo prête, pas juste un fichier</h3>
        <p class="mt-2" style="color: var(--muted)">Plus besoin d'exporter, ouvrir Brevo, créer une liste à la main, importer le CSV. Le script pousse directement tes leads validés dans une liste nommée et prête pour ta séquence.</p>
      </article>
    </div>
  </section>
</template>
