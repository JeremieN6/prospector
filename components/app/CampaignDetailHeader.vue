<script setup lang="ts">
defineProps<{
  campaign: {
    id: string
    productName: string
    searchQuery: string
    zones: string[]
    status: string
  }
  pushingToBrevo: boolean
}>()

const emit = defineEmits<{
  run: []
  export: []
  brevo: []
}>()
</script>

<template>
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <NuxtLink to="/app" class="text-sm font-semibold" style="color: var(--accent)">← Retour dashboard</NuxtLink>
      <h1 class="mt-2 text-4xl font-bold">{{ campaign.productName }}</h1>
      <p style="color: var(--muted)">{{ campaign.searchQuery }} • {{ campaign.zones.join(', ') }}</p>
    </div>

    <div class="flex flex-wrap gap-3">
      <button class="btn-primary" :disabled="campaign.status === 'running'" @click="emit('run')">
        {{ campaign.status === 'running' ? 'Scraping en cours...' : 'Lancer le scraping' }}
      </button>
      <button class="btn-secondary" @click="emit('export')">Exporter CSV</button>
      <button class="btn-secondary" @click="emit('brevo')" :disabled="pushingToBrevo">{{ pushingToBrevo ? 'Envoi...' : 'Créer une liste Brevo' }}</button>
    </div>
  </div>
</template>
