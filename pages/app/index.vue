<script setup lang="ts">
const productName = ref('')
const searchQuery = ref('institut de beauté')
const zonesText = ref('Paris, Boulogne-Billancourt')
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
        zones: zonesText.value.split(',').map((zone) => zone.trim()).filter(Boolean)
      }
    })

    productName.value = ''
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
    zonesText: zonesText.value
  }),
  set: (value) => {
    productName.value = value.productName
    searchQuery.value = value.searchQuery
    zonesText.value = value.zonesText
  }
})
</script>

<template>
  <section class="mx-auto max-w-6xl space-y-8 px-6 py-10">
    <AppDashboardHeader :on-logout="logout" />

    <div class="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <CampaignCreateForm v-model="campaignForm" :loading="loading" :error="error" @submit="createCampaign" />

      <CampaignHistoryList :campaigns="campaigns || []" />
    </div>
  </section>
</template>
