# CLAUDE.md -- Memoire Projet

> Ce fichier est lu automatiquement par l'IA au debut de chaque conversation.
> Mets-le a jour a la fin de chaque session de travail.

---

## Objectif Final
<!-- A completer -->

---

## Stack Technique
<!-- A completer -->

---

## Etat Actuel du Projet
**Phase** : Demarrage
**Derniere session** : -
**Progression globale** : 0%

### Ce qui est fait :
- [x] Configuration MCP memoire
- [x] Correctif prod auth: chargement env runtime Prisma + db push au deploy

### Prochaines etapes :
- [ ] Verifier les logs PM2 apres le prochain deploiement

---

## Blocages et Points d Attention
<!-- Lister ici -->

---

## Decisions Prises
| Date | Decision | Raison |
|------|----------|--------|

---

## Notes de Session
> Ajouter ici un resume a la fin de chaque session de travail.

- 2026-07-12 : Correction du 500 sur /api/auth/me en ajoutant un chargement defensif de .env.local/.env avant l'init Prisma et en appliquant `prisma db push` dans le workflow de deploiement.

---

## Lecons Apprises
> Voir tasks/lessons.md pour le detail des corrections et patterns a eviter.
