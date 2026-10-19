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
**Derniere session** : 2026-10-19
**Progression globale** : 0%

### Ce qui est fait :
- [x] Configuration MCP memoire
- [x] Correctif prod auth: chargement env runtime Prisma + db push au deploy
- [x] Correctif prod: circuit breaker + logs rate-limited sur le worker de scraping (voir Decisions Prises)
- [x] Rotation PM2 configuree (pm2-logrotate: 50M max, retain 14, compression)
- [x] Interrupteur d'urgence `GOOGLE_PLACES_DISABLED` (commit 2821e4c) : bloque campagnes + appels Google (voir Decisions Prises)
- [x] Telemetrie de couts vers le dashboard `ops` (projet separe, `..\ops`) : `server/utils/ops-cost.ts` + `trackCost` apres chaque requete Google Places reussie (ecrit, JAMAIS execute)

### Prochaines etapes :
- [ ] **URGENT** : definir `GOOGLE_PLACES_DISABLED=true` dans le `.env`/`.env.local` du VPS (`/srv/saas/prospector`) puis `pm2 reload prospector prospector-worker --update-env` (le code est deploye mais l'interrupteur est eteint par defaut). Verifier en lancant une campagne : elle doit etre refusee (503) sans appel Google.
- [ ] Deployer `ops` (ops.sassify.fr) puis renseigner `OPS_URL` et `OPS_INGEST_KEY` dans le `.env` de prospector pour activer l'envoi des couts
- [ ] Upstash : collecteur cote `ops` via l'API Upstash (pas d'instrumentation possible dans l'app, BullMQ envoie les commandes en interne)
- [ ] Verifier les logs PM2 apres le prochain deploiement
- [ ] Surveiller CPU/disque/trafic du VPS sur les prochaines 24-48h pour confirmer la stabilisation post-fix
- [ ] Envisager de retirer les secrets en clair de `ecosystem.config.cjs` sur le VPS (fichier non versionne, syntaxe JS invalide `KEY=valeur` au lieu de `KEY: 'valeur'`) et de reference un `.env` a la place

---

## Blocages et Points d Attention
- **INTERDIT (ordre du 2026-10-19)** : ne lancer AUCUN scraping de leads ni appel reel a Google Places (campagne, worker, script de test, e2e, meme avec un faux Google) tant que l'utilisateur n'a pas dit explicitement qu'il est rembourse (demarches administratives en cours). Verifier par lecture du code, pas par execution.
- Chaque utilisateur de prospector enregistre sa propre cle Google Places (`credentials.googlePlacesKey`) : le cout Google n'est pas forcement celui du proprietaire. Les evenements de cout envoyes a `ops` portent `userId`/`campaignId` en meta pour pouvoir separer proprietaire et clients.
- Le VPS de prod heberge plusieurs apps sous PM2 (dont Flysmart) qui semblent avoir subi le meme type d'incident Redis au meme moment (25/09) -- cause probablement partagee au niveau du fournisseur Redis (Upstash), a surveiller si ca se reproduit.
- `ecosystem.config.cjs` sur le VPS (`/srv/saas/prospector/`) est untracked et contient des identifiants Redis/DB en clair avec une syntaxe JS invalide (`KEY=valeur,` au lieu de `KEY: 'valeur',`). Il n'est pas utilise par `pm2 reload` (PM2 garde sa propre config en memoire) mais merite d'etre corrige/secretise si un jour on repart d'un `pm2 start ecosystem.config.cjs` propre.

---

## Decisions Prises
| Date | Decision | Raison |
|------|----------|--------|
| 2026-09-25 | Ajout d'un circuit breaker (pause/resume avec backoff exponentiel + jitter) et de logs structures/rate-limited sur `workers/scrape.worker.ts` | Le quota de requetes Redis (Upstash) a ete depasse le 24/09 ; sans listener `'error'` sur le Worker BullMQ, chaque erreur Redis applicative etait re-emise sans delai par la boucle interne de BullMQ, produisant un rejet de promesse non gere a chaque iteration -> `prospector-worker-error.log` a grossi de ~4-9 Go/jour jusqu'a 27 Go en 3 jours et le disque VPS est monte a 96%. |
| 2026-09-25 | Installation de `pm2-logrotate` (global, toutes apps PM2) avec max_size 50M / retain 14 / compress true | Eviter la recidive (meme pour d'autres process du VPS) quelle que soit la cause applicative future. |
| 2026-10-19 | Interrupteur `GOOGLE_PLACES_DISABLED` (true/1/yes) : refus 503 dans `server/api/campaigns/[id]/run.post.ts` + garde juste avant l'unique `fetch` vers `places.googleapis.com` dans `server/utils/scraper.ts` (`isGooglePlacesDisabled()`). Lu a chaque requete ; redemarrage PM2 `--update-env` requis apres modification. Eteint par defaut. | L'utilisateur ne doit pas consommer Google Places tant qu'il n'est pas rembourse ; garde au plus pres de l'appel pour couvrir aussi les jobs deja en file et le mode sans Redis. |
| 2026-10-19 | Cout Google Places estime a 0,035 $ / requete (SKU Text Search Enterprise : `websiteUri` + `nationalPhoneNumber` dans le field mask), chaque page de pagination comptee comme une requete | Tarif global Google au 2026-10-16 (35 $/1000 jusqu'a 100 000/mois, 1 000 gratuites/mois agregees sur le compte de facturation). Estimation qui surestime tant que le quota gratuit n'est pas depasse ; la facturation separee de chaque page n'est pas confirmee par la doc. Retirer ces deux champs ferait passer en Pro (32 $). |
| 2026-10-19 | Telemetrie via `trackCost` (fire-and-forget, timeout 3 s, circuit breaker, jamais de throw, sans effet si `OPS_URL`/`OPS_INGEST_KEY` absents) ; `ops-cost.ts` n'utilise que `process.env` car il est aussi charge par le worker (tsx) | La telemetrie ne doit jamais casser ni ralentir le scraping (lecon de l'incident Redis du 25/09). |

---

## Notes de Session
> Ajouter ici un resume a la fin de chaque session de travail.

- 2026-07-12 : Correction du 500 sur /api/auth/me en ajoutant un chargement defensif de .env.local/.env avant l'init Prisma et en appliquant `prisma db push` dans le workflow de deploiement.
- 2026-07-12 : Refonte du hero/landing et du dashboard pour exposer clairement le lancement du script de scraping, avec guide Google Places (New), CTA "Générer des leads" et animations de révélation au scroll.
- 2026-07-27 : Ajout d'un vrai flux de génération configurable (business, catégorie, type Google Places, zones, volume), écran de duplication de campagne, fallback d'exécution sans Redis, et export CSV aligné sur le format d'import attendu.
- 2026-08-04 : Synchronisation du moteur de scraping serveur avec la nouvelle version du script source, en reprenant les filtres de noms bloqués et le payload Google Places mis à jour.
- 2026-09-25 : Diagnostic en direct sur le VPS prod (croissance anormale de `prospector-worker-error.log`, ~27 Go). Cause confirmée : dépassement du quota de requêtes Redis Upstash le 24/09, combiné à l'absence d'un listener `'error'` sur le Worker BullMQ (`workers/scrape.worker.ts`), qui laissait la boucle interne de BullMQ ré-émettre l'erreur sans délai à chaque itération. Correctif déployé (circuit breaker + logs structurés rate-limited), `pm2-logrotate` installé sur le VPS, fichier de log obsolète à purger (troncature bloquée par le garde-fou de l'outil, à faire manuellement ou avec confirmation explicite).
- 2026-10-19 : Création du projet séparé `ops` (`..\ops`, Nuxt 3 + Prisma + Neon, dashboard de coûts par projet/API + coûts fixes, base Neon `ops` créée, test de bout en bout OK sur données fictives nettoyées ensuite). Dans prospector : ajout de la télémétrie de coûts Google Places (`server/utils/ops-cost.ts`, `scraper.ts`, worker et `run.post.ts` passent `costContext`) et de l'interrupteur `GOOGLE_PLACES_DISABLED` suite à l'ordre de ne plus appeler Google Places jusqu'au remboursement. Tout le travail a été validé par lecture + contrôle de syntaxe uniquement (aucun scraping lancé). Le commit 2821e4c est poussé sur `main` : le workflow de déploiement l'a probablement mis en production, interrupteur encore éteint tant que la variable n'est pas définie sur le VPS.

---

## Lecons Apprises
> Voir tasks/lessons.md pour le detail des corrections et patterns a eviter.
