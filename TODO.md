# Study Hall — Setup & Deploy Teendők

## 1. API Kulcsok

### Google AI Studio (elsődleges LLM)
1. Menj: https://aistudio.google.com
2. Kattints: **Get API key** → **Create API key**
3. Másold be `.env.local`-ba:
   ```
   GOOGLE_AI_KEY=AIzaSy...
   GOOGLE_STANDARD_MODELS=gemini-2.5-flash-lite
   GOOGLE_PREMIUM_MODELS=gemini-2.5-flash
   ```

### Groq (ingyenes LLM fallback)
1. Menj: https://console.groq.com
2. Bal menü: **API Keys** → **Create API Key**
3. Másold be `.env.local`-ba:
   ```
   GROQ_API_KEY=gsk_...
   ```

### OpenRouter (2. fallback)
1. Menj: https://openrouter.ai → regisztráció
2. **Keys** → **Create Key**
3. Másold be `.env.local`-ba:
   ```
   OPENROUTER_API_KEY=sk-or-...
   ```

---

## 2. Firebase beállítása

### 2.1 Projekt létrehozása
1. Menj: https://firebase.google.com → **Go to console**
2. **Add project** → névnek pl. `study-hall` → Continue
3. Google Analytics: opcionális → **Create project**

### 2.2 Authentication engedélyezése
1. Firebase Console → **Authentication** → **Get started**
2. **Sign-in method** fül → **Google** → Enable → **Save**
3. Support email: add meg a saját email-ed

### 2.3 Kliens SDK konfig (NEXT_PUBLIC_* változók)
1. Firebase Console → **Project Settings** (fogaskerék ikon) → **General** fül
2. Görgetés le: **Your apps** → kattints: **</>** (Web app)
3. App nickname: `study-hall-web` → **Register app**
4. Másold ki az értékeket `.env.local`-ba:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=study-hall-xxx.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=study-hall-xxx
   ```

### 2.4 Admin SDK kulcs (szerver oldali)
1. Firebase Console → **Project Settings** → **Service accounts** fül
2. **Generate new private key** → **Generate key** → JSON letöltés
3. A letöltött JSON-ból másold ki az értékeket `.env.local`-ba:
   ```
   FIREBASE_PROJECT_ID=study-hall-xxx
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@study-hall-xxx.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
   ```
   > ⚠️ A `FIREBASE_PRIVATE_KEY` értéket idézőjelek közé tedd, és a `\n` karakterek maradjanak benne!

---

## 3. .env.local összerakása

```bash
cd "C:\Users\Felhasználó\Desktop\Studying website\study-hall"
cp .env.example .env.local
```

Nyisd meg `.env.local`-t és töltsd ki az összes mezőt:

```env
# Google AI Studio
GOOGLE_AI_KEY=AIzaSy...
GOOGLE_STANDARD_MODELS=gemini-2.5-flash-lite
GOOGLE_PREMIUM_MODELS=gemini-2.5-flash

# Groq (fallback)
GROQ_API_KEY=gsk_...

# OpenRouter (fallback)
OPENROUTER_API_KEY=sk-or-...

# Firebase Admin (szerver)
FIREBASE_PROJECT_ID=study-hall-xxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@study-hall-xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firebase kliens (böngésző)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=study-hall-xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=study-hall-xxx

# Admin hozzáférés (vesszővel elválasztva több email is megadható)
ADMIN_EMAILS=daniel.racz@aliz.ai
```

### Helyi teszt
```bash
npm run dev
```
- Nyisd meg: http://localhost:3000/admin/login
- Jelentkezz be Google-fiókkal
- Ha `/admin/upload`-ra dob vissza → minden működik ✓

---

## 4. GCP Cloud Run deploy

### 4.1 GCP projekt létrehozása
1. Menj: https://console.cloud.google.com
2. Fent bal: projekt választó → **New Project**
3. Projektnév: `study-hall` → **Create**
4. **Billing** menü → fizetési mód hozzáadása (Cloud Run ingyenes tierje elég kis forgalomnál)
5. Keresés: **Cloud Run API** → **Enable**
6. Keresés: **Cloud Build API** → **Enable**

### 4.2 gcloud CLI telepítése
1. Letöltés: https://cloud.google.com/sdk/docs/install
2. Telepítés után:
   ```bash
   gcloud init
   # → bejelentkezés Google-fiókkal
   # → projekt: study-hall (amit létrehoztál)
   # → régió: europe-west1 (Belgium, EU-közel)
   ```

### 4.3 Deploy
```bash
cd "C:\Users\Felhasználó\Desktop\Studying website\study-hall"

gcloud run deploy study-hall \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --timeout 60
```
> Az első deploy ~5-10 percet vesz igénybe. A végén kiír egy URL-t: `https://study-hall-xxx.run.app`

### 4.4 Környezeti változók beállítása Cloud Run-ban
1. Cloud Run Console → **study-hall** service → **Edit & Deploy New Revision**
2. **Variables & Secrets** fül → **Add Variable**
3. Add hozzá az összes `.env.local`-beli változót egyenként
   > ⚠️ `FIREBASE_PRIVATE_KEY`-nél az értéket idézőjelek **nélkül** add meg, de a `\n` karakterek maradjanak benne

### 4.5 Firebase Authorized domains frissítése
1. Firebase Console → **Authentication** → **Settings** fül → **Authorized domains**
2. **Add domain** → másold be a Cloud Run URL-t: `study-hall-xxx.run.app`

---

## 5. Végső ellenőrzés

- [ ] `https://study-hall-xxx.run.app` megnyílik
- [ ] `/admin/login` → Google bejelentkezés működik
- [ ] Bejelentkezés után `/admin/upload`-ra irányít
- [ ] Főoldal (tanulói nézet) elérhető bejelentkezés nélkül
- [ ] Kvíz / flashcard funkciók működnek

---

## 6. Opcionális: Custom domain

1. Cloud Run Console → **study-hall** → **Manage Custom Domains** → **Add mapping**
2. Kövesd a DNS beállítási útmutatót (CNAME / A record a domain regisztrátornál)
