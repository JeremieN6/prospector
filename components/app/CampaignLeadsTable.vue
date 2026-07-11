<script setup lang="ts">
type LeadStatus = 'valid' | 'blacklisted' | 'duplicate'

type Lead = {
  id: string
  nom: string
  ville: string
  email: string
  site: string | null
  telephone: string | null
  selected: boolean
  status: LeadStatus
}

defineProps<{
  leads: Lead[]
}>()

const emit = defineEmits<{
  toggle: [leadId: string, selected: boolean]
  status: [leadId: string, status: LeadStatus]
}>()
</script>

<template>
  <div class="card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="border-b" style="border-color: var(--border)">
            <th class="p-3 text-left">Inclure</th>
            <th class="p-3 text-left">Nom</th>
            <th class="p-3 text-left">Ville</th>
            <th class="p-3 text-left">Email</th>
            <th class="p-3 text-left">Site</th>
            <th class="p-3 text-left">Tel</th>
            <th class="p-3 text-left">Statut</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lead in leads" :key="lead.id" class="border-b align-top" style="border-color: var(--border)">
            <td class="p-3">
              <input :checked="lead.selected" type="checkbox" @change="emit('toggle', lead.id, !lead.selected)" />
            </td>
            <td class="p-3">{{ lead.nom }}</td>
            <td class="p-3">{{ lead.ville }}</td>
            <td class="p-3">{{ lead.email }}</td>
            <td class="p-3">
              <a v-if="lead.site" :href="lead.site" target="_blank" rel="noreferrer" class="underline">{{ lead.site }}</a>
            </td>
            <td class="p-3">{{ lead.telephone || '-' }}</td>
            <td class="p-3">
              <select class="rounded-lg border px-2 py-1" style="border-color: var(--border)" :value="lead.status" @change="emit('status', lead.id, ($event.target as HTMLSelectElement).value as LeadStatus)">
                <option value="valid">valid</option>
                <option value="blacklisted">blacklisted</option>
                <option value="duplicate">duplicate</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
