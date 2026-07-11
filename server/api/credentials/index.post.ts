import { z } from 'zod'
import { requireUser } from '../../utils/auth'
import { encryptText } from '../../utils/crypto'
import { prisma } from '../../utils/prisma'

const bodySchema = z.object({
  googlePlacesKey: z.string().min(10).optional(),
  brevoApiKey: z.string().min(10).optional()
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = bodySchema.parse(await readBody(event))

  const payload: { googlePlacesKey?: string; brevoApiKey?: string } = {}
  if (body.googlePlacesKey) payload.googlePlacesKey = encryptText(body.googlePlacesKey)
  if (body.brevoApiKey) payload.brevoApiKey = encryptText(body.brevoApiKey)

  await prisma.apiCredentials.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...payload
    },
    update: payload
  })

  return { ok: true }
})
