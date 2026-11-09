import { z } from 'zod'
import { createSession, hashPassword } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export default defineEventHandler(async (event) => {
  // Entree invalide = erreur client (400), pas une 500 non geree.
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Requete invalide' })
  }
  const body = parsed.data

  const exists = await prisma.user.findUnique({ where: { email: body.email } })
  if (exists) {
    throw createError({ statusCode: 409, statusMessage: 'Email deja utilise' })
  }

  const user = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash: await hashPassword(body.password)
    }
  })

  await createSession(event, user.id)
  return { ok: true }
})
