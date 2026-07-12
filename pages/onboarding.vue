<script setup lang="ts">
const googlePlacesKey = ref('')
const brevoApiKey = ref('')
const loading = ref(false)
const error = ref('')
const { refresh } = useSession()

async function saveKeys() {
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/credentials', {
      method: 'POST',
      body: {
        googlePlacesKey: googlePlacesKey.value || undefined,
        brevoApiKey: brevoApiKey.value || undefined
      }
    })
    await refresh()
    await navigateTo('/app')
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Impossible de sauvegarder'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-3xl px-6 py-16">
    <div class="card p-8">
      <h1 class="text-3xl font-bold">Onboarding des clés API</h1>
      <p class="mt-2" style="color: var(--muted)">Étape obligatoire avant le dashboard, puis tu pourras lancer le script pour générer des leads.</p>

      <form class="mt-8 space-y-6" @submit.prevent="saveKeys">
        <div class="space-y-3">
          <label class="block text-sm font-semibold">Clé Google Places API (New)</label>
          <input v-model="googlePlacesKey" type="password" class="input" required />
          <details class="rounded-xl border p-4" style="border-color: var(--border)">
            <summary class="cursor-pointer font-semibold">Mini guide Google Places (New)</summary>
            <ol class="mt-3 list-inside list-decimal space-y-1 text-sm" style="color: var(--muted)">
              <li>Ouvre Google Cloud Console</li>
              <li>Sélectionne ou crée ton projet</li>
              <li>Active Places API (New) dans Google Maps Platform</li>
              <li>Crée des identifiants puis une clé API</li>
              <li>Copie la clé ici</li>
              <li>Optionnel: restreins-la à Places API (New) et à tes usages autorisés</li>
            </ol>
          </details>
        </div>

        <div class="space-y-3">
          <label class="block text-sm font-semibold">Clé Brevo API (optionnelle)</label>
          <input v-model="brevoApiKey" type="password" class="input" />
          <details class="rounded-xl border p-4" style="border-color: var(--border)">
            <summary class="cursor-pointer font-semibold">Mini guide Brevo</summary>
            <ol class="mt-3 list-inside list-decimal space-y-1 text-sm" style="color: var(--muted)">
              <li>Se connecter à app.brevo.com</li>
              <li>Profil puis SMTP &amp; API</li>
              <li>Onglet Clés API</li>
              <li>Générer une clé et la nommer</li>
              <li>Copier la valeur ici</li>
            </ol>
          </details>
        </div>

        <p v-if="error" class="text-sm" style="color: var(--danger)">{{ error }}</p>

        <button class="btn-primary" :disabled="loading">
          {{ loading ? 'Sauvegarde...' : 'Passer à la génération de leads' }}
        </button>
      </form>
    </div>
  </section>
</template>
