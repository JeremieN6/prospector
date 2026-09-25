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
**Derniere session** : 2026-09-25
**Progression globale** : 0%

### Ce qui est fait :
- [x] Configuration MCP memoire
- [x] Correctif prod auth: chargement env runtime Prisma + db push au deploy
- [x] Correctif prod: circuit breaker + logs rate-limited sur le worker de scraping (voir Decisions Prises)
- [x] Rotation PM2 configuree (pm2-logrotate: 50M max, retain 14, compression)

### Prochaines etapes :
- [ ] Verifier les logs PM2 apres le prochain deploiement
- [ ] Surveiller CPU/disque/trafic du VPS sur les prochaines 24-48h pour confirmer la stabilisation post-fix
- [ ] Envisager de retirer les secrets en clair de `ecosystem.config.cjs` sur le VPS (fichier non versionne, syntaxe JS invalide `KEY=valeur` au lieu de `KEY: 'valeur'`) et de reference un `.env` a la place

---

## Blocages et Points d Attention
- Le VPS de prod heberge plusieurs apps sous PM2 (dont Flysmart) qui semblent avoir subi le meme type d'incident Redis au meme moment (25/09) -- cause probablement partagee au niveau du fournisseur Redis (Upstash), a surveiller si ca se reproduit.
- `ecosystem.config.cjs` sur le VPS (`/srv/saas/prospector/`) est untracked et contient des identifiants Redis/DB en clair avec une syntaxe JS invalide (`KEY=valeur,` au lieu de `KEY: 'valeur',`). Il n'est pas utilise par `pm2 reload` (PM2 garde sa propre config en memoire) mais merite d'etre corrige/secretise si un jour on repart d'un `pm2 start ecosystem.config.cjs` propre.

---

## Decisions Prises
| Date | Decision | Raison |
|------|----------|--------|
| 2026-09-25 | Ajout d'un circuit breaker (pause/resume avec backoff exponentiel + jitter) et de logs structures/rate-limited sur `workers/scrape.worker.ts` | Le quota de requetes Redis (Upstash) a ete depasse le 24/09 ; sans listener `'error'` sur le Worker BullMQ, chaque erreur Redis applicative etait re-emise sans delai par la boucle interne de BullMQ, produisant un rejet de promesse non gere a chaque iteration -> `prospector-worker-error.log` a grossi de ~4-9 Go/jour jusqu'a 27 Go en 3 jours et le disque VPS est monte a 96%. |
| 2026-09-25 | Installation de `pm2-logrotate` (global, toutes apps PM2) avec max_size 50M / retain 14 / compress true | Eviter la recidive (meme pour d'autres process du VPS) quelle que soit la cause applicative future. |

---

## Notes de Session
> Ajouter ici un resume a la fin de chaque session de travail.

- 2026-07-12 : Correction du 500 sur /api/auth/me en ajoutant un chargement defensif de .env.local/.env avant l'init Prisma et en appliquant `prisma db push` dans le workflow de deploiement.
- 2026-07-12 : Refonte du hero/landing et du dashboard pour exposer clairement le lancement du script de scraping, avec guide Google Places (New), CTA "Générer des leads" et animations de révélation au scroll.
- 2026-07-27 : Ajout d'un vrai flux de génération configurable (business, catégorie, type Google Places, zones, volume), écran de duplication de campagne, fallback d'exécution sans Redis, et export CSV aligné sur le format d'import attendu.
- 2026-08-04 : Synchronisation du moteur de scraping serveur avec la nouvelle version du script source, en reprenant les filtres de noms bloqués et le payload Google Places mis à jour.
- 2026-09-25 : Diagnostic en direct sur le VPS prod (croissance anormale de `prospector-worker-error.log`, ~27 Go). Cause confirmée : dépassement du quota de requêtes Redis Upstash le 24/09, combiné à l'absence d'un listener `'error'` sur le Worker BullMQ (`workers/scrape.worker.ts`), qui laissait la boucle interne de BullMQ ré-émettre l'erreur sans délai à chaque itération. Correctif déployé (circuit breaker + logs structurés rate-limited), `pm2-logrotate` installé sur le VPS, fichier de log obsolète à purger (troncature bloquée par le garde-fou de l'outil, à faire manuellement ou avec confirmation explicite).

---

## Lecons Apprises
> Voir tasks/lessons.md pour le detail des corrections et patterns a eviter.
