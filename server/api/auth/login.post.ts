import { z } from 'zod'
import { createSession, verifyPassword } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export default defineEventHandler(async (event) => {
  const body = bodySchema.parse(await readBody(event))
  const user = await prisma.user.findUnique({ where: { email: body.email } })
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Identifiants invalides' })
  }

  const isValid = await verifyPassword(body.password, user.passwordHash)
  if (!isValid) {
    throw createError({ statusCode: 401, statusMessage: 'Identifiants invalides' })
  }

  await createSession(event, user.id)
  return { ok: true }
})
