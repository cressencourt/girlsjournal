# The Girls' Little Journal — redémarrage à zéro (version simplifiée)

Cette version est **volontairement sans aucun sous-dossier** : tous les
fichiers sont au même niveau. C'est fait exprès, pour que le
glisser-déposer sur GitHub (compliqué sur iPad) ne puisse plus mal
ranger les fichiers.

Suivez ces étapes **dans l'ordre**, sans en sauter.

## 1. Supprimer l'ancien dépôt GitHub (pour repartir propre)

1. Allez sur `github.com/VOTRE-NOM/girls-journal`.
2. Onglet **Settings** (du dépôt, tout en haut).
3. Tout en bas de la page : section rouge **"Danger Zone"** → **Delete this repository**.
4. Tapez le nom demandé pour confirmer, puis validez.

*(Si vous préférez garder l'ancien "au cas où", vous pouvez à la place en créer
un nouveau avec un nom différent, ex. `girls-journal-v2`, et l'utiliser à la
place dans les étapes suivantes.)*

## 2. Créer un nouveau dépôt GitHub

1. Bouton **+** en haut à droite → **New repository**.
2. Nom : `girls-journal`.
3. **Create repository**.
4. Sur la page qui suit, cliquez le lien bleu **"uploading an existing file"**.

## 3. Envoyer les fichiers (la bonne méthode sur iPad)

Cette fois, au lieu du glisser-déposer, utilisez le **sélecteur de fichiers**,
plus fiable sur iPad :

1. Sur la page GitHub d'upload, cherchez le texte **"choose your files"**
   (en bleu, dans la zone grise) — touchez-le. Ça ouvre l'app Fichiers.
2. Naviguez jusqu'au dossier décompressé de ce zip.
3. **Sélectionnez tous les fichiers** (appui long sur un fichier → "Sélectionner
   tout" en haut) : `index.html`, `main.jsx`, `App.jsx`, `index.css`,
   `supabaseClient.js`, `package.json`, `vite.config.js`, `tailwind.config.js`,
   `postcss.config.js`, `schema.sql`, `.env.example`, `.gitignore`, `README.md`.
4. Touchez **Add** / **Ouvrir** pour les envoyer vers GitHub.
5. Vérifiez sur la page GitHub que vous voyez bien la liste de **tous** ces
   fichiers un par un (pas un dossier qui les contiendrait).
6. Faites défiler en bas → **Commit changes** (bouton vert).

✅ **Vérification importante avant de continuer** : sur la page principale de
votre dépôt, vous devez voir directement `App.jsx`, `main.jsx`, `index.html`...
listés — **aucun dossier**. Si vous voyez un dossier, quelque chose a encore
mal été envoyé : recommencez l'étape 3.

## 4. Créer le projet Vercel (nouveau, propre)

1. Sur **vercel.com** → **Add New...** → **Project**.
2. Trouvez `girls-journal` dans la liste → **Import**.
3. Ne touchez à rien dans "Root Directory" (laissez-le vide/par défaut).
4. Section **Environment Variables** → ajoutez :
   - `VITE_SUPABASE_URL` → `https://nqrguboqsqsuyitqlang.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` → votre clé "Publishable key" (`sb_publishable_...`)
5. Vérifiez que la case **Production** est cochée pour les deux.
6. Cliquez **Deploy**.

## 5. Tester

1. Attendez 1-2 minutes, puis ouvrez le lien fourni par Vercel.
2. Si tout va bien : le dashboard s'affiche avec "Girl 1" / "Girl 2".
3. Si quelque chose ne va toujours pas : le site affichera maintenant un
   **encadré rouge avec le message d'erreur exact** (au lieu d'une page
   blanche) — faites-en une capture et envoyez-la, ça permettra de
   corriger précisément le bon fichier.

## Base de données Supabase

Le script `schema.sql` de ce dossier a déjà été exécuté normalement lors de
la première tentative (vous avez eu "Success. No rows returned" dans
Supabase) — pas besoin de le relancer, sauf si vous avez aussi recréé un
nouveau projet Supabase. Si vous n'êtes pas sûre, vous pouvez le relancer
sans risque : le script est conçu pour ne rien casser si on l'exécute
plusieurs fois.

## Remplacer les prénoms d'exemple

Une fois le site en ligne et fonctionnel, ouvrez `App.jsx` sur GitHub,
cherchez `defaultData()` tout en haut, et remplacez "Girl 1" / "Girl 2" et
les informations d'exemple par les vraies. Cela ne sert que pour le tout
premier chargement (avant que la base Supabase ait des données) — ensuite,
tout se modifie directement dans le site.
