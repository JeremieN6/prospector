import { requireUser } from '../../../utils/auth'
import { prisma } from '../../../utils/prisma'

type ProgressPayload = {
  id: string
  status: string
  progress: number
  updatedAt: string
}

function writeSse(res: any, eventName: string, payload: ProgressPayload) {
  res.write(`event: ${eventName}\n`)
  res.write(`data: ${JSON.stringify(payload)}\n\n`)
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID manquant' })
  }

  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: user.id },
    select: { id: true, status: true, progress: true, updatedAt: true }
  })

  if (!campaign) {
    throw createError({ statusCode: 404, statusMessage: 'Campagne introuvable' })
  }

  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setHeader(event, 'Connection', 'keep-alive')

  const res = event.node.res
  const req = event.node.req

  return await new Promise<void>((resolve) => {
    let closed = false

    const close = () => {
      if (closed) return
      closed = true
      clearInterval(interval)
      try {
        res.end()
      } catch {
        // connection might already be closed
      }
      resolve()
    }

    writeSse(res, 'progress', {
      id: campaign.id,
      status: campaign.status,
      progress: campaign.progress,
      updatedAt: campaign.updatedAt.toISOString()
    })

    const interval = setInterval(async () => {
      if (closed) return

      try {
        const current = await prisma.campaign.findFirst({
          where: { id, userId: user.id },
          select: { id: true, status: true, progress: true, updatedAt: true }
        })

        if (!current) {
          close()
          return
        }

        writeSse(res, 'progress', {
          id: current.id,
          status: current.status,
          progress: current.progress,
          updatedAt: current.updatedAt.toISOString()
        })

        if (current.status === 'done' || current.status === 'failed') {
          writeSse(res, 'end', {
            id: current.id,
            status: current.status,
            progress: current.progress,
            updatedAt: current.updatedAt.toISOString()
          })
          close()
        }
      } catch {
        close()
      }
    }, 1500)

    req.on('close', close)
    req.on('aborted', close)
  })
})
