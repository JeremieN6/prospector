<script setup lang="ts">
const DEFAULT_SEARCH_VARIANTS_TEXT = [
  'institut de beauté|beauty_salon',
  'spa|spa',
  'centre esthétique|beauty_salon',
  'soin visage|beauty_salon',
  'médecine esthétique|beauty_salon'
].join('\n')

const productName = ref('')
const searchQuery = ref('')
const placeType = ref('beauty_salon')
const searchVariantsText = ref(DEFAULT_SEARCH_VARIANTS_TEXT)
const targetLeads = ref(100)
const zonesText = ref('')
const loading = ref(false)
const error = ref('')

const { data: campaigns, refresh } = await useAsyncData('campaigns', () => $fetch('/api/campaigns'))

async function createCampaign() {
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/campaigns', {
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

    productName.value = ''
    searchQuery.value = ''
    placeType.value = 'beauty_salon'
    searchVariantsText.value = DEFAULT_SEARCH_VARIANTS_TEXT
    targetLeads.value = 100
    zonesText.value = ''
    await refresh()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erreur'
  } finally {
    loading.value = false
  }
}

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/auth')
}

const campaignForm = computed({
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
</script>

<template>
  <section class="mx-auto max-w-6xl space-y-8 px-6 py-10">
    <AppDashboardHeader :on-logout="logout" />

    <div class="card flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.24em]" style="color: var(--accent)">Workflow</p>
        <h2 class="mt-1 text-xl font-semibold">BUSINESS → CATEGORIE → LOCALISATION CIBLE → GÉNÉRER DES LEADS</h2>
        <p class="mt-1 text-sm" style="color: var(--muted)">La cible alimente le script Google Places, puis la campagne te permet de lancer la récupération des leads.</p>
      </div>
      <NuxtLink to="/onboarding" class="btn-secondary !px-4 !py-2 text-sm">Vérifier les clés</NuxtLink>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <CampaignCreateForm v-model="campaignForm" :loading="loading" :error="error" @submit="createCampaign" />

      <CampaignHistoryList :campaigns="campaigns || []" />
    </div>
  </section>
</template>
