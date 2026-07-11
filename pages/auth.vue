<script setup lang="ts">
const mode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const { refresh } = useSession()

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await $fetch(`/api/auth/${mode.value === 'login' ? 'login' : 'register'}`, {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    })

    const me = await refresh()
    await navigateTo(me?.onboardingDone ? '/app' : '/onboarding')
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erreur inconnue'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-xl px-6 py-16">
    <div class="card p-8">
      <h1 class="text-3xl font-bold">{{ mode === 'login' ? 'Connexion' : 'Créer un compte' }}</h1>
      <p class="mt-2" style="color: var(--muted)">Session simple email + mot de passe pour démarrer rapidement.</p>

      <div class="mt-6 grid grid-cols-2 gap-2 rounded-xl border p-1" style="border-color: var(--border)">
        <button class="rounded-lg py-2 text-sm font-semibold" :style="mode === 'login' ? 'background: var(--accent); color: white' : ''" @click="mode = 'login'">
          Connexion
        </button>
        <button class="rounded-lg py-2 text-sm font-semibold" :style="mode === 'register' ? 'background: var(--accent); color: white' : ''" @click="mode = 'register'">
          Inscription
        </button>
      </div>

      <form class="mt-6 space-y-4" @submit.prevent="submit">
        <div>
          <label class="mb-2 block text-sm font-semibold">Email</label>
          <input v-model="email" type="email" class="input" required />
        </div>
        <div>
          <label class="mb-2 block text-sm font-semibold">Mot de passe</label>
          <input v-model="password" type="password" class="input" minlength="8" required />
        </div>

        <p v-if="error" class="text-sm" style="color: var(--danger)">{{ error }}</p>

        <button class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Chargement...' : (mode === 'login' ? 'Se connecter' : 'Créer mon compte') }}
        </button>
      </form>
    </div>
  </section>
</template>
