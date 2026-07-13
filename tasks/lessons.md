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
