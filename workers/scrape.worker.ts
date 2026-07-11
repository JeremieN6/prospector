import { Worker } from 'bullmq'
import IORedis from 'ioredis'
import { PrismaClient } from '@prisma/client'
import { createHash, createDecipheriv } from 'node:crypto'
import { scrapeCampaign } from '../server/utils/scraper'
import { getCampaignQueueName } from '../server/utils/queue'

const prisma = new PrismaClient()
const redisUrl = process.env.REDIS_URL

if (!redisUrl) {
  throw new Error('REDIS_URL manquant pour le worker')
}

function decryptText(payload: string) {
  const secret = process.env.ENCRYPTION_SECRET || process.env.SESSION_SECRET || 'dev-encryption-secret-change-me'
  const key = createHash('sha256').update(secret).digest()
  const [ivPart, tagPart, encryptedPart] = payload.split(':')
  const iv = Buffer.from(ivPart, 'base64')
  const tag = Buffer.from(tagPart, 'base64')
  const encrypted = Buffer.from(encryptedPart, 'base64')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const clear = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return clear.toString('utf8')
}

type JobData = {
  campaignId: string
  userId: string
}

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
})

new Worker<JobData>(
  getCampaignQueueName(),
  async (job) => {
    const campaign = await prisma.campaign.findUnique({
      where: { id: job.data.campaignId },
      include: {
        user: {
          include: {
            credentials: true
          }
        },
        leads: true
      }
    })

    if (!campaign) {
      return
    }

    const encryptedKey = campaign.user.credentials?.googlePlacesKey
    if (!encryptedKey) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'failed' }
      })
      throw new Error('Cle Google Places manquante')
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'running', progress: 0 }
    })

    const googlePlacesKey = decryptText(encryptedKey)
    const existing = new Set(campaign.leads.map((lead) => lead.email.toLowerCase()))

    const leads = await scrapeCampaign({
      googlePlacesKey,
      searchQuery: campaign.searchQuery,
      zones: campaign.zones,
      targetLeads: 100,
      existingEmails: existing,
      onProgress: async (current, target) => {
        const progress = Math.min(100, Math.round((current / target) * 100))
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { progress }
        })
      }
    })

    await prisma.$transaction([
      prisma.lead.deleteMany({ where: { campaignId: campaign.id } }),
      prisma.lead.createMany({
        data: leads.map((lead) => ({
          campaignId: campaign.id,
          nom: lead.nom,
          ville: lead.ville,
          site: lead.site,
          email: lead.email,
          telephone: lead.telephone,
          status: lead.status,
          selected: true
        }))
      }),
      prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: 'done',
          progress: 100
        }
      })
    ])
  },
  { connection }
).on('failed', async (job) => {
  if (!job?.data?.campaignId) return
  await prisma.campaign.update({
    where: { id: job.data.campaignId },
    data: { status: 'failed' }
  })
})
