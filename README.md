# 🚀 Portail d'Onboarding Client & Administration Executive - Nuvatech Solutions

Bienvenue sur le dépôt officiel du **Portail d'Onboarding Client** de **Nuvatech Solutions**.  
Cette application web moderne et interactive permet aux prospects de concevoir et chiffrer leur projet technique (Sites Web, Applications, Automatisations & API) via un formulaire intelligent en étapes. Elle intègre également une console d'administration sécurisée permettant aux administrateurs de gérer les briefs, de relancer les prospects, de surveiller les statistiques d'audience, de lire les logs d'erreurs en direct et de configurer l'application à chaud.

---

## ✨ Fonctionnalités Majeures

### 🧑‍💻 Côté Client / Formulaire d'Onboarding
* **Formulaire en 4 étapes** avec sauvegarde d'état persistante (`localStorage`) pour permettre de reprendre la saisie en cours.
* **Sélecteur de services dynamique** avec info-bulles (tooltips) descriptives adaptatives en fonction de l'état coché/décoché (en français et anglais).
* **Questions qualitatives et quantitatives personnalisées** (rôles, objectifs, complexité technique, intégrations tierces, délais, budgets cibles).
* **Gestion des pièces jointes et des liens de référence** pour étayer le brief technique.
* **Estimation de tarif en temps réel** (fourchette min/max) calculée de manière transparente à l'Étape 4.

### 🛡️ Côté Administrateur / Console Executive (`/admin`)
* **Gestion des Briefs** : Consultation des dossiers complets avec tri et filtres par statut (`Nouveau`, `En cours`, `Traité`).
* **Suivi des Prospects (Leads Étape 1)** : Capture automatique des contacts dès l'Étape 1. Les coordonnées de chaque prospect sont stockées pour permettre des relances par email pré-remplies en un clic.
* **Journal des Erreurs Client (Debug en direct)** : Capture globale des exceptions JavaScript et promesses rejetées côté client (`window.onerror`), stockées avec stack trace, URL et User-Agent pour un dépannage rapide.
* **Diagnostics & Trafic (Analytics)** : Statistiques en temps réel sur les visites totales, les visiteurs uniques et le taux de conversion global.
* **Ajustement Dynamique des Tarifs** : Panneau de configuration pour modifier à chaud les règles de prix (taux horaires, coûts fixes par fonctionnalité/plateforme).
* **Configuration Générale & Déploiement** :
  * Interrupteur de **Mode Maintenance** avec message d'accueil personnalisé.
  * Injecteurs dynamiques de **code CSS & JavaScript** personnalisés.
  * Remplacement à chaud des titres et sous-titres de bienvenue.
  * Personnalisation de l'email de support et limite de taille des fichiers joints.

---

## 🛠️ Stack Technique

* **Framework Core** : React 19 (StrictMode)
* **Design & Styling** : Tailwind CSS v4 & Vanilla CSS (Thème sombre haut de gamme, effet de verre / glassmorphism, animations fluides).
* **Animations** : Motion (Framer Motion)
* **Base de données / Backend** : Supabase (Client JS dégradé de manière transparente vers le stockage local si non configuré).
* **Icônes** : Lucide React
* **Outil de Build** : Vite

---

## 💾 Schéma de Base de Données (Supabase)

L'application s'appuie sur trois tables clés dans Supabase. Exécutez le script SQL suivant dans votre console Supabase (*SQL Editor*) pour créer l'infrastructure nécessaire et activer les règles de sécurité RLS :

```sql
-- ==========================================
-- 1. Table principale : client_onboardings
-- ==========================================
CREATE TABLE IF NOT EXISTS client_onboardings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_name TEXT NOT NULL,
    company_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    industry TEXT,
    project_types TEXT[] DEFAULT '{}',
    specifications JSONB DEFAULT '{}',
    complexity_level TEXT,
    delivery_deadline TEXT,
    client_target_budget NUMERIC DEFAULT 0,
    estimated_min_price NUMERIC DEFAULT 0,
    estimated_max_price NUMERIC DEFAULT 0,
    special_instructions TEXT,
    status TEXT DEFAULT 'Nouveau', -- 'Prospect', 'Nouveau', 'En cours', 'Traité'
    folder_ref TEXT UNIQUE NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE client_onboardings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts & updates" ON client_onboardings 
    FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 2. Table : error_logs (Debug)
-- ==========================================
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    stack TEXT,
    component TEXT,
    url TEXT,
    user_agent TEXT,
    status TEXT DEFAULT 'Nouveau', -- 'Nouveau', 'En cours', 'Résolu'
    fix_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts to error_logs" ON error_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all operations for error_logs" ON error_logs
    FOR ALL USING (true);

-- ==========================================
-- 3. Table : app_analytics (Clics & Visites)
-- ==========================================
CREATE TABLE IF NOT EXISTS app_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL, -- 'visit'
    visitor_id TEXT,
    referrer TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE app_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts to app_analytics" ON app_analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all operations for app_analytics" ON app_analytics
    FOR ALL USING (true);

-- ==========================================
-- 4. Table : app_settings (Configuration & Tarifs)
-- ==========================================
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read and admin write" ON app_settings 
    FOR ALL USING (true) WITH CHECK (true);
```

---

## 🚀 Installation & Lancement en local

### 1. Prérequis
Assurez-vous d'avoir installé [Node.js](https://nodejs.org/) (Version 18+ recommandée) sur votre machine.

### 2. Cloner le projet
```bash
git clone <votre-url-depot-github>
cd formulaire-nuvatech-solutions
```

### 3. Installer les dépendances
```bash
npm install
```

### 4. Configurer les variables d'environnement
Copiez le fichier d'exemple fourni pour créer votre fichier `.env` local :
```bash
cp .env.example .env
```
Éditez le fichier `.env` et complétez les valeurs de connexion à votre projet Supabase :
* `VITE_SUPABASE_URL` : L'URL de votre projet Supabase.
* `VITE_SUPABASE_ANON_KEY` : La clé publique anonyme (anon key) de votre projet.

### 5. Lancer le serveur de développement
```bash
npm run dev
```
L'application démarrera par défaut sur `http://localhost:3000/`.

---

## 📦 Build de Production

Pour compiler et optimiser l'application en vue de la déployer chez un hébergeur (Vercel, Netlify, Hostinger, Cloudflare Pages...) :
```bash
npm run build
```
Cette commande génère un répertoire `/dist` contenant l'ensemble des fichiers statiques optimisés (HTML, CSS, JS, Assets).

---

## 📁 Structure Majeure du Projet

```text
├── src/
│   ├── components/            # Composants partagés (ex: ProtectedRoute, ThemeSelector)
│   ├── features/
│   │   ├── admin/             # Interface Admin (AdminDashboard, AdminLogin)
│   │   └── onboarding/        # Composants du Formulaire (ClientInfoStep, ServiceSelectorStep, etc.)
│   ├── services/
│   │   ├── i18n.ts            # Fichier de traduction bilingue FR/EN
│   │   └── supabase.ts        # Requêtes et initialisation de la base de données
│   ├── types/
│   │   └── index.ts           # Typage TypeScript unifié de l'application
│   ├── App.tsx                # Contrôleur principal et routing
│   ├── index.css              # Feuille de style globale et tokens graphiques
│   └── main.tsx               # Point d'entrée de l'application React
├── index.html                 # Point d'accès HTML
├── .env.example               # Modèle de variables d'environnement
├── .gitignore                 # Fichiers à exclure de git
├── package.json               # Dépendances et scripts de build
└── tsconfig.json              # Configuration TypeScript
```

---

## 🔒 Sécurité & Bonnes Pratiques
* **Ne committez jamais le fichier `.env`** contenant vos identifiants ou clés de production. Le fichier `.gitignore` est déjà configuré pour ignorer tous les fichiers `.env` locaux.
* Modifiez les identifiants administrateurs par défaut et protégez les politiques Supabase dans votre tableau de bord Supabase en conditions réelles de production.

---
*Développé avec soin par l'équipe technique de Nuvatech Solutions.*
