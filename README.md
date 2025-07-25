# LinkerAI - Plateforme de Mise en Relation Clients-Développeurs IA

## 📋 Vue d'ensemble

LinkerAI est une plateforme web moderne qui connecte les clients ayant des projets d'intelligence artificielle avec des développeurs spécialisés. L'application facilite la mise en relation, la gestion de projets et la communication entre les parties prenantes.

### 🎯 Objectifs principaux
- **Mise en relation** : Connecter clients et développeurs IA
- **Gestion de projets** : Suivi complet du cycle de vie des projets
- **Communication** : Système de messagerie intégré
- **Profils détaillés** : Présentation complète des compétences et expériences
- **Multilingue** : Support français et anglais

## 🏗️ Architecture et Technologies

### **Stack Technique**
- **Frontend** : Next.js 14 (App Router)
- **Styling** : Tailwind CSS
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth
- **Déploiement** : Netlify
- **Langage** : TypeScript
- **Gestion d'état** : React Context API

### **Structure du Projet**
```
dev-client-matcher/
├── app/                    # Pages Next.js (App Router)
│   ├── auth/              # Authentification
│   ├── dashboard/         # Tableaux de bord
│   ├── developer/         # Pages développeur
│   ├── messages/          # Système de messagerie
│   └── projects/          # Gestion des projets
├── components/            # Composants React réutilisables
├── contexts/             # Contextes React (traductions, etc.)
├── lib/                  # Configuration et utilitaires
├── hooks/                # Hooks React personnalisés
├── types/                # Définitions TypeScript
└── public/               # Assets statiques
```

## 🚀 Installation et Configuration

### **Prérequis**
- Node.js 18+ 
- npm ou yarn
- Compte Supabase

### **Installation**
```bash
# Cloner le repository
git clone https://github.com/FaresBENAI/dev-client-matcher.git
cd dev-client-matcher

# Installer les dépendances
npm install

# Configuration des variables d'environnement
cp .env.example .env.local
```

### **Variables d'environnement**
Créer un fichier `.env.local` avec :
```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon_supabase
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### **Commandes de lancement**
```bash
# Développement
npm run dev

# Build de production
npm run build

# Démarrage en production
npm start

# Linting
npm run lint

# Type checking
npm run type-check
```

## 📁 Structure Détaillée des Fichiers

### **Pages Principales (`app/`)**

#### **Authentification (`app/auth/`)**
- `login/page.tsx` : Connexion utilisateur
- `signup/page.tsx` : Inscription avec choix du type (client/développeur)
- `forgot-password/page.tsx` : Récupération de mot de passe
- `callback/page.tsx` : Callback OAuth Supabase

#### **Tableaux de Bord (`app/dashboard/`)**
- `client/page.tsx` : Dashboard client avec projets et statistiques
- `developer/page.tsx` : Dashboard développeur avec candidatures
- `client/profile/page.tsx` : Profil client
- `developer/profile/page.tsx` : Profil développeur complet
- `client/projects/page.tsx` : Gestion des projets client
- `developer/applications/page.tsx` : Suivi des candidatures

#### **Projets (`app/projects/`)**
- `page.tsx` : Liste des projets avec filtres
- `[id]/page.tsx` : Détail d'un projet avec candidature
- `create/page.tsx` : Création de projet
- `[id]/edit/page.tsx` : Édition de projet

#### **Messagerie (`app/messages/`)**
- `page.tsx` : Interface de messagerie complète avec conversations

#### **Profils Développeurs (`app/developer/`)**
- `[id]/page.tsx` : Profil public développeur

### **Composants (`components/`)**

#### **Layout**
- `layout/unified-navbar.tsx` : Navigation principale avec notifications
- `layout/footer.tsx` : Pied de page
- `layout/header.tsx` : En-tête avec sélecteur de langue

#### **UI**
- `ui/info-popup.tsx` : Popups informatifs pour les opérations longues
- `ui/loading-spinner.tsx` : Indicateurs de chargement
- `ui/status-badge.tsx` : Badges de statut pour projets

#### **Formulaires**
- `forms/project-form.tsx` : Formulaire de création/édition de projet
- `forms/application-form.tsx` : Formulaire de candidature
- `forms/profile-form.tsx` : Formulaire de profil

#### **Cartes et Listes**
- `cards/project-card.tsx` : Carte de projet avec actions
- `cards/developer-card.tsx` : Carte de développeur
- `lists/project-list.tsx` : Liste des projets avec pagination

### **Contextes (`contexts/`)**
- `LanguageContext.tsx` : Gestion des traductions FR/EN
- `AuthContext.tsx` : État d'authentification global

### **Configuration (`lib/`)**
- `supabase.ts` : Configuration client Supabase
- `utils.ts` : Fonctions utilitaires
- `constants.ts` : Constantes de l'application

### **Types (`types/`)**
- `index.ts` : Définitions TypeScript globales
- `project.ts` : Types liés aux projets
- `user.ts` : Types utilisateur
- `message.ts` : Types de messagerie

## 🔧 Fonctionnalités Principales

### **Système d'Authentification**
- Inscription avec choix du type (client/développeur)
- Connexion sécurisée via Supabase Auth
- Récupération de mot de passe
- Sessions persistantes

### **Gestion des Profils**
#### **Profil Client**
- Informations entreprise
- Historique des projets
- Préférences de communication

#### **Profil Développeur**
- Compétences IA détaillées
- Portfolio et expériences
- Taux journalier (TJM) configurable
- Disponibilité et langues

### **Gestion des Projets**
- Création avec détails complets
- Statuts multiples (ouvert, en cours, terminé, etc.)
- Budget et délais
- Compétences requises
- Système de candidatures

### **Système de Messagerie**
- Conversations en temps réel
- Notifications push
- Historique complet
- Statuts de lecture

### **Système de Candidatures**
- Candidature avec message personnalisé
- Suivi des statuts
- Notifications automatiques
- Création automatique de conversation

## 🌐 Internationalisation

### **Système de Traduction**
- Support français et anglais
- Contextes React pour la gestion des langues
- Traductions complètes de l'interface
- Sélecteur de langue dans la navigation

### **Fichiers de Traduction**
- `contexts/LanguageContext.tsx` : Définitions des traductions
- Clés structurées par fonctionnalité
- Support des variables dynamiques

## 🎨 Interface Utilisateur

### **Design System**
- **Tailwind CSS** pour le styling
- **Composants réutilisables** et cohérents
- **Responsive design** mobile-first
- **Thème sombre/clair** (préparé)

### **Composants UI**
- Boutons avec états (normal, hover, loading, disabled)
- Formulaires avec validation
- Modales et popups
- Indicateurs de chargement
- Badges de statut

## 🔒 Sécurité

### **Authentification**
- Supabase Auth avec JWT
- Sessions sécurisées
- Protection des routes

### **Base de Données**
- RLS (Row Level Security) activé
- Politiques de sécurité par table
- Validation des données côté serveur

### **Validation**
- Validation TypeScript stricte
- Validation des formulaires côté client
- Sanitisation des entrées

## 📊 Base de Données (Supabase)

### **Tables Principales**
- `profiles` : Profils utilisateurs
- `projects` : Projets
- `project_applications` : Candidatures
- `conversations` : Conversations
- `messages` : Messages
- `ratings` : Évaluations

### **Relations**
- Un client peut avoir plusieurs projets
- Un développeur peut candidater à plusieurs projets
- Une conversation par candidature
- Messages liés aux conversations

## 🚀 Déploiement

### **Netlify**
- Déploiement automatique depuis GitHub
- Configuration dans `netlify.toml`
- Variables d'environnement configurées
- Redirections et headers de sécurité

### **Variables de Production**
- URLs Supabase de production
- Configuration des domaines
- Variables d'environnement sécurisées

## 🧪 Tests et Qualité

### **Linting**
- ESLint configuré
- Règles TypeScript strictes
- Formatage automatique

### **Type Checking**
- TypeScript strict
- Types définis pour toutes les entités
- Validation des props des composants

## 📈 Performance

### **Optimisations**
- Images optimisées avec Next.js
- Code splitting automatique
- Lazy loading des composants
- Cache des requêtes Supabase

### **Monitoring**
- Logs d'erreur
- Métriques de performance
- Suivi des utilisateurs

## 🔄 Workflow de Développement

### **Git**
- Branche main pour la production
- Commits conventionnels
- Pull requests pour les nouvelles fonctionnalités

### **Scripts Utilitaires**
- `deploy-production.sh` : Déploiement en production
- Scripts de nettoyage et maintenance
- Scripts de migration de base de données

## 🐛 Dépannage

### **Problèmes Courants**
1. **Erreurs Supabase** : Vérifier les variables d'environnement
2. **Problèmes de build** : Nettoyer le cache Next.js
3. **Erreurs TypeScript** : Vérifier les types et imports

### **Commandes de Dépannage**
```bash
# Nettoyer le cache
rm -rf .next
npm run build

# Vérifier les types
npm run type-check

# Linting
npm run lint
```

## 📚 Ressources et Documentation

### **Documentation Externe**
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### **Fichiers de Documentation**
- `CUSTOM_EMAIL_SETUP.md` : Configuration email personnalisée
- `NETLIFY_SETUP.md` : Configuration Netlify
- `DEVELOPER_FEATURES.md` : Fonctionnalités développeur

## 🤝 Contribution

### **Guidelines**
- Code TypeScript strict
- Tests pour les nouvelles fonctionnalités
- Documentation des changements
- Respect du style de code

### **Processus**
1. Fork du repository
2. Création d'une branche feature
3. Développement et tests
4. Pull request avec description détaillée
5. Review et merge

## 📞 Support

Pour toute question ou problème :
- Issues GitHub pour les bugs
- Discussions GitHub pour les questions
- Documentation détaillée dans ce README

---

**LinkerAI** - Connecter les talents IA avec les opportunités de projets.