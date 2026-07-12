<script setup lang="ts">
withDefaults(
  defineProps<{
    compact?: boolean
  }>(),
  {
    compact: false
  }
)
</script>

<template>
  <NuxtLink to="/" class="inline-flex items-center gap-3 rounded-2xl transition hover:opacity-90">
    <span
      class="grid shrink-0 place-items-center rounded-2xl"
      :class="compact ? 'h-10 w-10' : 'h-11 w-11'"
      style="background: linear-gradient(135deg, var(--accent), #1f8b69); box-shadow: 0 12px 28px rgba(18, 102, 79, 0.22)"
      aria-hidden="true"
    >
      <span class="relative block h-5 w-5 rounded-full border border-white/60">
        <span class="absolute left-1/2 top-1/2 h-3.5 w-px -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
        <span class="absolute left-1/2 top-1/2 h-px w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      </span>
    </span>

    <span class="leading-tight">
      <span class="block text-lg font-semibold tracking-tight" :class="compact ? 'text-base' : 'text-lg'">Prospector</span>
      <span class="block text-[0.65rem] uppercase tracking-[0.32em]" style="color: var(--muted)">Sassify</span>
    </span>
  </NuxtLink>
</template>