import dns from 'node:dns/promises'
import { setTimeout as delay } from 'node:timers/promises'

const BLOCKED_EMAILS = new Set([
  'help.fr@booksy.com',
  'wavy@treatwell.fr',
  'example@example.com',
  'your@email.com',
  'utilisateur@domaine.com',
  'nom@gmail.com',
  'exemple@gmail.com',
  'you@example.com',
  'press@google.com',
  'u003edpo@sumup.com'
])

const BLOCKED_EMAIL_DOMAINS = new Set([
  'booksy.com',
  'treatwell.fr',
  'treatwell.com',
  'treatwell.co.uk',
  'wavy.fr',
  'example.com',
  'domaine.com',
  'email.com',
  'google.com',
  'sumup.com',
  'facebook.com',
  'instagram.com'
])

export type ScrapedLead = {
  nom: string
  ville: string
  site: string | null
  email: string
  telephone: string | null
  status: 'valid' | 'blacklisted' | 'duplicate'
}

type ScrapeInput = {
  googlePlacesKey: string
  searchQuery: string
  zones: string[]
  targetLeads: number
  existingEmails?: Set<string>
  onProgress?: (current: number, target: number, city: string) => Promise<void> | void
}

function normalizeEmail(value: string) {
  let normalized = value.trim().toLowerCase().replace(/^mailto:/, '')
  try {
    normalized = decodeURIComponent(normalized)
  } catch {
    // keep raw value
  }
  return normalized.replace(/^[\s'"<>]+/, '').replace(/[\s'"<>;,]+$/, '')
}

function extractEmailFromText(text: string) {
  const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []
  for (const candidate of matches) {
    const email = normalizeEmail(candidate)
    const domain = email.split('@')[1] || ''
    const blockedExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico']
    if (blockedExtensions.some((ext) => domain.endsWith(`.${ext}`))) {
      continue
    }
    if (isBlockedEmail(email)) {
      continue
    }
    return email
  }
  return null
}

function isBlockedEmail(email: string) {
  const normalized = normalizeEmail(email)
  if (BLOCKED_EMAILS.has(normalized)) return true
  const domain = normalized.split('@')[1] || ''
  return BLOCKED_EMAIL_DOMAINS.has(domain)
}

function isGenericEmail(email: string) {
  return /^(noreply|no-reply|donotreply|contact|hello|admin|info|webmaster|support)@/i.test(email)
}

function extractDomainFromWebsite(website: string | null) {
  if (!website) return null
  try {
    return new URL(website).hostname.replace(/^www\./i, '').toLowerCase()
  } catch {
    return null
  }
}

async function hasMxRecord(email: string) {
  const domain = email.split('@')[1]
  try {
    const records = await dns.resolveMx(domain)
    return records.length > 0
  } catch {
    return false
  }
}

async function fetchText(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; ProspectorBot/1.0)',
        accept: 'text/html,application/xhtml+xml'
      }
    })
    if (!response.ok) return ''
    return response.text()
  } catch {
    return ''
  }
}

async function extractEmail(website: string) {
  const homepage = await fetchText(website)
  const homepageEmail = extractEmailFromText(homepage)
  if (homepageEmail) return homepageEmail

  const contactUrls = ['/contact', '/contact-us', '/nous-contacter', '/contactez-nous']
  for (const route of contactUrls) {
    const html = await fetchText(new URL(route, website).href)
    const email = extractEmailFromText(html)
    if (email) return email
    await delay(900)
  }

  return null
}

async function searchPlaces(googlePlacesKey: string, searchQuery: string, city: string) {
  const results: Array<any> = []
  let pageToken: string | null = null

  do {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googlePlacesKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.websiteUri,places.nationalPhoneNumber,nextPageToken'
      },
      body: JSON.stringify({
        textQuery: `${searchQuery} ${city}`,
        pageSize: 20,
        pageToken,
        languageCode: 'fr',
        regionCode: 'FR',
        includedType: 'beauty_salon',
        strictTypeFiltering: false,
        includePureServiceAreaBusinesses: false
      })
    })

    if (!response.ok) {
      throw new Error(`Google Places HTTP ${response.status} sur ${city}`)
    }

    const data = await response.json() as { places?: any[]; nextPageToken?: string }
    if (Array.isArray(data.places)) {
      results.push(...data.places)
    }

    pageToken = data.nextPageToken || null
    if (pageToken) {
      await delay(2000)
    }
  } while (pageToken)

  return results
}

export async function scrapeCampaign(input: ScrapeInput) {
  const { googlePlacesKey, searchQuery, zones, targetLeads, onProgress } = input
  const existingEmails = input.existingEmails || new Set<string>()

  const leadsByDomain = new Map<string, ScrapedLead>()
  const leadsByEmail = new Set<string>()
  const seenPlaceIds = new Set<string>()

  for (const city of zones) {
    if (leadsByDomain.size >= targetLeads) break

    const places = await searchPlaces(googlePlacesKey, searchQuery, city)
    for (const place of places) {
      if (leadsByDomain.size >= targetLeads) break
      if (!place.id || seenPlaceIds.has(place.id)) continue
      seenPlaceIds.add(place.id)

      const website = place.websiteUri || null
      if (!website) continue

      const email = await extractEmail(website)
      if (!email) continue
      if (isBlockedEmail(email) || isGenericEmail(email)) continue
      if (!(await hasMxRecord(email))) continue

      const domain = extractDomainFromWebsite(website) || email.split('@')[1]
      if (!domain) continue
      if (leadsByDomain.has(domain)) continue
      if (existingEmails.has(email) || leadsByEmail.has(email)) continue

      leadsByEmail.add(email)
      leadsByDomain.set(domain, {
        nom: place.displayName?.text || '',
        ville: city,
        site: website,
        email,
        telephone: place.nationalPhoneNumber || null,
        status: 'valid'
      })

      if (onProgress) {
        await onProgress(leadsByDomain.size, targetLeads, city)
      }

      await delay(900)
    }
  }

  return [...leadsByDomain.values()]
}
