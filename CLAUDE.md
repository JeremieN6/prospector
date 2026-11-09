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
**Phase** : En production, stable (aucun developpement produit en cours, Google Places gele)
**Derniere session** : 2026-11-06
**Progression globale** : non mesuree (MVP interne deploye)

### Ce qui est fait :
- [x] Configuration MCP memoire
- [x] Correctif prod auth: chargement env runtime Prisma + db push au deploy
- [x] Correctif prod: circuit breaker + logs rate-limited sur le worker de scraping (voir Decisions Prises)
- [x] Rotation PM2 configuree (pm2-logrotate: 50M max, retain 14, compression)
- [x] Interrupteur d'urgence `GOOGLE_PLACES_DISABLED` (commit 2821e4c) : bloque campagnes + appels Google (voir Decisions Prises)
- [x] Telemetrie de couts vers le dashboard `ops` (projet separe, `..\ops`) : `server/utils/ops-cost.ts` + `trackCost` apres chaque requete Google Places reussie (ecrit, JAMAIS execute)
- [x] `GOOGLE_PLACES_DISABLED=true` pose dans `/srv/saas/prospector/.env.local` (VPS) le 2026-10-19 ; processus redemarres le 2026-10-23, apres la modification. Probablement actif (charge via `server/utils/prisma.ts` et le worker) mais non teste : lancer une campagne est interdit.
- [x] Stabilisation post-incident verifiee le 2026-11-04 : prod = `740ace9` = origin, 0 redemarrage, disque 47 %, log d'erreurs du worker a 0 octet depuis le 2026-11-02 (le quota Upstash a ete reinitialise le 1er novembre ; en octobre le circuit breaker a tourne ~533 cycles/jour, ~275 Ko/jour)
- [x] Dashboard `pilotage` (projet `ops`) en ligne sur le VPS (PM2 `pilotage`)
- [x] Rotation des secrets compromis le 2026-11-06 : mot de passe du role Neon `neondb_owner` (projet `prospector`, branche `production`) et identifiants de la base Upstash `prospector` (equipe Personal). `.env.local` local et VPS mis a jour (droits 600), `prospector` + `prospector-worker` recharges, verifie (PING Redis, login 401 = lecture Neon OK, 0 nouvelle erreur de worker).
- [x] `ecosystem.config.cjs` du VPS reecrit sans secret ni erreur de syntaxe (2 apps, `.env.local` lu au demarrage par le code)
- [x] Consommation Redis mesuree le 2026-11-06 (Upstash, base `prospector`) : ~4 270 requetes/jour, stable depuis le 1er novembre, 23 614 sur le mois (limite 500 000/mois) ; 2 connexions, 2 cles. Bruit de fond BullMQ (BZPOPMIN, EVALSHA...). Projection ~130 000/mois, soit ~26 % du quota. Aucun signe d'une base partagee avec `flysmart-worker` (voir Blocages).

- [x] Notification de deploiement vers `pilotage` (commit ff3fb22) : derniere etape de `.github/workflows/deploy.yml` (`if: always()`, `|| true`), secrets GitHub `OPS_URL` et `OPS_INGEST_KEY` poses ; un deploiement SUCCESS est enregistre cote ops (slug `prospector`). Meme etape ajoutee dans plotline, tifo et skinalyze.

### Prochaines etapes :
- [ ] Renseigner `OPS_URL` et `OPS_INGEST_KEY` dans le `.env.local` du VPS pour activer l'envoi des couts (absentes au 2026-11-04 ; inutile tant que Google Places est desactive, la telemetrie ne part qu'apres un appel reel)
- [ ] Levee de l'interdit Google Places uniquement sur annonce explicite du remboursement : retirer `GOOGLE_PLACES_DISABLED` puis `pm2 reload prospector prospector-worker --update-env`
- [ ] Upstash : collecteur cote `ops` via l'API Upstash (pas d'instrumentation possible dans l'app, BullMQ envoie les commandes en interne)
- [ ] Mineur : `pm2-logrotate` a `compress true` mais les fichiers tournes restent en `.log` (sans enjeu a ~275 Ko/jour)
- [x] Mineur : `server/api/auth/login.post.ts` renvoie maintenant 400 « Requete invalide » (`safeParse`, message generique) au lieu d'une 500 sur une entree invalide (2026-11-09, teste en isole avec de faux modules : 400 / 401 / ok ; NON deploye tant que non pousse). Meme correction appliquee le 2026-11-09 aux 4 autres routes (`campaigns/index.post.ts`, `credentials/index.post.ts`, `auth/register.post.ts`, `campaigns/[id]/leads/[leadId].patch.ts`) : syntaxe verifiee, a pousser pour deployer ; plus aucun `bodySchema.parse(await readBody(...))` dans `server/api`
- [ ] Surveiller le quota Upstash a la fin du mois (23 614 requetes au 06/11, ~4 270/jour)
---

## Blocages et Points d Attention
- **INTERDIT (ordre du 2026-10-19)** : ne lancer AUCUN scraping de leads ni appel reel a Google Places (campagne, worker, script de test, e2e, meme avec un faux Google) tant que l'utilisateur n'a pas dit explicitement qu'il est rembourse (demarches administratives en cours). Verifier par lecture du code, pas par execution.
- Chaque utilisateur de prospector enregistre sa propre cle Google Places (`credentials.googlePlacesKey`) : le cout Google n'est pas forcement celui du proprietaire. Les evenements de cout envoyes a `ops` portent `userId`/`campaignId` en meta pour pouvoir separer proprietaire et clients.
- Le VPS de prod heberge plusieurs apps sous PM2 (dont Flysmart) qui semblent avoir subi le meme type d'incident Redis au meme moment (25/09) -- cause probablement partagee au niveau du fournisseur Redis (Upstash), a surveiller si ca se reproduit.
- `ecosystem.config.cjs` sur le VPS (`/srv/saas/prospector/`) est untracked, desormais propre (sans secret, syntaxe valide depuis le 2026-11-06). Il n'est pas utilise par `pm2 reload` (PM2 garde sa propre config en memoire) ; `DATABASE_URL` et `REDIS_URL` ne vivent que dans `.env.local`.
- Upstash : le compte a 3 equipes (`sassify`, `Personal`, `flysmart`). La base Redis de prospector est dans `Personal` (hote `dashing-rhino-113733`) ; le connecteur Upstash ne voit que l'equipe qui lui est autorisee. Sur le VPS, aucune autre app ne reference l'hote Redis ni l'endpoint Neon de prospector.
- Les secrets passent par les resultats d'outils (connecteurs Neon/Upstash) : ne jamais les recopier dans le chat, ni dans un fichier versionne.
- Les variables d'`.env.local` ne sont PAS dans l'environnement PM2 (`pm2 jlist` ne les montre pas) : elles sont lues par le code au demarrage. Pour verifier une variable, regarder le fichier et la date de demarrage du process, pas `pm2 env`.

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
- 2026-11-04 : Point d'etat en lecture seule (VPS + depot), aucun code modifie. L'interrupteur est en fait pose sur le VPS depuis le 19/10 (voir "Ce qui est fait"), le quota Upstash s'est reinitialise le 1er novembre et le worker est revenu au calme. Mise a jour de ce fichier et de `tasks/todo.md`.
- 2026-11-06 : Rotation des secrets Neon et Upstash (voir "Ce qui est fait"), nettoyage de `ecosystem.config.cjs` sur le VPS, suppression des sauvegardes contenant les anciens secrets, mesure de la consommation Redis. Aucun code modifie dans le depot, aucun scraping ni appel Google Places. Le projet `ops` a aussi ete refondu cette meme session (voir son propre CLAUDE.md).

- 2026-11-06 (suite) : etape de notification de deploiement ajoutee dans les 4 depots (prospector, plotline, tifo, skinalyze) ; diagnostic de la telemetrie de couts de tifo et skinalyze (cablage correct, aucun appel facturable depuis le 22/10) ; prix `gpt-image-2` ajoute dans `ops` (commit 2f2b3bd, 8/30 $ par million de tokens image, tarif Standard lu sur la page officielle). Aucun code produit de prospector modifie, aucun appel Google Places. Chantier suivant (hors prospector) : telemetrie des apps Anthropic (clippeak, stellara, home, nrv), qui appellent l'API en `fetch` brut et non via le SDK.

- 2026-11-09 (suite, chantier telemetrie hors prospector) : prix Sonnet 5.5 / Haiku 4.5 / gpt-4o-mini ajoutes dans `ops` (8da60ce) + helpers `trackAnthropicResponse` / `trackOpenAIChatResponse` pour les apps en `fetch` brut. clippeak (PR #76) et stellara (PR #2, #3) fusionnes et deployes, cles `OPS_*` posees sur le VPS ; premiers couts stellara recus dans `pilotage`. Un test reel a revele que les rapports stellara retombaient sur le texte de secours (reponses Sonnet coupees a `max_tokens`) : passes sur Haiku 4.5, verifie. Reste : `home` (branche locale prete), nrv, test reel de l'analyse clippeak, suppression de 2 rapports de test `TestOps` dans la base de stellara. Acces SSH au VPS temporairement ferme pour l'assistant (probable anti-intrusion apres de nombreuses connexions). Suite (2026-11-09, soir) : clippeak, stellara et home fusionnes ; nrv deploye ; synchronisation Stripe du MRR en service (6 comptes, organisation « Saas »), PreviewFast abandonne et retire ; connexion SSH par mot de passe du VPS desactivee (cle uniquement, `00-hardening.conf`). Voir le CLAUDE.md de `ops` pour le detail. Aucun code de prospector modifie, aucun appel Google Places.

---

## Lecons Apprises
> Voir tasks/lessons.md pour le detail des corrections et patterns a eviter.
