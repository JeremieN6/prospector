export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    return
  }

  const publicPaths = ['/', '/auth']
  const { me, refresh } = useSession()

  if (!me.value) {
    await refresh()
  }

  if (!me.value?.authenticated && !publicPaths.includes(to.path)) {
    return navigateTo('/auth')
  }

  if (me.value?.authenticated && to.path === '/auth') {
    return navigateTo(me.value.onboardingDone ? '/app' : '/onboarding')
  }

  if (me.value?.authenticated && !me.value.onboardingDone && to.path.startsWith('/app')) {
    return navigateTo('/onboarding')
  }
})
