<script setup lang="ts">
type Campaign = {
  id: string
  productName: string
  searchQuery: string
  zones: string[]
  status: string
  _count?: { leads: number }
}

defineProps<{
  campaigns: Campaign[]
}>()
</script>

<template>
  <div class="card p-6">
    <h2 class="text-2xl font-semibold">Historique des vagues</h2>
    <div class="mt-4 space-y-3">
      <article v-for="campaign in campaigns" :key="campaign.id" class="rounded-xl border p-4" style="border-color: var(--border)">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="font-semibold">{{ campaign.productName }}</p>
            <p class="text-sm" style="color: var(--muted)">{{ campaign.searchQuery }}</p>
            <p class="text-sm" style="color: var(--muted)">Zones: {{ campaign.zones.join(', ') }}</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-semibold uppercase" style="color: var(--accent)">{{ campaign.status }}</p>
            <p class="text-sm" style="color: var(--muted)">{{ campaign._count?.leads || 0 }} leads</p>
          </div>
        </div>
        <div class="mt-3">
          <NuxtLink :to="`/app/campaign/${campaign.id}`" class="btn-secondary !px-3 !py-2 text-sm">Générer des leads</NuxtLink>
        </div>
      </article>

      <p v-if="!campaigns.length" style="color: var(--muted)">Aucune campagne pour le moment.</p>
    </div>
  </div>
</template>
