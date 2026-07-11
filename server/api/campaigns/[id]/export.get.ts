import { requireUser } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'
import { leadsToCsv } from '../../../utils/csv'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID manquant' })
  }

  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: user.id },
    include: {
      leads: {
        where: { selected: true, status: 'valid' }
      }
    }
  })

  if (!campaign) {
    throw createError({ statusCode: 404, statusMessage: 'Campagne introuvable' })
  }

  const zoneLabel = campaign.zones.join('-').toLowerCase().replaceAll(/\s+/g, '-')
  const fileName = `${campaign.leads.length}_leads_${zoneLabel || 'zone'}.csv`

  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="${fileName}"`)

  return leadsToCsv(campaign.leads)
})
