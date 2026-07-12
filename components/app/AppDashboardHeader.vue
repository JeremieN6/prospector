<script setup lang="ts">
defineProps<{
  onLogout: () => Promise<void>
}>()
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-4xl font-bold">Dashboard campagnes</h1>
      <p style="color: var(--muted)">Crée une cible, lance le script, puis pilote les leads de chaque business.</p>
    </div>
    <div class="flex gap-3">
      <NuxtLink to="/onboarding" class="btn-secondary">Réglages API</NuxtLink>
      <button class="btn-secondary" @click="onLogout">Déconnexion</button>
    </div>
  </div>
</template>
