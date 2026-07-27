<script setup lang="ts">
const model = defineModel<{
  productName: string
  searchQuery: string
  placeType: string
  searchVariantsText: string
  targetLeads: number
  zonesText: string
}>({ required: true })

const props = withDefaults(defineProps<{
  loading: boolean
  error: string
  title?: string
  description?: string
  submitLabel?: string
  loadingLabel?: string
}>(), {
  title: 'Préparer le script',
  description: 'Renseigne le business, la catégorie Google Places et la zone cible. Ensuite tu lanceras le script pour récupérer les leads.',
  submitLabel: 'Préparer la cible',
  loadingLabel: 'Préparation...'
})

const emit = defineEmits<{
  submit: []
}>()
</script>

<template>
  <div class="card p-6">
    <h2 class="text-2xl font-semibold">{{ props.title }}</h2>
    <p class="mt-2 text-sm" style="color: var(--muted)">{{ props.description }}</p>
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
        <label class="mb-2 block text-sm font-semibold">Type Google Places (optionnel)</label>
        <input v-model="model.placeType" class="input" placeholder="Ex: beauty_salon" />
        <p class="mt-2 text-xs" style="color: var(--muted)">Utilise un type Places valide (ex: beauty_salon, dentist, restaurant). Laisse vide pour ne filtrer que via la requête texte.</p>
      </div>
      <div>
        <label class="mb-2 block text-sm font-semibold">Variantes de recherche</label>
        <textarea v-model="model.searchVariantsText" class="input min-h-36" placeholder="Une variante par ligne, format: requête|type" />
        <p class="mt-2 text-xs" style="color: var(--muted)">Exemple: institut de beauté|beauty_salon. Si tu renseignes ce bloc, le script boucle sur chaque ligne pour chaque ville.</p>
      </div>
      <div>
        <label class="mb-2 block text-sm font-semibold">Nombre de leads cible</label>
        <input v-model.number="model.targetLeads" type="number" min="10" max="1000" step="10" class="input" required />
      </div>
      <div>
        <label class="mb-2 block text-sm font-semibold">Localisation cible (séparée par virgule)</label>
        <textarea v-model="model.zonesText" class="input min-h-28" placeholder="Ex: Paris, Boulogne-Billancourt, 92, 93, 94" required />
      </div>

      <p v-if="props.error" class="text-sm" style="color: var(--danger)">{{ props.error }}</p>

      <button class="btn-primary" :disabled="props.loading">
        {{ props.loading ? props.loadingLabel : props.submitLabel }}
      </button>
    </form>
  </div>
</template>
