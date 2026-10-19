# Lessons Learned

> Ce fichier est mis a jour apres CHAQUE correction faite par l utilisateur.
> But : ne plus refaire les memes erreurs. Relu au debut de chaque session.

---

## Format

### [DATE] Titre du probleme
**Probleme** : Description de ce qui a mal tourne.
**Cause racine** : Pourquoi c est arrive.
**Solution** : Ce qui a ete fait pour corriger.
**Regle** : La regle a suivre desormais pour eviter ce cas.

---

## Lecons

### 2026-10-19 Test e2e prepare sur un chemin facture (Google Places) sans accord
**Probleme** : Pour valider la telemetrie de couts, j'ai prepare puis tente de lancer un test qui executait le vrai `scrapeCampaign` (avec un faux Google). L'utilisateur a interrompu l'execution : il est en demarche pour etre rembourse et son compte ne doit absolument pas utiliser Google Places d'ici la.
**Cause racine** : J'ai juge le test sur (Google stubbe) sans verifier si executer du code qui touche un service payant, meme simule, etait acceptable dans le contexte, et sans demander avant. Un stub reste un risque : une erreur de routage du faux fetch ferait partir un vrai appel facture.
**Solution** : Aucun lancement n'a eu lieu. Ajout de l'interrupteur `GOOGLE_PLACES_DISABLED` (scraper + run.post.ts), validation par lecture du code et controle de syntaxe (esbuild) uniquement, regle enregistree dans la memoire.
**Regle** : Ne jamais executer un chemin de code qui peut appeler une API tierce payante (Google Places, LLM, etc.) sans accord explicite et recent de l'utilisateur, meme avec un stub. Preferer la lecture de code, les tests unitaires de fonctions pures et le controle de syntaxe, et demander avant toute execution a risque de cout.

### 2026-09-25 Worker BullMQ sans listener 'error' -> log de 27 Go en 3 jours
**Probleme** : `prospector-worker-error.log` a grossi de ~4-9 Go/jour jusqu'a 27 Go, saturant le disque du VPS (96%).
**Cause racine** : Le `Worker` BullMQ dans `workers/scrape.worker.ts` n'avait pas de listener `.on('error', ...)`. Quand le quota Redis (Upstash) a ete depasse, BullMQ a emis une erreur applicative (non liee a la connexion) sans aucun delai dans sa boucle interne de recuperation de jobs (`retryIfFailed`, cf. `node_modules/bullmq/dist/cjs/classes/worker.js`), produisant un rejet de promesse non gere a chaque iteration, imprime en clair par Node sur stderr en boucle serree.
**Solution** : Ajouter un listener `'error'` avec logs structures et rate-limites (1 resume/30s, jamais l'objet erreur complet), plus un circuit breaker (pause du worker + resume automatique avec backoff exponentiel + jitter) declenche apres N erreurs consecutives. Installer `pm2-logrotate` (max_size, retain, compress) en filet de securite global.
**Regle** : Tout `Worker`/`Queue` BullMQ doit avoir un listener `'error'` explicite avant mise en prod -- sans lui, une erreur Redis applicative persistante (quota, misconfiguration) devient une boucle de log illimitee plutot qu'un signal exploitable. Ajouter systematiquement un garde-fou (pause/backoff) quand une ressource externe (Redis, API tierce) peut echouer de maniere soutenue.

### 2026-08-04 Synchronisation du script source
**Probleme** : Le moteur de scraping serveur avait dérivé de la version source mise à jour.
**Cause racine** : Les filtres d'exclusion et le payload Places n'avaient pas été reportés dans le code partagé.
**Solution** : Reprendre les nouveaux filtres de noms bloqués et harmoniser la requête Places dans `server/utils/scraper.ts`.
**Regle** : Quand le script source évolue, répercuter immédiatement ses règles métier dans le moteur partagé avant de modifier seulement la couche UI.

### 2026-07-27 CSV export Neon et duplication campagne
**Probleme** : Le CSV exporté ne correspondait pas au format d'import attendu et aucune vraie édition/duplication de campagne n'était disponible.
**Cause racine** : Le helper CSV utilisait des colonnes internes, la migration de schéma n'avait pas été fournie en SQL brut, et le flux UI ne proposait qu'une création simple.
**Solution** : Passer l'export sur les colonnes CONTACT ID / EMAIL / NOM_ENSEIGNE / LASTNAME / SMS / LANDLINE_NUMBER / WHATSAPP / INTERESTS, créer un écran de duplication pré-rempli, et fournir le SQL Neon manuel.
**Regle** : Quand le format cible est imposé par un import externe, l'export doit être aligné explicitement sur ce schéma et la migration doit exister en SQL réutilisable hors Prisma.

### 2026-07-13 FAQ orientee usage reel
**Probleme** : La FAQ landing contenait une question prematuree (multi-utilisateur) et un rendu visuel confus sur une question dupliquée/superposée.
**Cause racine** : Les items FAQ n etaient pas revus selon le contexte produit actuel (outil interne MVP) et le style natif `summary` n etait pas explicitement normalise.
**Solution** : Remplacer les questions par des points directement utiles au workflow actuel (lancement script, doublons, validation avant Brevo, usage sans Brevo) et normaliser l affichage `summary`.
**Regle** : Sur une landing MVP interne, ne garder que des FAQ liees aux actions immediates de l utilisateur; retirer les questions go-to-market tant qu elles ne sont pas activement pertinentes.

### 2026-07-12 Workflow script explicite
**Probleme** : L interface parlait de campagne alors que le vrai déclencheur produit est le lancement du script de scraping.
**Cause racine** : Les CTA, l onboarding et le comment ça marche n exposaient pas l etape la plus importante pour récupérer les leads.
**Solution** : Renommer le CTA principal en "Générer des leads", clarifier le guide Google Places (New), et afficher un parcours business -> catégorie -> localisation -> lancement du script.
**Regle** : Quand un bouton déclenche un job serveur, le nom de l action et la documentation doivent nommer explicitement ce job, pas une abstraction marketing.
