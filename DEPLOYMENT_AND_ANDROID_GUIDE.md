# ROKTO DATA (রক্তদাতা) — Web Deployment & Android Build Guide
**Nationwide Voluntary Blood Donor Network for Bangladesh (৬৪ জেলা)**
**Platform Architecture:** React 19 + TypeScript + Express Full-Stack Server + Supabase PostgreSQL (PostGIS) + Firebase Cloud Messaging (FCM) + PWA + Capacitor Android

---

## 1. System Architecture Overview

ROKTO DATA is engineered as a secure, full-stack, mobile-first responsive web application with progressive web app (PWA) installability and native Android packaging readiness.

| Layer | Technology | Production Configuration |
|---|---|---|
| **Frontend UI** | React 19, TypeScript, Tailwind CSS v4, Lucide Icons | Compiled via Vite, client PWA service worker enabled |
| **Backend API** | Node.js Express server (`server.ts`) | Port 3000, Vite middleware in dev, static production serving |
| **Database** | Supabase PostgreSQL + PostGIS | 15 relational tables with PostGIS geography indexing & strict RLS |
| **Auth** | Supabase Auth (SMS OTP & Google OAuth) | E.164 Bangladesh Phone (+880) normalization & validation |
| **Maps** | OpenStreetMap with Leaflet.js | Tile caching, privacy fuzzing (~300m jitter), centroid routing |
| **Push Alerts** | Firebase Cloud Messaging (FCM) + In-App Engine | Rate-limited (60s cooldown), token batching (≤100), privacy scrubbed |
| **Mobile Runtime** | PWA + Capacitor Android wrapper | Installable via Web APK / Google Play Store (.aab) |

---

## 2. Environment Variables Specification

Create `.env` in the project root:

```env
# Server Runtime
PORT=3000
NODE_ENV=production
APP_URL=https://roktodata.org.bd

# Supabase PostgreSQL Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Server-side only! Never expose to client.

# Firebase Cloud Messaging (Server-side Push)
FIREBASE_PROJECT_ID=rokto-data-bd
FIREBASE_SERVER_KEY=AAAA...your-legacy-or-fcm-v1-key...
# Alternatively, point to service account credentials:
# GOOGLE_APPLICATION_CREDENTIALS=/app/service-account.json

# PWA / Client Controls
DISABLE_HMR=true
```

---

## 3. Web Production Deployment

### Option A: Docker Container (Recommended)

1. Create `Dockerfile` in the root:
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/src/data ./src/data
COPY --from=builder /app/src/types ./src/types
COPY --from=builder /app/src/services ./src/services
EXPOSE 3000
CMD ["npx", "tsx", "server.ts"]
```

2. Build and run container:
```bash
docker build -t roktodata:latest .
docker run -d -p 3000:3000 --env-file .env --name roktodata_app roktodata:latest
```

### Option B: Google Cloud Run Deployment

```bash
# Authenticate and set GCP Project
gcloud auth login
gcloud config set project your-gcp-project-id

# Build container and deploy to Cloud Run
gcloud builds submit --tag gcr.io/your-gcp-project-id/roktodata
gcloud run deploy roktodata \
  --image gcr.io/your-gcp-project-id/roktodata \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,PORT=3000
```

---

## 4. Supabase Database Deployment & RLS Verification

1. In your Supabase Dashboard, go to **SQL Editor**.
2. Run the migration file:
   `/supabase/migrations/20260212000000_rokto_data_init.sql`
3. Verify the 15 tables and PostGIS extension:
   ```sql
   -- Verify PostGIS extension
   SELECT postgis_version();

   -- Verify all 15 tables have Row-Level Security enabled
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```
4. Verify Security Definer RPCs:
   - `public.match_donors_nearby` (PostGIS spatial radius search)
   - `public.assign_user_role` (Strict Super Admin permission escalation guard)
   - `public.is_super_admin` & `public.is_moderator`

---

## 5. Android Build Instructions (Capacitor Native APK/AAB)

ROKTO DATA is configured with standard Progressive Web App compliance and is 100% ready to package into an Android app using Capacitor.

### Step 1: Install Capacitor Android Dependencies
```bash
npm install @capacitor/core
npm install -D @capacitor/cli @capacitor/android @capacitor/geolocation @capacitor/push-notifications @capacitor/app @capacitor/status-bar
```

### Step 2: Initialize Capacitor Configuration
Create `capacitor.config.ts`:
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'bd.gov.roktodata',
  appName: 'রক্তদাতা (ROKTO DATA)',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
```

### Step 3: Generate Web Assets and Initialize Android Project
```bash
# Build production web bundle
npm run build

# Add Android native platform
npx cap add android

# Synchronize assets and plugins
npx cap sync android
```

### Step 4: Configure `android/app/src/main/AndroidManifest.xml`
Ensure the following permissions are present inside `<manifest>`:
```xml
<!-- Network & Offline -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Approximate & GPS Geolocation -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-feature android:name="android.hardware.location.gps" android:required="false" />

<!-- FCM Push Notifications (Android 13+) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

### Step 5: Build Debug & Release APK / AAB
```bash
# Open project in Android Studio
npx cap open android

# Or build directly via Gradle:
cd android
./gradlew assembleDebug    # Generates debug APK: android/app/build/outputs/apk/debug/app-debug.apk
./gradlew bundleRelease    # Generates signed bundle for Play Store (.aab)
```

---

## 6. Pre-Launch Quality & Security Checklist

- [x] **No Secret Leaks:** Client-side bundles contain zero instances of `SUPABASE_SERVICE_ROLE_KEY` or database master passwords.
- [x] **Strict Privilege Escalation Defense:** Normal users cannot self-assign administrative roles via client mutations. Role assignment requires `super_admin` security-definer execution.
- [x] **District Scope Restraint:** District administrators are hard-restricted to their assigned district scope by server API and PostGIS filters.
- [x] **Privacy Protection:** Donor home GPS coordinates are fuzzed by ~300 meters; unmasked donor phone numbers are shielded behind authenticated consent logging.
- [x] **Medical Disclaimer:** Visible and acknowledged throughout request creation and donor registration.
- [x] **PWA Installability:** Complete Web App Manifest with 192px and 512px icons, maskable icons, and in-app install banner.
