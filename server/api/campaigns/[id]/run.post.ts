import { requireUser } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'
import { getCampaignQueue } from '../../../utils/queue'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID campagne manquant' })
  }

  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: user.id },
    include: {
      user: {
        include: { credentials: true }
      }
    }
  })

  if (!campaign) {
    throw createError({ statusCode: 404, statusMessage: 'Campagne introuvable' })
  }

  if (!campaign.user.credentials?.googlePlacesKey) {
    throw createError({ statusCode: 400, statusMessage: 'Ajoute ta cle Google Places dans les reglages.' })
  }

  const queue = getCampaignQueue()
  const job = await queue.add('scrape', {
    campaignId: campaign.id,
    userId: user.id
  })

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      status: 'running',
      progress: 0,
      jobId: job.id ? String(job.id) : null
    }
  })

  return { ok: true, jobId: job.id }
})
