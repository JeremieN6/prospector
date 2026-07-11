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

export function getCampaignQueue() {
  if (!queueInstance) {
    queueInstance = new Queue(queueName, {
      connection: redisConnection()
    })
  }
  return queueInstance
}

export function getCampaignQueueName() {
  return queueName
}
