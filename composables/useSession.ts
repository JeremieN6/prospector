type MeResponse = {
  authenticated: boolean
  user: { id: string; email: string } | null
  onboardingDone: boolean
}

export function useSession() {
  const me = useState<MeResponse | null>('session-me', () => null)

  async function refresh() {
    me.value = await $fetch('/api/auth/me')
    return me.value
  }

  return { me, refresh }
}
