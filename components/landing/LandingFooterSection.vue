<script setup lang="ts">
const { target, isVisible } = useScrollReveal<HTMLElement>()
</script>

<template>
  <footer ref="target" :class="['reveal-section border-t py-8', { 'is-revealed': isVisible }]" style="border-color: var(--border)">
    <div class="mx-auto flex max-w-6xl flex-col gap-6 px-6 text-sm md:flex-row md:items-center md:justify-between" style="color: var(--muted)">
      <BrandMark compact />
      <p>Outil MVP de prospection Sassify</p>
    </div>
  </footer>
</template>
