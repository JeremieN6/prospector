import { PrismaClient } from '@prisma/client'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadLocalEnvFiles() {
  for (const fileName of ['.env.local', '.env']) {
    const envPath = resolve(process.cwd(), fileName)
    if (!existsSync(envPath)) {
      continue
    }

    const raw = readFileSync(envPath, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) {
        continue
      }

      const equalIndex = trimmed.indexOf('=')
      if (equalIndex <= 0) {
        continue
      }

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
}

loadLocalEnvFiles()

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
