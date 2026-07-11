import { z } from 'zod'
import { requireUser } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

const bodySchema = z.object({
  productName: z.string().min(2),
  searchQuery: z.string().min(3),
  zones: z.array(z.string().min(2)).min(1)
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = bodySchema.parse(await readBody(event))

  const campaign = await prisma.campaign.create({
    data: {
      userId: user.id,
      productName: body.productName,
      searchQuery: body.searchQuery,
      zones: body.zones,
      status: 'pending'
    }
  })

  return campaign
})
