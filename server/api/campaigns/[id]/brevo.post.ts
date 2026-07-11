import { requireUser } from '../../../utils/auth'
import { decryptText } from '../../../utils/crypto'
import { createBrevoList, upsertBrevoContacts } from '../../../utils/brevo'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID manquant' })
  }

  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: user.id },
    include: {
      leads: {
        where: { selected: true, status: 'valid' }
      },
      user: {
        include: {
          credentials: true
        }
      }
    }
  })

  if (!campaign) {
    throw createError({ statusCode: 404, statusMessage: 'Campagne introuvable' })
  }

  const encryptedBrevo = campaign.user.credentials?.brevoApiKey
  if (!encryptedBrevo) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ajoute ta cle Brevo dans les reglages pour activer cette fonctionnalite.'
    })
  }

  const brevoApiKey = decryptText(encryptedBrevo)
  if (!brevoApiKey) {
    throw createError({ statusCode: 400, statusMessage: 'Cle Brevo invalide' })
  }

  const wave = await prisma.campaign.count({
    where: { userId: user.id, productName: campaign.productName }
  })

  const listName = `${campaign.productName} - Vague ${wave} - ${campaign.zones.join(', ')}`
  const listId = await createBrevoList(brevoApiKey, listName)

  await upsertBrevoContacts(
    brevoApiKey,
    listId,
    campaign.leads.map((lead) => ({
      email: lead.email,
      attributes: {
        NOM_ENSEIGNE: lead.nom,
        VILLE: lead.ville,
        SITE: lead.site || '',
        TELEPHONE: lead.telephone || ''
      }
    }))
  )

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { brevoListId: listId }
  })

  return { ok: true, listId }
})
