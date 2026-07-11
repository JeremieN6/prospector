import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { createCipheriv, createHash, randomBytes } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const prisma = new PrismaClient()

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) {
    return
  }

  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const equalIndex = trimmed.indexOf('=')
    if (equalIndex <= 0) continue

    const key = trimmed.slice(0, equalIndex).trim()
    let value = trimmed.slice(equalIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

function encryptText(value: string) {
  const secret = process.env.ENCRYPTION_SECRET || process.env.SESSION_SECRET || 'dev-encryption-secret-change-me'
  const key = createHash('sha256').update(secret).digest()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`
}

async function main() {
  loadEnvLocal()
  const passwordHash = await bcrypt.hash('demo12345', 12)

  const user = await prisma.user.upsert({
    where: { email: 'demo@prospector.local' },
    update: { passwordHash },
    create: {
      email: 'demo@prospector.local',
      passwordHash
    }
  })

  await prisma.apiCredentials.upsert({
    where: { userId: user.id },
    update: {
      googlePlacesKey: encryptText(process.env.GOOGLE_PLACE_API_KEY || process.env.GOOGLE_PLACES_API_KEY || 'demo-google-key'),
      brevoApiKey: encryptText(process.env.BREVO_API_KEY || 'demo-brevo-key')
    },
    create: {
      userId: user.id,
      googlePlacesKey: encryptText(process.env.GOOGLE_PLACE_API_KEY || process.env.GOOGLE_PLACES_API_KEY || 'demo-google-key'),
      brevoApiKey: encryptText(process.env.BREVO_API_KEY || 'demo-brevo-key')
    }
  })

  await prisma.campaign.deleteMany({ where: { userId: user.id } })

  const campaignDone = await prisma.campaign.create({
    data: {
      userId: user.id,
      productName: 'Skinalyze',
      searchQuery: 'institut de beaute',
      zones: ['Paris', 'Boulogne-Billancourt'],
      status: 'done',
      progress: 100,
      brevoListId: '12345'
    }
  })

  await prisma.lead.createMany({
    data: [
      {
        campaignId: campaignDone.id,
        nom: 'Institut Nova Peau',
        ville: 'Paris',
        site: 'https://novapeau.fr',
        email: 'contact@novapeau.fr',
        telephone: '01 42 00 00 01',
        status: 'valid',
        selected: true
      },
      {
        campaignId: campaignDone.id,
        nom: 'Maison Derma',
        ville: 'Boulogne-Billancourt',
        site: 'https://maisonderma.fr',
        email: 'hello@maisonderma.fr',
        telephone: '01 42 00 00 02',
        status: 'valid',
        selected: true
      },
      {
        campaignId: campaignDone.id,
        nom: 'Institut Lumiere',
        ville: 'Paris',
        site: 'https://institutlumiere.fr',
        email: 'info@institutlumiere.fr',
        telephone: '01 42 00 00 03',
        status: 'blacklisted',
        selected: false
      },
      {
        campaignId: campaignDone.id,
        nom: 'Atelier Care',
        ville: 'Paris',
        site: 'https://ateliercare.fr',
        email: 'contact@ateliercare.fr',
        telephone: '01 42 00 00 04',
        status: 'duplicate',
        selected: false
      }
    ]
  })

  await prisma.campaign.create({
    data: {
      userId: user.id,
      productName: 'Tifo',
      searchQuery: 'institut de beaute',
      zones: ['Nanterre', 'Courbevoie'],
      status: 'pending',
      progress: 0
    }
  })

  console.log('Seed termine')
  console.log('User demo: demo@prospector.local / demo12345')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
