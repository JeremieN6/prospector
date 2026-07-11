import { requireUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const credentials = await prisma.apiCredentials.findUnique({ where: { userId: user.id } })

  return {
    hasGooglePlacesKey: Boolean(credentials?.googlePlacesKey),
    hasBrevoApiKey: Boolean(credentials?.brevoApiKey),
    updatedAt: credentials?.updatedAt || null
  }
})
