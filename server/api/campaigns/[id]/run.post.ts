import { requireUser } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'
import { getCampaignQueueIfConfigured } from '../../../utils/queue'
import { decryptText } from '../../../utils/crypto'
import { parseSearchVariantsText, scrapeCampaign } from '../../../utils/scraper'

async function runCampaignInline(campaignId: string, userId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
    include: {
      user: {
        include: { credentials: true }
      },
      leads: true
    }
  })

  if (!campaign) {
    return
  }

  const googlePlacesKey = decryptText(campaign.user.credentials?.googlePlacesKey)
  if (!googlePlacesKey) {
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'failed' }
    })
    return
  }

  const existingEmails = new Set(campaign.leads.map((lead) => lead.email.toLowerCase()))

  try {
    const leads = await scrapeCampaign({
      googlePlacesKey,
      searchQuery: campaign.searchQuery,
      placeType: campaign.placeType,
      searchVariants: parseSearchVariantsText(campaign.searchVariantsText),
      zones: campaign.zones,
      targetLeads: campaign.targetLeads,
      existingEmails,
      onProgress: async (current, target) => {
        const progress = Math.min(100, Math.round((current / target) * 100))
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { progress }
        })
      }
    })

    await prisma.$transaction([
      prisma.lead.deleteMany({ where: { campaignId: campaign.id } }),
      prisma.lead.createMany({
        data: leads.map((lead) => ({
          campaignId: campaign.id,
          nom: lead.nom,
          ville: lead.ville,
          site: lead.site,
          email: lead.email,
          telephone: lead.telephone,
          status: lead.status,
          selected: true
        }))
      }),
      prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'done', progress: 100 }
      })
    ])
  } catch {
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'failed' }
    })
  }
}

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

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      status: 'running',
      progress: 0
    }
  })

  const queue = getCampaignQueueIfConfigured()
  if (queue) {
    const job = await queue.add('scrape', {
      campaignId: campaign.id,
      userId: user.id
    })

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        jobId: job.id ? String(job.id) : null
      }
    })

    return { ok: true, mode: 'queue', jobId: job.id }
  }

  setTimeout(() => {
    void runCampaignInline(campaign.id, user.id)
  }, 0)

  return { ok: true, mode: 'inline' }
})
