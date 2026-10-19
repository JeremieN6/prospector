// Client de telemetrie de couts vers le dashboard Sassify Ops (voir projet `ops`).
// Utilise uniquement process.env (pas d'auto-import Nuxt) car il est aussi charge par le worker (tsx).
//
// Variables : OPS_URL (ex: https://ops.sassify.fr) et OPS_INGEST_KEY (= NUXT_INGEST_KEY cote ops).
// Si elles sont absentes, ne fait rien.
//
// Regle d'or : la telemetrie ne doit JAMAIS casser ni ralentir l'app. Cette fonction ne throw pas,
// a un timeout court et se met en pause apres plusieurs echecs consecutifs (circuit breaker).

export type CostEvent = {
  project: string
  provider: string
  endpoint?: string
  units?: number
  unitLabel?: string
  amount: number
  currency?: 'EUR' | 'USD'
  occurredAt?: string
  meta?: Record<string, unknown>
}

let consecutiveFailures = 0
let pausedUntil = 0

export async function trackCost(event: CostEvent): Promise<void> {
  const url = process.env.OPS_URL
  const key = process.env.OPS_INGEST_KEY
  if (!url || !key || Date.now() < pausedUntil) {
    return
  }

  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/api/ingest/cost`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ops-key': key },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(3000)
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    consecutiveFailures = 0
  } catch {
    consecutiveFailures += 1
    if (consecutiveFailures >= 5) {
      pausedUntil = Date.now() + 5 * 60 * 1000
      consecutiveFailures = 0
    }
  }
}
