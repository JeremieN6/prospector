import { z } from 'zod'
import { requireUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

const bodySchema = z.object({
  productName: z.string().min(2),
  searchQuery: z.string().min(3),
  placeType: z.string().trim().min(2).max(64).optional(),
  searchVariantsText: z.string().trim().max(4000).optional(),
  zones: z.array(z.string().min(2)).min(1),
  targetLeads: z.coerce.number().int().min(10).max(1000).default(100)
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  // Entree invalide = erreur client (400), pas une 500 non geree.
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Requete invalide' })
  }
  const body = parsed.data

  const campaign = await prisma.campaign.create({
    data: {
      userId: user.id,
      productName: body.productName,
      searchQuery: body.searchQuery,
      placeType: body.placeType || null,
      searchVariantsText: body.searchVariantsText || null,
      zones: body.zones,
      targetLeads: body.targetLeads,
      status: 'pending'
    }
  })

  return campaign
})
