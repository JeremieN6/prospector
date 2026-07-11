import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

const COOKIE_NAME = 'prospector_session'
const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}

export async function createSession(event: H3Event, userId: string) {
  const token = randomBytes(32).toString('hex')
  const tokenHash = sha256(token)
  const expiresAt = new Date(Date.now() + THIRTY_DAYS)

  await prisma.session.create({
    data: { userId, tokenHash, expiresAt }
  })

  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt
  })
}

export async function destroySession(event: H3Event) {
  const token = getCookie(event, COOKIE_NAME)
  if (token) {
    await prisma.session.deleteMany({
      where: {
        tokenHash: sha256(token)
      }
    })
  }

  deleteCookie(event, COOKIE_NAME, { path: '/' })
}

export async function requireUser(event: H3Event) {
  const token = getCookie(event, COOKIE_NAME)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Non authentifie' })
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true }
  })

  if (!session || session.expiresAt < new Date()) {
    throw createError({ statusCode: 401, statusMessage: 'Session invalide' })
  }

  return session.user
}
