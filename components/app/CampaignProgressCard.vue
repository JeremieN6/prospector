<script setup lang="ts">
defineProps<{
  status: string
  progress: number
}>()
</script>

<template>
  <div class="card p-5">
    <div class="mb-2 flex items-center justify-between">
      <p class="font-semibold">Statut: {{ status }}</p>
      <p class="text-sm" style="color: var(--muted)">{{ progress }}%</p>
    </div>
    <div class="h-3 w-full overflow-hidden rounded-full" style="background: #e8e9e2">
      <div class="h-full rounded-full transition-all" :style="`width:${progress}%; background: var(--accent)`" />
    </div>
  </div>
</template>
