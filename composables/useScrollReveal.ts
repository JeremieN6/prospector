export function useScrollReveal<T extends HTMLElement>(options: IntersectionObserverInit = {}) {
  const target = ref<T | null>(null)
  const isVisible = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!target.value || !('IntersectionObserver' in window)) {
      isVisible.value = true
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          isVisible.value = true
          observer.disconnect()
        }
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -8% 0px',
        ...options
      }
    )

    observer.observe(target.value)
  })

  onBeforeUnmount(() => observer?.disconnect())

  return {
    target,
    isVisible
  }
}