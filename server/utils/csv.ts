import type { Lead } from '@prisma/client'

type CsvLead = Pick<Lead, 'nom' | 'email' | 'telephone'> & {
  site: string | null
}

type CsvCampaign = {
  searchQuery: string
  placeType: string | null
}

function csvEscape(value: string | number | null | undefined) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

function csvInterestValue(campaign: CsvCampaign) {
  const interest = (campaign.placeType || campaign.searchQuery || '').trim()
  return interest ? `['${interest.replaceAll("'", "\\'")}']` : '[]'
}

export function leadsToCsv(leads: CsvLead[], campaign: CsvCampaign) {
  const header = 'CONTACT ID,EMAIL,NOM_ENSEIGNE,LASTNAME,SMS,LANDLINE_NUMBER,WHATSAPP,INTERESTS\n'
  const rows = leads.map((lead, index) => {
    const phone = lead.telephone?.trim() || '0000000000'
    return [
      index + 1,
      lead.email,
      lead.nom,
      lead.nom,
      phone,
      phone,
      phone,
      csvInterestValue(campaign)
    ]
      .map((value) => csvEscape(value))
      .join(',')
  })

  return `${header}${rows.join('\n')}\n`
}
