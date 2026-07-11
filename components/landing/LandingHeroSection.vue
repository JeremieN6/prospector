<template>
  <section class="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 md:grid-cols-2">
    <div class="space-y-7">
      <p class="inline-flex rounded-full px-3 py-1 text-sm font-semibold" style="background: var(--accent-soft); color: var(--accent)">
        Prospection B2B locale pour les produits Sassify
      </p>
      <h1 class="text-5xl font-bold leading-tight md:text-6xl">
        Trouve des leads qualifiés,
        <span style="color: var(--accent)">plus vite</span>,
        sans perdre le contrôle.
      </h1>
      <p class="max-w-xl text-lg" style="color: var(--muted)">
        Prospector automatise la recherche Google Places, vérifie les emails et prépare tes vagues Brevo par produit.
        Tu gardes la main sur la validation avant export et envoi.
      </p>
      <div class="flex flex-wrap gap-3">
        <NuxtLink to="/auth" class="btn-primary">Lancer une campagne</NuxtLink>
        <a href="#comment-ca-marche" class="btn-secondary">Voir comment ça marche</a>
      </div>
    </div>
    <div class="card relative overflow-hidden p-6">
      <div class="absolute -right-12 -top-10 h-40 w-40 rounded-full" style="background: rgba(18, 102, 79, 0.18)" />
      <div class="absolute -bottom-16 left-0 h-36 w-36 rounded-full" style="background: rgba(219, 182, 91, 0.25)" />
      <div class="relative space-y-4">
        <h2 class="text-2xl font-semibold">Aperçu de pipeline</h2>
        <div class="space-y-3">
          <div class="rounded-xl border p-4" style="border-color: var(--border)">
            <p class="text-sm" style="color: var(--muted)">Campagne</p>
            <p class="text-xl font-semibold">Skinalyze - Institut de beauté - 92/93/94</p>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div class="rounded-xl border p-3" style="border-color: var(--border)">
              <p class="text-sm" style="color: var(--muted)">Leads</p>
              <p class="text-xl font-bold">128</p>
            </div>
            <div class="rounded-xl border p-3" style="border-color: var(--border)">
              <p class="text-sm" style="color: var(--muted)">Valides</p>
              <p class="text-xl font-bold">93</p>
            </div>
            <div class="rounded-xl border p-3" style="border-color: var(--border)">
              <p class="text-sm" style="color: var(--muted)">Exportables</p>
              <p class="text-xl font-bold">89</p>
            </div>
          </div>
          <div class="h-3 w-full overflow-hidden rounded-full" style="background: #e8e9e2">
            <div class="h-full rounded-full" style="width: 74%; background: var(--accent)" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
