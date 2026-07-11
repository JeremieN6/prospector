import { requireUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireUser(event)
    const credentials = await prisma.apiCredentials.findUnique({ where: { userId: user.id } })
    return {
      authenticated: true,
      user: { id: user.id, email: user.email },
      onboardingDone: Boolean(credentials?.googlePlacesKey)
    }
  } catch {
    return {
      authenticated: false,
      user: null,
      onboardingDone: false
    }
  }
})
