<script setup lang="ts">
defineProps<{
  campaign: {
    id: string
    productName: string
    searchQuery: string
    placeType: string | null
    searchVariantsText?: string | null
    targetLeads: number
    zones: string[]
    status: string
  }
  pushingToBrevo: boolean
  launching: boolean
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
      <p class="mt-1 text-sm" style="color: var(--muted)">Type: {{ campaign.placeType || 'aucun filtre type' }} • Objectif: {{ campaign.targetLeads }} leads</p>
      <p v-if="campaign.searchVariantsText" class="mt-1 text-sm" style="color: var(--muted)">Variantes actives: {{ campaign.searchVariantsText.split('\n').filter(Boolean).length }}</p>
    </div>

    <div class="flex flex-wrap gap-3">
      <button class="btn-primary" :disabled="campaign.status === 'running' || launching" @click="emit('run')">
        {{ campaign.status === 'running' ? 'Script en cours...' : launching ? 'Lancement...' : 'Générer des leads' }}
      </button>
      <NuxtLink :to="`/app/campaign/${campaign.id}/edit`" class="btn-secondary">Dupliquer et modifier</NuxtLink>
      <button class="btn-secondary" @click="emit('export')">Exporter CSV</button>
      <button class="btn-secondary" @click="emit('brevo')" :disabled="pushingToBrevo">{{ pushingToBrevo ? 'Envoi...' : 'Créer une liste Brevo' }}</button>
    </div>
  </div>
</template>
