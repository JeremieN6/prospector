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
    <h2 class="text-2xl font-semibold">Préparer le script</h2>
    <p class="mt-2 text-sm" style="color: var(--muted)">Renseigne le business, la catégorie Google Places et la zone cible. Ensuite tu lanceras le script pour récupérer les leads.</p>
    <form class="mt-4 space-y-4" @submit.prevent="emit('submit')">
      <div>
        <label class="mb-2 block text-sm font-semibold">Business</label>
        <input v-model="model.productName" class="input" placeholder="Ex: Skinalyze" required />
      </div>
      <div>
        <label class="mb-2 block text-sm font-semibold">Catégorie Google Places (New)</label>
        <input v-model="model.searchQuery" class="input" placeholder="Ex: institut de beauté" required />
      </div>
      <div>
        <label class="mb-2 block text-sm font-semibold">Localisation cible (séparée par virgule)</label>
        <textarea v-model="model.zonesText" class="input min-h-28" placeholder="Ex: Paris, Boulogne-Billancourt, 92, 93, 94" required />
      </div>

      <p v-if="props.error" class="text-sm" style="color: var(--danger)">{{ props.error }}</p>

      <button class="btn-primary" :disabled="props.loading">
        {{ props.loading ? 'Préparation...' : 'Préparer la cible' }}
      </button>
    </form>
  </div>
</template>
