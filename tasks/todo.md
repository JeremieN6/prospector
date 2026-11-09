# Todo -- Taches en cours

> Mis a jour au fil des sessions. Cocher les items termines.
> Derniere mise a jour : 2026-11-06. Le detail du contexte est dans CLAUDE.md.

---

## En cours / a faire
- [ ] Renseigner `OPS_URL` et `OPS_INGEST_KEY` dans le `.env.local` du VPS (utile seulement quand Google Places sera reactive)
- [ ] Levee de l'interdit Google Places : uniquement quand l'utilisateur annonce le remboursement (retirer `GOOGLE_PLACES_DISABLED` puis `pm2 reload prospector prospector-worker --update-env`)
- [ ] Surveiller le quota Upstash a la fin du mois (23 614 requetes au 06/11, ~4 270/jour, limite 500 000/mois)

## Backlog
- [ ] Collecteur Upstash cote `ops` via l'API Upstash
- [x] Mineur : `login.post.ts` renvoie desormais 400 (`safeParse`) au lieu d'un 500 sur une erreur de validation Zod (2026-11-09, a pousser) ; meme motif restant dans 4 autres routes (campaigns, credentials, register, leads patch)
- [ ] Mineur : compression de `pm2-logrotate` inactive (fichiers tournes en `.log`), sans enjeu a ce volume

## Fait
- [x] Initialisation MCP memoire + structure projet
- [x] Corriger le 500 prod sur /api/auth/me via chargement env runtime Prisma et sync schema au deploy
- [x] Rendre le flux lead-gen explicite sur la landing et le dashboard (Google Places New, CTA script, reveal scroll)
- [x] Rendre la génération de leads réellement exécutable depuis le bouton + paramètres configurables (SaaS, catégorie, type, zones, volume)
- [x] Ajouter un écran de duplication de campagne et un export CSV au format d'import externe
- [x] Synchroniser le moteur de scraping serveur avec la mise à jour du script source
- [x] Incident du 2026-09-25 : circuit breaker et logs rate-limites sur le worker, `pm2-logrotate`, troncature du log de 27 Go
- [x] Reduire le bruit de fond Redis du worker inactif (commit 7d3233c ; niveau actuel mesure le 2026-11-06 : ~4 270 requetes/jour)
- [x] Interrupteur `GOOGLE_PLACES_DISABLED` code et pose sur le VPS (2026-10-19)
- [x] Telemetrie de couts `trackCost` vers `ops` (code deploye, inactive faute de cles)
- [x] Verifier la stabilisation post-incident (2026-11-04) : 0 redemarrage, disque 47 %, log a 0 octet
- [x] Rotation des identifiants Neon et Redis compromis (2026-11-06), local et VPS, verifiee
- [x] `ecosystem.config.cjs` du VPS reecrit sans secret ni erreur de syntaxe (2026-11-06)
- [x] Mesurer la consommation Redis et verifier le partage avec `flysmart-worker` (2026-11-06 : 2 connexions, 2 cles, pas de partage constate)
