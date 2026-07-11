<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string
const pushingToBrevo = ref(false)
const brevoError = ref('')
let source: EventSource | null = null

const { data: campaign, refresh } = await useAsyncData(`campaign-${id}`, () => $fetch(`/api/campaigns/${id}`))

function stopProgressStream() {
  if (!source) return
  source.close()
  source = null
}

function startProgressStream() {
  if (!import.meta.client) return
  if (source) return

  source = new EventSource(`/api/campaigns/${id}/events`)

  source.addEventListener('progress', (evt) => {
    const data = JSON.parse((evt as MessageEvent).data) as { status: string; progress: number }
    if (!campaign.value) return
    campaign.value.status = data.status
    campaign.value.progress = data.progress
  })

  source.addEventListener('end', async () => {
    stopProgressStream()
    await refresh()
  })

  source.addEventListener('error', async () => {
    stopProgressStream()
    await refresh()
  })
}

onMounted(() => {
  if (campaign.value?.status === 'running') {
    startProgressStream()
  }
})

onBeforeUnmount(() => stopProgressStream())

async function runScraping() {
  await $fetch(`/api/campaigns/${id}/run`, { method: 'POST' })
  if (campaign.value) {
    campaign.value.status = 'running'
    campaign.value.progress = 0
  }
  startProgressStream()
}

async function toggleLead(leadId: string, selected: boolean) {
  await $fetch(`/api/campaigns/${id}/leads/${leadId}`, {
    method: 'PATCH',
    body: { selected }
  })
  await refresh()
}

async function changeStatus(leadId: string, status: 'valid' | 'blacklisted' | 'duplicate') {
  await $fetch(`/api/campaigns/${id}/leads/${leadId}`, {
    method: 'PATCH',
    body: { status }
  })
  await refresh()
}

function exportCsv() {
  window.location.href = `/api/campaigns/${id}/export`
}

async function createBrevoList() {
  brevoError.value = ''
  pushingToBrevo.value = true
  try {
    await $fetch(`/api/campaigns/${id}/brevo`, { method: 'POST' })
    await refresh()
  } catch (e: any) {
    brevoError.value = e?.data?.message || e?.message || 'Erreur Brevo'
  } finally {
    pushingToBrevo.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-7xl space-y-6 px-6 py-10" v-if="campaign">
    <CampaignDetailHeader :campaign="campaign" :pushing-to-brevo="pushingToBrevo" @run="runScraping" @export="exportCsv" @brevo="createBrevoList" />

    <p v-if="brevoError" class="text-sm" style="color: var(--danger)">{{ brevoError }}</p>

    <CampaignProgressCard :status="campaign.status" :progress="campaign.progress" />

    <CampaignLeadsTable :leads="campaign.leads" @toggle="toggleLead" @status="changeStatus" />
  </section>
</template>
