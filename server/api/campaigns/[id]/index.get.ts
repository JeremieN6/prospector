import { requireUser } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID manquant' })
  }

  const campaign = await prisma.campaign.findFirst({
    where: {
      id,
      userId: user.id
    },
    include: {
      leads: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!campaign) {
    throw createError({ statusCode: 404, statusMessage: 'Campagne introuvable' })
  }

  return campaign
})
