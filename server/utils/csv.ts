import type { Lead } from '@prisma/client'

export function leadsToCsv(leads: Lead[]) {
  const header = 'NOM_ENSEIGNE,VILLE,SITE,EMAIL,TELEPHONE\n'
  const rows = leads.map((lead) => [lead.nom, lead.ville, lead.site || '', lead.email, lead.telephone || '']
    .map((value) => `"${String(value).replaceAll('"', '""')}"`)
    .join(','))

  return `${header}${rows.join('\n')}\n`
}
