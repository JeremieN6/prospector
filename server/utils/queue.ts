import { Queue } from 'bullmq'
import IORedis from 'ioredis'

const queueName = 'scrape-campaign'

let queueInstance: Queue | null = null

function redisConnection() {
  const config = useRuntimeConfig()
  if (!config.redisUrl) {
    throw createError({ statusCode: 500, statusMessage: 'REDIS_URL manquant' })
  }

  return new IORedis(config.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  })
}

export function getCampaignQueueIfConfigured() {
  const config = useRuntimeConfig()
  if (!config.redisUrl) {
    return null
  }

  if (!queueInstance) {
    queueInstance = new Queue(queueName, {
      connection: redisConnection()
    })
  }
  return queueInstance
}

export function getCampaignQueue() {
  const queue = getCampaignQueueIfConfigured()
  if (!queue) {
    throw createError({ statusCode: 500, statusMessage: 'REDIS_URL manquant' })
  }
  return queue
}

export function getCampaignQueueName() {
  return queueName
}
