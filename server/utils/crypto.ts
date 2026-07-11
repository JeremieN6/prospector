import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

function deriveKey(secret: string) {
  return createHash('sha256').update(secret).digest()
}

export function encryptText(raw: string) {
  const config = useRuntimeConfig()
  const key = deriveKey(config.encryptionSecret)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(raw, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`
}

export function decryptText(payload: string | null | undefined) {
  if (!payload) return null
  const config = useRuntimeConfig()
  const key = deriveKey(config.encryptionSecret)
  const [ivPart, tagPart, encryptedPart] = payload.split(':')

  if (!ivPart || !tagPart || !encryptedPart) {
    return null
  }

  const iv = Buffer.from(ivPart, 'base64')
  const tag = Buffer.from(tagPart, 'base64')
  const encrypted = Buffer.from(encryptedPart, 'base64')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const clear = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return clear.toString('utf8')
}
