# Checklist de mise en ligne — CHOGAN Q4 SALES SYSTEM

À dérouler dans l'ordre. Les cases « auto » sont contrôlées par `npm run check:launch`.

## A. Configuration

- [ ] (auto) Supabase configuré, `STORAGE_DRIVER=local` absent.
- [ ] Migration SQL exécutée dans Supabase ; RLS visible (« RLS enabled ») sur les 4 tables.
- [ ] Test : avec la clé **publique** (anon), une requête `select` sur `leads` est refusée.
- [ ] (auto) `APP_SECRET` (48+ caractères) et `ADMIN_PASSWORD` (16+) propres à la production.
- [ ] (auto) `NEXT_PUBLIC_SITE_URL` en https, `NEXT_PUBLIC_WHATSAPP_NUMBER` renseigné.
- [ ] (auto) Dates limites d'inscription correctes (Session 1 : 09/11, Session 2 : 11/12), `ENROLLMENT_OPEN` à `true`.
- [ ] Migration `20261030000000_sessions.sql` exécutée dans Supabase (après `..._init.sql`).
- [ ] Variables saisies dans l'hébergeur **avant** le build (les `NEXT_PUBLIC_*` sont figées au build).
- [ ] Domaine en HTTPS, redirection http → https active.

## B. Contenu et conformité

- [ ] (auto) Plus aucun passage « À COMPLÉTER » dans les pages juridiques.
- [ ] Mentions légales, confidentialité et CGV relues par un professionnel du droit
      (rétractation, médiateur de la consommation, TVA, transferts hors UE, durées de conservation).
- [ ] Texte de la case « démarrage avant la fin du délai de rétractation » validé.
- [ ] Usage du nom « CHOGAN » vérifié (marque d'un tiers) ; mention d'indépendance conservée.
- [ ] Moyens de paiement listés = moyens réellement acceptés.
- [ ] Bonus : `available: true` uniquement pour les fichiers existants.
- [ ] (auto) Garantie 60 jours : les 11 décisions de `src/content/guarantee.ts` sont prises,
      `termsFinalized: true`, plus aucun « À COMPLÉTER » dans l'article 7 des CGV.
- [ ] (auto) Garantie relue par un professionnel du droit (`legalReviewDone: true`).
- [ ] Le principe affiché sur `/formation` (60 jours, remboursement intégral de 297 €) correspond
      exactement à l'article 7 des CGV.
- [ ] Valeurs des bonus justifiables (prix réellement pratiqué ou de référence).
- [ ] Aucun témoignage, compteur de places ou badge de rareté ajouté.
- [ ] Horaires / outil / replays : ajoutés dans `offer.ts` et les CGV une fois décidés.

## C. Recette manuelle sur le site déployé (téléphone ET ordinateur)

**Capture (`/`)**
- [ ] Envoi vide → toutes les erreurs affichées, focus sur le premier champ.
- [ ] Envoi valide (vrai numéro de test) → « C'est noté, … ! » ; la ligne apparaît dans Supabase
      (`leads`) et dans `/admin` avec la bonne source (tester un lien `?utm_source=test`).
- [ ] Le bouton « Continuer sur WhatsApp » ouvre la bonne conversation, message prérempli correct.

**Vente (`/formation`)**
- [ ] Dates, prix 297 €, 8 modules, FAQ lisibles ; barre d'inscription fixe sur mobile.
- [ ] Section « Garantie 60 jours » visible juste avant le tarif ; son bouton mène à l'inscription,
      et « Consulter les conditions générales de vente » ouvre directement l'article 7 des CGV.
- [ ] Le CTA mène à `/inscription` (ou WhatsApp si `NEXT_PUBLIC_REGISTRATION_MODE=whatsapp`).

**Inscription → confirmation**
- [ ] Demande envoyée → `/confirmation` affiche « Demande d'inscription reçue » + référence.
- [ ] Le bouton « Envoyer ma référence sur WhatsApp » contient la bonne référence.
- [ ] Dans `/admin` : passage en « Paiement en attente de vérification » → la page de confirmation
      du participant se met à jour.
- [ ] Confirmation du paiement avec une vraie référence de transaction → « Inscription confirmée ».
- [ ] Une saisie de numéro de carte est refusée.

**Administration**
- [ ] Mauvais mot de passe refusé ; 6 essais rapides → blocage temporaire.
- [ ] Exports CSV prospects et inscriptions ouverts correctement dans Excel.
- [ ] `/admin` inaccessible en navigation privée sans connexion.

**Désinscription**
- [ ] `/desinscription` avec le numéro de test → prospect « Désinscrit » dans `/admin`.

**Mesure (si configurée)**
- [ ] Premier passage : bandeau visible ; « Tout refuser » → aucune requête vers Google/Meta/TikTok
      (outils de développement du navigateur, onglet Réseau).
- [ ] « Tout accepter » → GA4 « Temps réel » et Meta « Événements de test » reçoivent
      `view_item` / `ViewContent`, puis `generate_lead` / `Lead` après un envoi de formulaire.
- [ ] Un rechargement ne renvoie pas le même événement.

**SEO / performance**
- [ ] (le jour J) `NEXT_PUBLIC_ALLOW_INDEXING=true`, puis vérifier `/robots.txt` et `/sitemap.xml`.
- [ ] Aperçu de partage (Facebook Sharing Debugger / WhatsApp) avec l'image Open Graph.
- [ ] PageSpeed Insights mobile sur `/` et `/formation` (objectif : performance ≥ 90).

**Fermeture des inscriptions et compteur de places**
- [ ] Sur un environnement de test : `ENROLLMENT_OPEN=false` → bandeau « inscriptions fermées »,
      CTA vers la démonstration gratuite, envoi de demande refusé.
- [ ] Après une confirmation dans `/admin`, le compteur de `/formation` et `/inscription` baisse d'une
      place ; une annulation le fait remonter.
- [ ] Sur un environnement de test : `ENROLLMENT_DEADLINE` dans le passé → bandeau « Session 1 close »,
      inscription à la Session 2 avec la case de réservation de 50 €, page de suivi « Place réservée »
      après confirmation, puis « Confirmer le solde… » dans `/admin`.

## D. Après le lancement

- [ ] Sauvegardes Supabase activées (plan adapté) ; export CSV hebdomadaire.
- [ ] Suivi quotidien de `/admin` : demandes en attente à traiter sous 24 h.
- [ ] Ne pas envoyer d'instructions de paiement pour une session déjà complète (10 confirmées).
- [ ] Session 1 : fermeture automatique à 10 confirmées ou le 09/11 à 23 h 59 ; Session 2 : le 11/12.
- [ ] Après la masterclass du 1er novembre : mettre à jour `offer.leadMagnet.masterclass` (bouton de la page d'accueil).
