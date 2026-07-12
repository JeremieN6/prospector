<template>
  <div>
    <header class="sticky top-0 z-40 border-b bg-white/90 backdrop-blur" style="border-color: var(--border)">
      <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <BrandMark />
        <div class="flex items-center gap-3">
          <NuxtLink to="/" class="btn-secondary !px-4 !py-2 text-sm">Accueil</NuxtLink>
          <NuxtLink to="/auth" class="btn-primary !px-4 !py-2 text-sm">Générer des leads</NuxtLink>
        </div>
      </nav>
    </header>
    <main>
      <slot />
    </main>
  </div>
</template>
