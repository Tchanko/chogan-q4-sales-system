# CHOGAN Q4 SALES SYSTEM — tunnel de conversion

Application web du tunnel de vente de la formation **CHOGAN Q4 SALES SYSTEM**
(297 €, du 6 novembre au 6 décembre 2026) :

| Page | Rôle |
| --- | --- |
| `/` | Page de capture : mini-atelier gratuit, collecte prénom / WhatsApp / e-mail facultatif / difficulté |
| `/formation` | Page de vente (12 sections, CTA « Je veux rejoindre CHOGAN Q4 SALES SYSTEM ») |
| `/inscription` | Demande d'inscription (aucun paiement en ligne, confirmation manuelle sur WhatsApp) |
| `/confirmation` | Suivi réel de la demande : reçue → paiement en attente de vérification → confirmée |
| `/desinscription` | Désinscription des communications marketing |
| `/mentions-legales`, `/confidentialite`, `/conditions-de-vente` | Documents juridiques **à compléter** |
| `/admin` | Tableau de bord protégé : prospects, sources, inscriptions, validation des paiements, exports CSV |

Stack : Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4,
zod (validation partagée navigateur/serveur), libphonenumber-js, Supabase, Vitest, Playwright.

---

## 1. Démarrage rapide (local)

Prérequis : Node.js 20.9 ou plus récent (testé avec Node 26).

```bash
cd chogan-q4-sales-system
npm install
```

Un fichier `.env.local` de **développement** a été généré (stockage dans un fichier local
`.data/db.json`, secrets aléatoires). Pour repartir de zéro : copier `.env.example` en `.env.local`
et le compléter (voir section 3).

```bash
npm run dev
```

Ouvrir <http://localhost:3000>. Le tableau de bord est sur <http://localhost:3000/admin>
(mot de passe : variable `ADMIN_PASSWORD` de `.env.local`).

Version de production en local :

```bash
npm run build
npm run start
```

---

## 2. Structure du projet

```
src/
  app/
    (public)/              pages publiques (capture, vente, inscription, confirmation, légal…)
    admin/                 tableau de bord, connexion, actions serveur, export CSV
    api/
      leads/               POST formulaire de capture
      registrations/       POST demande d'inscription (pose le cookie de suivi signé)
      unsubscribe/         POST désinscription
      webhooks/payment/    notifications du futur prestataire de paiement (501 tant qu'aucun)
    sitemap.ts, robots.ts, opengraph-image.tsx, icon.tsx
  components/              formulaires, consentement, suivi, mise en page
  content/offer.ts         ★ tout le contenu commercial (prix, dates, programme, bonus, FAQ…)
  lib/
    validation/            schémas zod partagés + normalisation WhatsApp (E.164)
    storage/               interface Repository + pilotes Supabase / fichier / mémoire
    services/              logique métier testable (prospects, inscriptions, paiements, stats, CSV)
    security/              signature des cookies, limitation de débit, anti-robots, origine
    analytics/             consentement, événements dédoublonnés, attribution UTM
    payments/              contrat d'intégration d'un futur prestataire de paiement
    enrollment.ts          ouverture / fermeture des inscriptions
  proxy.ts                 protection de /admin (Next 16 : « proxy » remplace « middleware »)
supabase/migrations/       schéma SQL, RLS, fonctions
tests/unit, tests/sql      tests Vitest (logique, API, migration SQL dans PostgreSQL embarqué)
tests/e2e                  tests Playwright (parcours complets, accessibilité, sécurité)
scripts/check-launch.mjs   vérification automatique avant mise en ligne
docs/CHECKLIST-MISE-EN-LIGNE.md
```

---

## 3. Variables d'environnement

Toutes sont décrites dans [`.env.example`](.env.example). Les variables `NEXT_PUBLIC_*` sont
visibles dans le navigateur (jamais de secret) et intégrées **au moment du build** : redéployer
après modification.

| Variable | Obligatoire en production | Rôle |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | oui | URL publique https (canoniques, sitemap, Open Graph) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | oui | Numéro WhatsApp pro, format `33612345678` |
| `NEXT_PUBLIC_REGISTRATION_MODE` | non | `form` (défaut, CTA → `/inscription`) ou `whatsapp` |
| `NEXT_PUBLIC_ALLOW_INDEXING` | le jour J | `true` pour autoriser l'indexation (sinon `noindex` partout) |
| `SUPABASE_URL` | oui | URL du projet Supabase |
| `SUPABASE_SECRET_KEY` | oui | Clé **secrète** Supabase (`sb_secret_…` ou ancienne `service_role`) |
| `STORAGE_DRIVER` | non | `local` = fichier JSON, **tests uniquement** |
| `APP_SECRET` | oui | Signature des cookies (48+ caractères aléatoires) |
| `ADMIN_PASSWORD` | oui | Mot de passe de `/admin` (16+ caractères conseillés) |
| `ENROLLMENT_OPEN` | non | `false` ferme immédiatement les inscriptions |
| `ENROLLMENT_DEADLINE` | non | Date limite ISO ; par défaut 05/11/2026 23 h 59 (Paris), veille du démarrage |
| `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_TIKTOK_PIXEL_ID` | non | Outils de mesure, chargés **après consentement** |

Générer un secret :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

**Si le stockage n'est pas configuré**, les formulaires répondent « L'enregistrement en ligne est
momentanément indisponible… écris-nous sur WhatsApp » : aucune fausse confirmation n'est affichée.

---

## 4. Configuration de Supabase

1. Créer un projet sur <https://supabase.com> (choisir une **région de l'Union européenne**).
2. *SQL Editor* → *New query* → coller le contenu de
   [`supabase/migrations/20261023000000_init.sql`](supabase/migrations/20261023000000_init.sql) → *Run*.
3. *Project Settings* → *API Keys* : copier l'URL du projet et la clé **secrète**.
4. Renseigner `SUPABASE_URL` et `SUPABASE_SECRET_KEY`, retirer `STORAGE_DRIVER=local`.
5. Redémarrer, envoyer un formulaire de test, vérifier la ligne dans *Table Editor* → `leads`.

Ce que crée la migration :

- tables `leads`, `registrations`, `marketing_opt_outs`, `rate_limits` ;
- **RLS activée sans aucune politique publique** : la clé publique (anon) n'a accès à rien ;
  privilèges retirés en plus pour `anon` / `authenticated` (défense en profondeur) ;
- fonctions `upsert_lead` (dédoublonnage par WhatsApp), `record_opt_out`, `hit_rate_limit`,
  réservées au rôle serveur ;
- contrainte qui **interdit une inscription « confirmée » sans vérification de paiement tracée** ;
- vue `funnel_by_source` (prospects / demandes / paiements par source) lisible dans Supabase Studio.

> La migration est testée automatiquement dans un PostgreSQL embarqué (`tests/sql`).
> Le pilote Supabase de l'application n'a **pas** pu être testé contre un vrai projet Supabase :
> faites l'essai de l'étape 5 avant la mise en ligne.

---

## 5. Parcours et statuts

```
Visiteur ──> /  (mini-atelier) ──> prospect enregistré ──> bouton WhatsApp
        └──> /formation ──> /inscription ──> demande enregistrée (référence CQ4-XXXXXX)
                                              │  cookie signé HttpOnly → /confirmation
                                              ▼
            request_received  « Demande d'inscription reçue »
                    │ (admin : instructions envoyées / paiement déclaré)
                    ▼
            payment_pending   « Paiement en attente de vérification »
                    │ (admin : référence de transaction + case « paiement effectivement reçu »)
                    ▼            ou futur prestataire de paiement (webhook signé)
            confirmed         « Inscription confirmée »
```

- Aucun paiement n'est simulé ; l'API ne peut jamais créer une inscription confirmée.
- La confirmation manuelle exige une référence de transaction et refuse tout ce qui ressemble à
  un numéro de carte ou à un IBAN (contrôles Luhn / IBAN) : **aucune donnée bancaire stockée**.

### Fermer les inscriptions

- Automatique : après `ENROLLMENT_DEADLINE` (par défaut 05/11/2026 23 h 59, Paris, veille du démarrage).
- Immédiat : `ENROLLMENT_OPEN=false` puis redéploiement.
- Effet : bandeau « inscriptions closes », CTA redirigés vers la démonstration gratuite, API qui
  refuse les demandes (contrôle en temps réel côté serveur).

---

## 6. Tableau de bord `/admin`

Connexion par mot de passe (cookie signé, 8 h, limité à `/admin`, 5 tentatives / 15 min).
Contenu : prospects collectés, demandes, paiements confirmés et chiffre d'affaires vérifié, taux de
conversion (prospect → demande, demande → paiement), sources d'acquisition (utm_source ou site
référent), difficultés déclarées, listes avec liens WhatsApp, changement de statut, confirmation de
paiement, exports CSV (compatibles Excel, protégés contre l'injection de formules).

Pour que les sources soient renseignées, utilisez des liens tagués dans vos publicités, par exemple :
`https://votre-site.fr/?utm_source=facebook&utm_medium=ads&utm_campaign=q4-novembre`.

---

## 7. Suivi des conversions et consentement

Les outils (GA4, pixel Meta, pixel TikTok) ne sont chargés **qu'après accord** via le bandeau
(boutons « Tout refuser », « Personnaliser », « Tout accepter » de même poids ; choix conservé
6 mois ; lien « Gérer les cookies » en pied de page). Sans outil configuré, aucun bandeau.

| Événement interne | GA4 | Meta | TikTok | Déclenchement | Dédoublonnage |
| --- | --- | --- | --- | --- | --- |
| `view_sales_page` | `view_item` | `ViewContent` | `ViewContent` | affichage de `/formation` | 1 fois par session |
| `cta_click` | `cta_click` | `CTAClick` (personnalisé) | `ClickButton` | clic sur un CTA (avec emplacement) | 1 fois par session et emplacement |
| `lead_submitted` | `generate_lead` | `Lead` | `SubmitForm` | prospect **réellement enregistré** | définitif, par prospect |
| `registration_requested` | `registration_request` | `SubmitApplication` | `SubmitForm` | demande **réellement enregistrée** | définitif, par demande |
| `payment_confirmed` | `purchase` | `Purchase` | `CompletePayment` | uniquement si un **prestataire réel** a confirmé | définitif, par inscription |

La correspondance est modifiable dans `src/lib/analytics/track.ts`. Les identifiants d'événement
Meta (`eventID`) sont prêts pour une future API Conversions côté serveur (emplacement prévu dans
`src/app/api/webhooks/payment/route.ts`).

---

## 8. Sécurité

- Validation zod côté navigateur **et** serveur ; numéros WhatsApp normalisés en E.164.
- Anti-robots : champ piège invisible + délai minimal de remplissage + limitation de débit
  (mémoire + compteur partagé en base sur Supabase ; IP jamais stockée en clair).
- Contrôle d'origine (anti-CSRF) et taille maximale des requêtes sur toutes les routes publiques.
- Cookies signés HMAC (usage séparé inscription / administration), HttpOnly, SameSite.
- En-têtes : CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS ; `/admin` et
  `/confirmation` en `noindex` et `no-store`.
- Messages d'erreur sans détail technique ; journaux serveur sans données personnelles.
- La limitation de débit suppose un hébergeur qui transmet l'IP (`X-Forwarded-For`, cas de Vercel et
  Netlify). Sans IP, un quota partagé élargi s'applique pour ne pas bloquer de vrais visiteurs.

---

## 9. Tests

```bash
npm run test          # 92 tests Vitest : validation, services, API, sécurité, suivi, garantie, SQL (PGlite)
npm run lint
npm run typecheck
npm run build
npm run test:e2e      # Playwright : build de prod + serveur de test sur le port 3100
```

Navigateur des tests de bout en bout : soit `npx playwright install chromium` (téléchargement
unique), soit un navigateur déjà installé :

```bash
PLAYWRIGHT_CHANNEL=msedge npm run test:e2e
```

(Sous PowerShell : `$env:PLAYWRIGHT_CHANNEL="msedge"; npm run test:e2e`.)

Couverture e2e (ordinateur + mobile) : page de capture (erreurs, enregistrement réel, attribution
UTM, lien WhatsApp sans donnée personnelle, rejet robot sans confirmation), page de vente (sections,
prix, dates, CTA, absence de fausse rareté, FAQ au clavier, SEO), parcours complet
demande → attente → confirmation par l'admin, refus d'un numéro de carte, export CSV, cookie
falsifié ignoré, consentement (refus/accord, dédoublonnage), accessibilité axe WCAG 2.1 AA sur
toutes les pages, absence de défilement horizontal, en-têtes de sécurité, robots/sitemap/OG.

---

## 10. Brancher un prestataire de paiement (plus tard)

Aucun prestataire n'est choisi (à vérifier selon votre statut, votre pays et la devise EUR).
Une fois choisi et testé en mode test :

1. créer `src/lib/payments/<prestataire>.ts` implémentant `PaymentProvider`
   (`createCheckout`, `verifyWebhook` avec **vérification de signature**) ;
2. le renvoyer depuis `getPaymentProvider()` dans `src/lib/payments/index.ts` ;
3. déclarer l'URL `https://votre-site/api/webhooks/payment` chez le prestataire ;
4. transmettre la référence `CQ4-XXXXXX` au paiement pour la retrouver dans le webhook.

Le service `applyProviderPayment` contrôle montant et devise, reste idempotent (notification
rejouée = pas de double confirmation) et marque la vérification « prestataire », ce qui déclenche
l'événement `payment_confirmed`. *Remarque : vous utilisez déjà Chariow pour d'autres produits ;
c'est une piste à vérifier (devise, webhooks « Pulses »), pas un choix.*

---

## 11. Modifier le contenu

Tout le texte commercial est dans `src/content/offer.ts` : prix, dates, programme, bonus
(`available: true` seulement quand le fichier existe), moyens de paiement, FAQ, textes de
consentement (versionnés). La garantie a son propre fichier, `src/content/guarantee.ts`
(section suivante).

### Garantie 60 jours — Contenu & Performance

Communication et conditions sont strictement séparées (fichier `src/content/guarantee.ts`) :

- **Page de vente** (`/formation`, entre « Comment ça se passe » et le tarif, composant
  `src/components/sales/GuaranteeSection.tsx`) : titre « Garantie 60 jours », principe
  (30 jours de mise en pratique en direct + 30 jours d'accompagnement individuel si nécessaire),
  « 297 € remboursés intégralement — Si tu n'obtiens pas de résultats », les 3 étapes, les 5 livrables
  couverts et le bouton d'inscription. Aucune obligation détaillée ni lien vers les CGV dans la section
  (les CGV restent accessibles depuis le pied de page et la case à cocher de l'inscription).
- **CGV**, article 7 « Conditions et modalités de la garantie 60 jours — Contenu & Performance »
  (ouvert par « La garantie 60 jours est soumise aux critères et modalités prévus au présent article ») :
  7.1 principe · 7.2 critères de participation · 7.3 publication quotidienne à heures planifiées ·
  7.4 exercices · 7.5 preuves · 7.6 suivi individuel · 7.7 critères pédagogiques (les 5 livrables) ·
  7.8 délais de réclamation · 7.9 remboursement · 7.10 portée (renvoi à l'article 8).

#### Décisions de la garantie

Toutes reprises dans l'article 7 des CGV (décisions des 25, 26 et 29/10/2026) :

| Clé | Article | Décision |
| --- | --- | --- |
| `attendance` | 7.2 | présence requise ; seules les absences non justifiées comptent ; 1re sans effet, 2e = perte du remboursement ; replay fourni, ne vaut pas présence |
| `absenceJustification` / `absenceProof` | 7.2 | maladie ou urgence ; justificatif sous 2 jours, oral, ou fichier numérique (PDF, image, vidéo) pour une demande de remboursement |
| `catchUp` | 7.2 | rattrapage uniquement si le formateur est absent |
| `productInformation` | 7.2 / 7.11 | responsabilité du participant ; article 7.11 sur les allégations produits |
| `dailyPublication` / `publicationRules` | 7.3 | 3 publications originales par jour sur chaque plateforme, tous les comptes ; stories et republications exclues ; pendant la formation, les 14 jours suivants et l'accompagnement ; 2 jours manqués au total = perte du remboursement |
| `publicationPeriod` / `publicationSchedule` | 7.3 | dès la mise en place du calendrier ; heures libres |
| `exercises` / `exerciseDeadlines` | 7.4 | obligatoires sans exception ; délai fixé par le formateur + 3 jours de tolérance |
| `proofs` / `attendanceProof` | 7.5 | captures ou liens, statistiques départ et fin, exercices, présence (établie par les deux parties) |
| `officialContacts` | 7.5 / 7.8 | tchankochirac@gmail.com ; WhatsApp +237 6 53 06 82 65 |
| `proofsRetention` / `incompleteClaim` | 7.5 | jusqu'à l'expiration du délai d'action liée au contrat ; demande incomplète refusée |
| `supportRequest` / `individualSupport` | 7.6 | demande dans les 14 jours après la formation en publiant chaque jour ; accompagnement de 30 jours sur WhatsApp à l'issue de ces 14 jours (non comptés dans les 60 jours) |
| `evaluation` / `competenceAssessment` | 7.7 | compétences acquises OU progression d'un indicateur (critères alternatifs) ; ventes exclues (simple « évolution ») ; évaluation par Tchanko Chirac en fin de formation et en fin d'accompagnement, résultat écrit sous 3 jours |
| `progressScope` / `progressPeriods` / `progressThreshold` | 7.7.3 | au moins 2 plateformes ; relevé au début de la formation ; vues et « J'aime » sur deux périodes de 28 jours ; abonnés en nombre total ; +10 % sur au moins un indicateur |
| `zeroBaselineMinimum` | 7.7.3 | indicateur parti de zéro : 50 abonnés pour les abonnés, 500 vues pour les vues |
| `claimDeadline` | 7.8 | 14 jours calendaires après la fin effective de l'accompagnement, par WhatsApp ou e-mail |
| `refundProcedure` / `refundDelay` | 7.9 | intégralité de la somme payée (297 €), sans déduction, sous 7 jours, par PayPal ou transfert |

Exemple de calendrier : formation du 6 novembre au 6 décembre 2026, période de pratique continue du
7 au 20 décembre, accompagnement du 21 décembre 2026 au 19 janvier 2027, réclamation possible jusqu'au
2 février 2027.

**Encore à décider** : plus aucune décision ouverte dans `pendingDecisions`. Reste à passer
`termsFinalized` à `true` (votre décision), puis `legalReviewDone` après relecture juridique.

Points de vigilance à faire trancher par un professionnel du droit :

- **équilibre de la garantie** : 3 publications originales par jour sur tous les comptes, y compris
  pendant les 14 jours et l'accompagnement, face à « Si tu n'obtiens pas de résultats » sur la page de
  vente : risque de publicité jugée trompeuse ou de clauses jugées déséquilibrées selon le statut des
  acheteurs (consommateurs ou professionnels) et les pays visés ;
- **« Garantie 60 jours »** : la page de vente indique « Jours 31 à 60 » pour l'accompagnement alors qu'il
  commence après 14 jours supplémentaires (74 jours au total) ; ces 14 jours ne figurent que dans les CGV ;
- **droit applicable camerounais** : effet réel envers des clients d'autres pays (réserve écrite à
  l'article 11) ;
- **données personnelles** : droit camerounais et, si des résidents de l'Union européenne sont visés,
  RGPD (y compris l'éventuel représentant dans l'UE) ; durée exacte de conservation des preuves ;
  transferts via WhatsApp et Gmail ;
- **médiation OHADA** : ne remplace pas un médiateur de la consommation exigé dans certains pays ;
- **TVA** : « sans TVA » à vérifier avec un comptable pour les clients de l'Union européenne ;
- **formulaire type de rétractation** : remis après le premier e-mail, alors que le droit européen
  attend qu'il soit fourni avant la conclusion du contrat.

Une fois les décisions renseignées : `termsFinalized: true`, puis, après relecture juridique,
`legalReviewDone: true` (ce drapeau n'est jamais affiché sur le site). Rien sur le site ne prétend que
la garantie a été validée juridiquement.

---

## 12. Mise en ligne

Hébergement conseillé : **Vercel** (support natif de Next.js 16, Cache Components et proxy).
Netlify fonctionne aussi via son adaptateur Next.js, à tester avant le lancement.
Suivre [`docs/CHECKLIST-MISE-EN-LIGNE.md`](docs/CHECKLIST-MISE-EN-LIGNE.md) et lancer :

```bash
npm run check:launch
```

---

## 13. Éléments à configurer manuellement

- [ ] Projet Supabase (région UE), migration SQL, clés dans l'hébergeur.
- [ ] `APP_SECRET`, `ADMIN_PASSWORD` de production (différents de ceux de développement).
- [ ] `NEXT_PUBLIC_SITE_URL` (domaine https) et `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- [x] Moyens de paiement acceptés : virement bancaire, PayPal, Mobile Money (prix unique de 297 €).
- [ ] Instructions de paiement à envoyer sur WhatsApp pour chacun des 3 moyens.
- [x] Mention TVA : « Prix sans TVA (prestataire établi au Cameroun) » (à vérifier avec un comptable
      pour les clients de l'UE).
- [ ] Mentions légales, politique de confidentialité, CGV : passages surlignés « À COMPLÉTER » restants
      (hébergeur, région Supabase, durées de conservation, transferts hors UE, autorité de contrôle,
      annulation de la formation par l'organisateur) + relecture par un professionnel.
- [ ] Validation juridique de la case « démarrage avant la fin du délai de rétractation ».
- [ ] Garantie 60 jours : toutes les décisions sont prises ; passer `termsFinalized` à `true` quand
      vous validez l'article 7, puis `legalReviewDone` après relecture juridique.
- [ ] Renseigner `NEXT_PUBLIC_WHATSAPP_NUMBER=237653068265` chez l'hébergeur pour activer les boutons
      WhatsApp du site.
- [ ] Valeurs des bonus (47 €, 37 €, 37 €, 27 €, 27 €) : conserver la justification de chaque montant
      (prix réellement pratiqué ou prix de référence vérifiable).
- [ ] Vérification de l'usage du nom « CHOGAN » (marque d'un tiers) et des règles de
      communication Chogan pour ses consultants.
- [x] Modalités des sessions : en ligne, Google Meet, lundi, mercredi, vendredi et dimanche, 2 h,
      début à 20 h ou 21 h (heure de Paris), replays (CGV article 1).
- [x] Rétractation : contact tchankochirac@gmail.com, formulaire envoyé par e-mail (CGV article 5).
- [x] Report de session par le formateur (CGV article 6).
- [x] Droit camerounais, médiation OHADA, juridictions du Cameroun (CGV article 11).
- [x] Éditeur : Tchanko Chirac, freelance, PK14 Douala – Cameroun, P06951842290Y (mentions légales).
- [ ] Contenu réel du mini-atelier et modalité d'envoi (aujourd'hui : manuelle sur WhatsApp).
- [ ] Fichiers des bonus, puis `available: true`.
- [ ] Identifiants GA4 / Meta / TikTok si souhaités.
- [ ] Prestataire de paiement (facultatif, voir section 10).

## 14. Non testé à ce stade (à vérifier en conditions réelles)

- Pilote Supabase contre un vrai projet (le SQL est testé ; les appels réseau ne le sont pas).
- Chargement réel de GA4, Meta et TikTok (testé avec un réseau simulé : seules les conditions de
  chargement et le dédoublonnage sont vérifiés).
- Ouverture effective des liens WhatsApp sur téléphone.
- Déploiement chez un hébergeur.
