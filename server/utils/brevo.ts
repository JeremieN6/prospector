type BrevoContact = {
  email: string
  attributes?: Record<string, string>
}

async function brevoFetch<T>(apiKey: string, path: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(`https://api.brevo.com/v3${path}`, {
    method,
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Brevo ${response.status}: ${text}`)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json() as Promise<T>
}

export async function createBrevoList(apiKey: string, name: string) {
  const data = await brevoFetch<{ id: number }>(apiKey, '/contacts/lists', 'POST', {
    name
  })
  return String(data.id)
}

export async function upsertBrevoContacts(apiKey: string, listId: string, contacts: BrevoContact[]) {
  return brevoFetch(apiKey, '/contacts/import', 'POST', {
    listIds: [Number(listId)],
    emailBlacklisted: false,
    disableNotification: true,
    updateExistingContacts: true,
    jsonBody: contacts
  })
}
