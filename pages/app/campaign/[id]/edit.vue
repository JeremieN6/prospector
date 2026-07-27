<script setup lang="ts">
const DEFAULT_SEARCH_VARIANTS_TEXT = [
  'institut de beauté|beauty_salon',
  'spa|spa',
  'centre esthétique|beauty_salon',
  'soin visage|beauty_salon',
  'médecine esthétique|beauty_salon'
].join('\n')

const route = useRoute()
const id = route.params.id as string

const loading = ref(false)
const error = ref('')
const productName = ref('')
const searchQuery = ref('')
const placeType = ref('')
const searchVariantsText = ref(DEFAULT_SEARCH_VARIANTS_TEXT)
const targetLeads = ref(100)
const zonesText = ref('')

const { data: campaign } = await useAsyncData(`campaign-edit-${id}`, () => $fetch(`/api/campaigns/${id}`))

watchEffect(() => {
  if (!campaign.value) return
  productName.value = campaign.value.productName
  searchQuery.value = campaign.value.searchQuery
  placeType.value = campaign.value.placeType || ''
  searchVariantsText.value = campaign.value.searchVariantsText || DEFAULT_SEARCH_VARIANTS_TEXT
  targetLeads.value = campaign.value.targetLeads || 100
  zonesText.value = campaign.value.zones.join(', ')
})

const form = computed({
  get: () => ({
    productName: productName.value,
    searchQuery: searchQuery.value,
    placeType: placeType.value,
    searchVariantsText: searchVariantsText.value,
    targetLeads: targetLeads.value,
    zonesText: zonesText.value
  }),
  set: (value) => {
    productName.value = value.productName
    searchQuery.value = value.searchQuery
    placeType.value = value.placeType
    searchVariantsText.value = value.searchVariantsText
    targetLeads.value = value.targetLeads
    zonesText.value = value.zonesText
  }
})

async function duplicateAndLaunch() {
  if (!campaign.value) return

  loading.value = true
  error.value = ''

  try {
    const duplicated = await $fetch<{ id: string }>(`/api/campaigns`, {
      method: 'POST',
      body: {
        productName: productName.value,
        searchQuery: searchQuery.value,
        placeType: placeType.value.trim() || undefined,
        searchVariantsText: searchVariantsText.value.trim() || undefined,
        targetLeads: targetLeads.value,
        zones: zonesText.value.split(',').map((zone) => zone.trim()).filter(Boolean)
      }
    })

    await $fetch(`/api/campaigns/${duplicated.id}/run`, { method: 'POST' })
    await navigateTo(`/app/campaign/${duplicated.id}`)
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Impossible de dupliquer la campagne'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-5xl px-6 py-10" v-if="campaign">
    <div class="mb-6">
      <NuxtLink :to="`/app/campaign/${id}`" class="text-sm font-semibold" style="color: var(--accent)">← Retour à la campagne</NuxtLink>
      <h1 class="mt-2 text-4xl font-bold">Dupliquer et modifier la campagne</h1>
      <p class="mt-2 text-sm" style="color: var(--muted)">Modifie les paramètres avant de créer une nouvelle vague. Le bouton lancera ensuite le script sur la copie.</p>
    </div>

    <CampaignCreateForm
      v-model="form"
      :loading="loading"
      :error="error"
      title="Dupliquer la campagne"
      description="Ajuste le business, la catégorie, le type, la localisation et le volume, puis duplique la campagne avec ces nouveaux paramètres."
      submit-label="Dupliquer et lancer"
      loading-label="Duplication..."
      @submit="duplicateAndLaunch"
    />
  </section>
</template>