<script setup lang="ts">
const model = defineModel<{
  productName: string
  searchQuery: string
  zonesText: string
}>({ required: true })

const props = defineProps<{
  loading: boolean
  error: string
}>()

const emit = defineEmits<{
  submit: []
}>()
</script>

<template>
  <div class="card p-6">
    <h2 class="text-2xl font-semibold">Nouvelle campagne</h2>
    <form class="mt-4 space-y-4" @submit.prevent="emit('submit')">
      <div>
        <label class="mb-2 block text-sm font-semibold">Nom du produit</label>
        <input v-model="model.productName" class="input" placeholder="Skinalyze" required />
      </div>
      <div>
        <label class="mb-2 block text-sm font-semibold">Requête Google Places</label>
        <input v-model="model.searchQuery" class="input" required />
      </div>
      <div>
        <label class="mb-2 block text-sm font-semibold">Zones (séparées par virgule)</label>
        <textarea v-model="model.zonesText" class="input min-h-28" required />
      </div>

      <p v-if="props.error" class="text-sm" style="color: var(--danger)">{{ props.error }}</p>

      <button class="btn-primary" :disabled="props.loading">
        {{ props.loading ? 'Création...' : 'Créer la campagne' }}
      </button>
    </form>
  </div>
</template>
