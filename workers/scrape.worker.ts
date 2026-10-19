import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Worker } from 'bullmq'
import IORedis from 'ioredis'
import { PrismaClient } from '@prisma/client'
import { createHash, createDecipheriv } from 'node:crypto'
import { parseSearchVariantsText, scrapeCampaign } from '../server/utils/scraper'
import { getCampaignQueueName } from '../server/utils/queue'

// Charger .env.local puis .env si présents (worker standalone, pas de Nuxt dotenv)
for (const envFile of ['.env.local', '.env']) {
  const envPath = resolve(process.cwd(), envFile)
  if (!existsSync(envPath)) continue
  try {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx < 0) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).replace(/^["'](.*)["']$/, '$1')
      if (key && !(key in process.env)) process.env[key] = value
    }
  } catch {
    // ignorer les erreurs de parsing .env
  }
}

const prisma = new PrismaClient()
const redisUrl = process.env.REDIS_URL

if (!redisUrl) {
  throw new Error('REDIS_URL manquant pour le worker — vérifier .env.local')
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
  enableReadyCheck: false,
  tls: { rejectUnauthorized: false },
  retryStrategy: (times) => {
    if (times > 8) return null
    return Math.min(times * 500, 5000)
  },
  reconnectOnError: (err) => {
    const msg = String(err?.message || '').toUpperCase()
    return msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT') || msg.includes('ECONNREFUSED')
  },
})

// Circuit breaker pour les erreurs Redis persistantes (ex: quota fournisseur dépassé).
// Sans ce garde-fou, BullMQ ré-émet une erreur applicative Redis sans délai dans sa
// boucle interne de récupération de jobs, ce qui sature les logs et le réseau.
const REDIS_ERROR_LOG_INTERVAL_MS = 30_000
const REDIS_ERROR_PAUSE_THRESHOLD = 5
const REDIS_ERROR_BASE_BACKOFF_MS = 2_000
const REDIS_ERROR_MAX_BACKOFF_MS = 120_000
const HEALTHY_RESET_AFTER_MS = 5 * 60_000

let consecutiveRedisErrors = 0
let backoffLevel = 0
let lastErrorLoggedAt = 0
let lastErrorAt = 0
let resumeTimer: ReturnType<typeof setTimeout> | null = null

function logStructured(event: string, fields: Record<string, unknown> = {}) {
  console.error(JSON.stringify({
    level: 'error',
    event,
    timestamp: new Date().toISOString(),
    ...fields
  }))
}

const worker = new Worker<JobData>(
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
      placeType: campaign.placeType,
      searchVariants: parseSearchVariantsText(campaign.searchVariantsText),
      zones: campaign.zones,
      targetLeads: campaign.targetLeads,
      existingEmails: existing,
      costContext: { userId: campaign.userId, campaignId: campaign.id },
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
  {
    connection,
    // Un job de scraping arrive rarement et reveille de toute facon la lecture
    // bloquante instantanement des qu il est ajoute a la file: ces deux delais
    // ne retardent que les relances a vide. Les valeurs par defaut de BullMQ
    // (quelques secondes) faisaient tourner ce worker en boucle 24h/24 sans
    // aucun job, consommant des commandes Upstash en continu -- cause
    // probable du depassement de quota du 24/09 et de celui d aujourd hui.
    drainDelay: 300,
    stalledInterval: 300_000,
  }
)

worker.on('failed', async (job) => {
  if (!job?.data?.campaignId) return
  await prisma.campaign.update({
    where: { id: job.data.campaignId },
    data: { status: 'failed' }
  })
})

worker.on('completed', () => {
  if (lastErrorAt && Date.now() - lastErrorAt > HEALTHY_RESET_AFTER_MS) {
    backoffLevel = 0
  }
})

worker.on('error', (err: Error) => {
  consecutiveRedisErrors += 1
  lastErrorAt = Date.now()

  const now = Date.now()
  if (now - lastErrorLoggedAt > REDIS_ERROR_LOG_INTERVAL_MS) {
    lastErrorLoggedAt = now
    logStructured('scrape_worker_redis_error', {
      errorName: err?.name,
      errorMessage: String(err?.message || err).slice(0, 300),
      consecutiveErrors: consecutiveRedisErrors
    })
  }

  if (consecutiveRedisErrors >= REDIS_ERROR_PAUSE_THRESHOLD && !worker.isPaused() && !resumeTimer) {
    const backoff = Math.min(REDIS_ERROR_BASE_BACKOFF_MS * 2 ** backoffLevel, REDIS_ERROR_MAX_BACKOFF_MS)
    const jitter = backoff * (0.2 + Math.random() * 0.3)
    const delay = Math.round(backoff + jitter)
    backoffLevel = Math.min(backoffLevel + 1, 6)

    logStructured('scrape_worker_circuit_open', { delayMs: delay, backoffLevel })

    worker.pause()
    resumeTimer = setTimeout(() => {
      resumeTimer = null
      consecutiveRedisErrors = 0
      worker.resume()
      logStructured('scrape_worker_circuit_closed', {})
    }, delay)
  }
})
