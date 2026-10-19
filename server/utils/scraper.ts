import dns from 'node:dns/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { trackCost } from './ops-cost'

// Les champs demandes (websiteUri, nationalPhoneNumber) relevent du SKU "Text Search Enterprise" :
// 35 $ / 1000 requetes (palier <= 100 000/mois), 1 000 gratuites/mois, agregees sur le compte de
// facturation Google (tarif global au 2026-10-16). Si on retire ces champs, on passe en Pro (32 $).
// Estimation : n'integre pas le quota gratuit, donc surestime tant qu'il n'est pas depasse.
// Interrupteur d'urgence : GOOGLE_PLACES_DISABLED=true (ou 1/yes) bloque TOUT appel a Google Places.
// Lu a chaque requete ; en production il faut redemarrer les process PM2 (--update-env) apres modification.
export function isGooglePlacesDisabled() {
  const value = (process.env.GOOGLE_PLACES_DISABLED || '').trim().toLowerCase()
  return value === '1' || value === 'true' || value === 'yes'
}

const PLACES_FIELD_MASK ='places.id,places.name,places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,nextPageToken'
const PLACES_TEXT_SEARCH_USD_PER_REQUEST = 0.035

const BLOCKED_EMAILS = new Set([
  'help.fr@booksy.com',
  'wavy@treatwell.fr',
  'example@example.com',
  'your@email.com',
  'utilisateur@domaine.com',
  'nom@gmail.com',
  'exemple@mail.com',
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
  'mail.fr',
  'exemple.com',
  'facebook.com',
  'instagram.com'
])

const BLOCKED_NAME_PATTERNS = [
  /coiffeur/i,
  /coiffure/i,
  /club libertin/i,
  /sauna club/i,
  /centre aquatique/i,
  /piscine municipale/i
]

export type ScrapedLead = {
  nom: string
  ville: string
  site: string | null
  email: string
  telephone: string | null
  status: 'valid' | 'blacklisted' | 'duplicate'
}

export type SearchVariant = {
  textQuery: string
  includedType?: string | null
}

type ScrapeInput = {
  googlePlacesKey: string
  searchQuery: string
  placeType?: string | null
  searchVariants?: SearchVariant[]
  zones: string[]
  targetLeads: number
  existingEmails?: Set<string>
  onProgress?: (current: number, target: number, city: string) => Promise<void> | void
  // Contexte joint a chaque cout envoye a Sassify Ops (la cle Google est celle de l'utilisateur)
  costContext?: { userId?: string; campaignId?: string }
}

export function parseSearchVariantsText(searchVariantsText: string | null | undefined) {
  if (!searchVariantsText) {
    return [] as SearchVariant[]
  }

  return searchVariantsText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [textQueryPart, includedTypePart] = line.split('|')
      const textQuery = textQueryPart?.trim() || ''
      const includedType = includedTypePart?.trim() || null
      if (!textQuery) {
        return null
      }
      return {
        textQuery,
        includedType
      }
    })
    .filter((variant): variant is SearchVariant => Boolean(variant))
}

function resolveSearchVariants(input: Pick<ScrapeInput, 'searchQuery' | 'placeType' | 'searchVariants'>) {
  if (input.searchVariants?.length) {
    return input.searchVariants
  }

  return [{
    textQuery: input.searchQuery,
    includedType: input.placeType || null
  }]
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

function isBlockedPlaceName(name: string | null | undefined) {
  if (!name) return false
  return BLOCKED_NAME_PATTERNS.some((pattern) => pattern.test(name))
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

async function searchPlaces(
  googlePlacesKey: string,
  city: string,
  variant: SearchVariant,
  costContext?: ScrapeInput['costContext']
) {
  const results: Array<any> = []
  let pageToken: string | null = null

  do {
    const payload: Record<string, unknown> = {
      textQuery: `${variant.textQuery} ${city}`,
      pageSize: 20,
      pageToken,
      languageCode: 'fr',
      regionCode: 'FR',
      strictTypeFiltering: false,
      includePureServiceAreaBusinesses: false
    }

    if (variant.includedType && variant.includedType.trim()) {
      payload.includedType = variant.includedType.trim()
    }

    if (isGooglePlacesDisabled()) {
      throw new Error('Google Places desactive (GOOGLE_PLACES_DISABLED) : aucun appel effectue')
    }

    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googlePlacesKey,
        'X-Goog-FieldMask': PLACES_FIELD_MASK
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Google Places HTTP ${response.status} sur ${city}`)
    }

    // Une requete reussie = un evenement facturable (chaque page de pagination est comptee).
    void trackCost({
      project: 'prospector',
      provider: 'google-places',
      endpoint: 'places:searchText',
      units: 1,
      unitLabel: 'requests',
      amount: PLACES_TEXT_SEARCH_USD_PER_REQUEST,
      currency: 'USD',
      meta: { city, paged: Boolean(pageToken), ...costContext }
    })

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
  const { googlePlacesKey, zones, targetLeads, onProgress, costContext } = input
  const existingEmails = input.existingEmails || new Set<string>()
  const searchVariants = resolveSearchVariants(input)

  const leadsByEmail = new Map<string, ScrapedLead>()
  const seenPlaceIds = new Set<string>()

  for (const city of zones) {
    if (leadsByEmail.size >= targetLeads) break

    for (const variant of searchVariants) {
      if (leadsByEmail.size >= targetLeads) break

      const places = await searchPlaces(googlePlacesKey, city, variant, costContext)
      for (const place of places) {
        if (leadsByEmail.size >= targetLeads) break
        if (!place.id || seenPlaceIds.has(place.id)) continue
        seenPlaceIds.add(place.id)

        const placeName = place.displayName?.text || place.name || ''
        if (isBlockedPlaceName(placeName)) continue

        const website = place.websiteUri || null
        if (!website) continue

        const email = await extractEmail(website)
        if (!email) continue
        if (isBlockedEmail(email) || isGenericEmail(email)) continue
        if (!(await hasMxRecord(email))) continue

        if (existingEmails.has(email) || leadsByEmail.has(email)) continue

        leadsByEmail.set(email, {
          nom: place.displayName?.text || '',
          ville: city,
          site: website,
          email,
          telephone: place.nationalPhoneNumber || null,
          status: 'valid'
        })

        if (onProgress) {
          await onProgress(leadsByEmail.size, targetLeads, city)
        }

        await delay(900)
      }
    }
  }

  return [...leadsByEmail.values()]
}
