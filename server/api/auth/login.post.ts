import { z } from 'zod'
import { createSession, verifyPassword } from '../../utils/auth'
import { prisma } from '../../utils/prisma'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export default defineEventHandler(async (event) => {
  // Une entree invalide (e-mail mal forme, mot de passe trop court) est une erreur client : 400, pas une 500 non geree.
  // Le message reste generique pour ne pas reveler la regle de longueur du mot de passe.
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Requete invalide' })
  }
  const body = parsed.data
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
