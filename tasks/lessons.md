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

### 2026-07-12 Workflow script explicite
**Probleme** : L interface parlait de campagne alors que le vrai déclencheur produit est le lancement du script de scraping.
**Cause racine** : Les CTA, l onboarding et le comment ça marche n exposaient pas l etape la plus importante pour récupérer les leads.
**Solution** : Renommer le CTA principal en "Générer des leads", clarifier le guide Google Places (New), et afficher un parcours business -> catégorie -> localisation -> lancement du script.
**Regle** : Quand un bouton déclenche un job serveur, le nom de l action et la documentation doivent nommer explicitement ce job, pas une abstraction marketing.
