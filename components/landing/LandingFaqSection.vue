<template>
  <section class="mx-auto max-w-4xl px-6 py-16">
    <h2 class="mb-8 text-3xl font-bold">FAQ</h2>
    <div class="space-y-4">
      <details class="card p-5">
        <summary class="cursor-pointer font-semibold">Puis-je scraper sans clé Brevo ?</summary>
        <p class="mt-2" style="color: var(--muted)">Oui. Tu peux scraper et exporter en CSV. Le push Brevo reste bloqué tant que la clé n’est pas renseignée.</p>
      </details>
      <details class="card p-5">
        <summary class="cursor-pointer font-semibold">Le système est-il multi-utilisateur ?</summary>
        <p class="mt-2" style="color: var(--muted)">Oui. Chaque utilisateur a ses campagnes et ses clés chiffrées séparément.</p>
      </details>
      <details class="card p-5">
        <summary class="cursor-pointer font-semibold">Comment sont gérés les doublons ?</summary>
        <p class="mt-2" style="color: var(--muted)">La déduplication se fait sur domaine et email pendant le scraping, puis tu peux ajuster manuellement les statuts.</p>
      </details>
    </div>
  </section>
</template>
