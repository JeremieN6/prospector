import { z } from 'zod'
import { requireUser } from '../../../../utils/auth'
import { prisma } from '../../../../utils/prisma'

const bodySchema = z.object({
  selected: z.boolean().optional(),
  status: z.enum(['valid', 'blacklisted', 'duplicate']).optional()
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  const leadId = getRouterParam(event, 'leadId')

  if (!id || !leadId) {
    throw createError({ statusCode: 400, statusMessage: 'Parametres manquants' })
  }

  const campaign = await prisma.campaign.findFirst({ where: { id, userId: user.id } })
  if (!campaign) {
    throw createError({ statusCode: 404, statusMessage: 'Campagne introuvable' })
  }

  const body = bodySchema.parse(await readBody(event))
  const targetLead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      campaignId: campaign.id
    }
  })

  if (!targetLead) {
    throw createError({ statusCode: 404, statusMessage: 'Lead introuvable' })
  }

  const lead = await prisma.lead.update({
    where: { id: targetLead.id },
    data: {
      selected: body.selected,
      status: body.status
    }
  })

  return lead
})
