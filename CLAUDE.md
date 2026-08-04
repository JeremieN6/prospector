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
**Derniere session** : 2026-08-04
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
- 2026-07-12 : Refonte du hero/landing et du dashboard pour exposer clairement le lancement du script de scraping, avec guide Google Places (New), CTA "Générer des leads" et animations de révélation au scroll.
- 2026-07-27 : Ajout d'un vrai flux de génération configurable (business, catégorie, type Google Places, zones, volume), écran de duplication de campagne, fallback d'exécution sans Redis, et export CSV aligné sur le format d'import attendu.
- 2026-08-04 : Synchronisation du moteur de scraping serveur avec la nouvelle version du script source, en reprenant les filtres de noms bloqués et le payload Google Places mis à jour.

---

## Lecons Apprises
> Voir tasks/lessons.md pour le detail des corrections et patterns a eviter.
