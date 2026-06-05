/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Cpu,
  Zap,
  Bot,
  Database,
  Lock,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import {
  ServiceType,
  WebsiteDetails,
  ApplicationDetails,
  AutomationDetails,
  INITIAL_WEBSITE_DETAILS,
  INITIAL_APPLICATION_DETAILS,
  INITIAL_AUTOMATION_DETAILS
} from '../../../types/index';
import { motion, AnimatePresence } from 'motion/react';
import { t, Language } from '../../../services/i18n';

interface DynamicQuestionsStepProps {
  selectedServices: Record<ServiceType, boolean>;
  webDetails: WebsiteDetails;
  appDetails: ApplicationDetails;
  autoDetails: AutomationDetails;
  setWebDetails: (details: WebsiteDetails) => void;
  setAppDetails: (details: ApplicationDetails) => void;
  setAutoDetails: (details: AutomationDetails) => void;
  onNext: () => void;
  onBack: () => void;
  lang: Language;
}

// Preset getters for internationalized options list
const getWebTypes = (lang: Language) => [
  { id: 'vitrine', label: t('web_type_vitrine', lang), desc: t('web_type_vitrine_desc', lang) },
  { id: 'ecommerce', label: t('web_type_ecommerce', lang), desc: t('web_type_ecommerce_desc', lang) },
  { id: 'portfolio', label: t('web_type_portfolio', lang), desc: t('web_type_portfolio_desc', lang) },
  { id: 'landing', label: t('web_type_landing', lang), desc: t('web_type_landing_desc', lang) },
];

const getSignDesigns = (lang: Language) => [
  { id: 'custom', label: t('web_design_custom', lang), desc: t('web_design_custom_desc', lang) },
  { id: 'template', label: t('web_design_template', lang), desc: t('web_design_template_desc', lang) },
];

const getWebFeatures = (lang: Language) => [
  { id: 'contact', title: lang === 'en' ? 'Contact Form / Estimate' : 'Formulaire de contact / Devis', desc: lang === 'en' ? 'Guided customer contact' : 'Prise de contact client guidée' },
  { id: 'multilang', title: lang === 'en' ? 'Multi-language (FR, EN, ...)' : 'Multi-langues (FR, EN, ...)', desc: lang === 'en' ? 'Global translation management' : 'Gestion de traduction globale' },
  { id: 'payment', title: lang === 'en' ? 'Online Payment Module' : 'Module de Paiement en ligne', desc: lang === 'en' ? 'Secure Stripe, PayPal, Card' : 'Stripe, PayPal, CB sécurisé' },
  { id: 'seo', title: lang === 'en' ? 'SEO Optimized Out of the Box' : "SEO Optimisé d'entrée", desc: lang === 'en' ? 'Advanced organic indexing' : 'Indexation naturelle avancée' },
  { id: 'blog', title: lang === 'en' ? 'Blog / News Section' : 'Espace Blog / Actualités', desc: lang === 'en' ? 'Article publishing interface' : "Interface de publication d'articles" },
];

const getAppPlatforms = (lang: Language) => [
  { id: 'web', title: lang === 'en' ? 'SaaS / Web Platform' : 'SaaS / Plateforme Web', desc: lang === 'en' ? 'Desktop/mobile browser access' : 'Accès par navigateur de bureau/mobile' },
  { id: 'ios', title: lang === 'en' ? 'iOS App (Apple)' : 'Application iOS (Apple)', desc: lang === 'en' ? 'Native version for App Store' : 'Version native pour l\'App Store' },
  { id: 'android', title: lang === 'en' ? 'Android App (Google)' : 'Application Android (Google)', desc: lang === 'en' ? 'Native version on Google Play' : 'Version native sur Google Play' },
];

const getAppIntegrations = (lang: Language) => [
  { id: 'stripe', title: lang === 'en' ? 'Stripe Payment (Subscriptions / Purchases)' : 'Paiement Stripe (Abonnements / Achats)', desc: lang === 'en' ? 'Recurring payments support' : 'Prise en charge récurrences' },
  { id: 'maps', title: lang === 'en' ? 'Interactive Maps / Mapping' : 'Cartographie / Map interactive', desc: lang === 'en' ? 'GPS points generation' : 'Génération de points GPS' },
  { id: 'calendar', title: lang === 'en' ? 'Calendar & Booking system' : 'Agenda & Booking system', desc: lang === 'en' ? 'Online appointment booking' : 'Prise de rendez-vous en ligne' },
  { id: 'custom-api', title: lang === 'en' ? 'External Business API' : 'API Métier Externe', desc: lang === 'en' ? 'Sync with third-party ERP, CRM' : 'Synchronisation avec ERP, CRM tiers' },
];

const getAutoSystems = (lang: Language) => [
  { id: 'crm', label: 'Hubspot / Salesforce (CRM)' },
  { id: 'sheets', label: 'Google Sheets / Drive' },
  { id: 'slack', label: 'Slack & Teams' },
  { id: 'stripe', label: lang === 'en' ? 'Stripe / Invoicing Tools' : 'Stripe / Outils de Facturation' },
  { id: 'emails', label: lang === 'en' ? 'Gmail / Mailchimp (Emailing)' : 'Gmail / Mailchimp (E-mailing)' },
];

const getAutoTypes = (lang: Language) => [
  { id: 'leads', title: lang === 'en' ? 'Lead Triage' : 'Triage de leads', desc: lang === 'en' ? 'Form retrieval and routing' : 'Récupération et distribution de formulaires' },
  { id: 'chatbot', title: lang === 'en' ? 'Autonomous AI Assistant' : 'Assistant IA autonome', desc: lang === 'en' ? 'Smart customer service via chat' : 'Service client intelligent par chat' },
  { id: 'reporting', title: lang === 'en' ? 'Automated Reporting' : 'Rapports automatisés', desc: lang === 'en' ? 'Data aggregation and activity summary' : 'Agrégation de données et synthèse d\'activité' },
  { id: 'sync', title: lang === 'en' ? 'Database-to-Database Sync' : 'Base-to-Base sync', desc: lang === 'en' ? 'Automatic data sync between tools' : 'Mappage automatique de données d\'un outil à un autre' },
];

export default function DynamicQuestionsStep({
  selectedServices,
  webDetails,
  appDetails,
  autoDetails,
  setWebDetails,
  setAppDetails,
  setAutoDetails,
  onNext,
  onBack,
  lang,
}: DynamicQuestionsStepProps) {
  const enabledTabs = (Object.keys(selectedServices) as ServiceType[]).filter(
    (key) => selectedServices[key]
  );

  const [activeTab, setActiveTab] = useState<ServiceType>(enabledTabs[0] || 'website');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const getTooltipText = (id: string, isChecked: boolean): string => {
    const isEn = lang === 'en';
    switch (id) {
      // Web Features
      case 'contact':
        return isChecked
          ? (isEn ? "Unchecking removes the contact form. Visitors will have to draft and send emails to you manually."
                  : "En décochant, vous retirez le formulaire de contact. Vos visiteurs devront vous envoyer un email classique manuellement.")
          : (isEn ? "Enables a guided contact or quote request form to convert visitors into prospective customers."
                  : "Permet d'ajouter un formulaire de contact ou de demande de devis guidé pour convertir vos visiteurs en clients.");
      case 'multilang':
        return isChecked
          ? (isEn ? "Unchecking makes the site single-language. You might miss out on international or multi-lingual audiences."
                  : "En décochant, votre site sera unilingue. Vous passerez à côté de visiteurs parlant une autre langue.")
          : (isEn ? "Adds multi-language switching to display your site in French, English, and more, expanding your market."
                  : "Ajoute la traduction multi-langues pour présenter votre site en français, anglais, etc. et toucher un plus large marché.");
      case 'payment':
        return isChecked
          ? (isEn ? "Unchecking removes online checkout. You will have to invoice clients manually via bank transfers or checks."
                  : "En décochant, vous ne pourrez pas recevoir de paiements directs en ligne. Vous devrez facturer par virement ou chèque.")
          : (isEn ? "Integrates a secure credit card, Stripe, or PayPal checkout to process orders or deposits instantly."
                  : "Intègre un module de paiement sécurisé (CB, Stripe, PayPal) pour encaisser des réservations ou acomptes immédiatement.");
      case 'seo':
        return isChecked
          ? (isEn ? "Unchecking removes advanced SEO setup. Your site will take significantly longer to rank on search engines."
                  : "En décochant, le référencement naturel ne sera pas optimisé en priorité. Votre site mettra plus de temps à être visible.")
          : (isEn ? "Optimizes the site structure, tags, and speed for maximum visibility on Google search results."
                  : "Optimise la structure technique du site pour être indexé au mieux sur Google et apparaître dans les premiers résultats.");
      case 'blog':
        return isChecked
          ? (isEn ? "Unchecking removes the news section. You won't have an integrated interface to post regular updates."
                  : "En décochant, vous ne disposerez pas d'espace d'actualités pour animer votre site et fidéliser vos lecteurs.")
          : (isEn ? "Adds a blog or news publishing interface to share articles, build authority, and boost organic traffic."
                  : "Ajoute un module d'actualités/blog pour publier des articles réguliers, fidéliser votre audience et booster votre SEO.");

      // App Platforms
      case 'web':
        return isChecked
          ? (isEn ? "Unchecking will remove web browser support. Your app won't be accessible via desktop/mobile browsers."
                  : "En décochant, vos utilisateurs n'auront pas d'accès simple par navigateur. L'outil sera limité.")
          : (isEn ? "Enables a SaaS or web platform accessible instantly via any web browser on desktop and mobile."
                  : "Permet de rendre votre application accessible depuis n'importe quel navigateur sur ordinateur ou smartphone.");
      case 'ios':
        return isChecked
          ? (isEn ? "Unchecking removes the native iOS version. You will lose App Store presence and native push notification capabilities."
                  : "En décochant, vous perdez la présence sur l'écosystème Apple et l'accès aux notifications natives iOS.")
          : (isEn ? "Develops a native iOS app downloadable on Apple App Store, offering perfect speed and offline support."
                  : "Permet de concevoir une application native iOS disponible sur l'App Store, offrant une fluidité et réactivité maximale.");
      case 'android':
        return isChecked
          ? (isEn ? "Unchecking removes the native Android version. Your app won't be listed on the Google Play Store."
                  : "En décochant, vous vous privez de l'audience des smartphones Android et de la publication sur le Play Store.")
          : (isEn ? "Develops a native Android app published on the Google Play Store to reach the largest smartphone user base."
                  : "Permet de concevoir une version native Android publiée sur Google Play Store, ciblant la majorité des smartphones.");

      // App Auth & Database
      case 'app-auth':
        return isChecked
          ? (isEn ? "Unchecking makes the app public to everyone. You won't have private user accounts, dashboards, or secure areas."
                  : "En décochant, votre application sera accessible à tous publiquement, sans espace personnel sécurisé pour vos utilisateurs.")
          : (isEn ? "Creates a secure login gateway, enabling personal accounts, role permissions (admin, staff, client) and data isolation."
                  : "Sécurise l'accès à la plateforme avec un espace membre personnel (identifiants uniques, rôles, droits).");
      case 'app-db':
        return isChecked
          ? (isEn ? "Unchecking makes the app statical. No settings, user entries, files, or records can be saved."
                  : "En décochant, aucune donnée utilisateur ne pourra être sauvegardée. L'application ne sera qu'une interface statique.")
          : (isEn ? "Connects a secure SQL database to store profiles, configurations, and historical records over time."
                  : "Indispensable pour stocker durablement les données des utilisateurs, les configurations, et l'historique.");

      // App Integrations
      case 'stripe':
        return isChecked
          ? (isEn ? "Unchecking disables automated checkout. You will have to bill users manually and handle failures ourselves."
                  : "En décochant, vous perdez l'automatisation des abonnements. Vous devrez gérer les factures et relances à la main.")
          : (isEn ? "Integrates Stripe to support recurring subscriptions, trials, coupons, and automatic invoice generation."
                  : "Permet de mettre en place des abonnements récurrents ou des achats uniques en quelques clics via Stripe.");
      case 'maps':
        return isChecked
          ? (isEn ? "Unchecking removes maps. You won't be able to display addresses or compute GPS routes visually."
                  : "En décochant, vous ne pourrez pas afficher de cartes visuelles ou de coordonnées géographiques interactives.")
          : (isEn ? "Adds interactive maps (Google Maps/Mapbox) to show locations, track addresses, or manage delivery areas."
                  : "Affiche des cartes interactives pour localiser des points d'intérêt, gérer des trajets ou afficher des adresses.");
      case 'calendar':
        return isChecked
          ? (isEn ? "Unchecking disables online calendar bookings. Users will have to schedule appointments by phone or email."
                  : "En décochant, vos clients ne pourront pas réserver de rendez-vous directement. Vous devrez le faire par téléphone.")
          : (isEn ? "Integrates an automated scheduler for clients to book slots, sync calendars, and send automatic reminders."
                  : "Permet aux utilisateurs de réserver des créneaux horaires en ligne et de se synchroniser avec Google Calendar.");
      case 'custom-api':
        return isChecked
          ? (isEn ? "Unchecking isolates the app. You will need to type data manually into your external ERP/CRM systems."
                  : "En décochant, votre application sera isolée. Vous devrez saisir manuellement les données dans vos autres logiciels.")
          : (isEn ? "Builds secure API bridges to sync data instantly with your existing corporate ERP, CRM, or accounting software."
                  : "Permet d'échanger des données en temps réel avec vos logiciels existants (Salesforce, SAP, ERP d'entreprise).");

      // Automation Systems
      case 'crm':
        return isChecked
          ? (isEn ? "Unchecking disables CRM updates. You risk losing leads or having outdated customer sheets."
                  : "En décochant, vos leads et données clients ne seront pas synchronisés dans le CRM. Risque de perte d'informations.")
          : (isEn ? "Automatically syncs contact details and interest levels directly into Salesforce or HubSpot CRM."
                  : "Permet d'insérer ou mettre à jour automatiquement vos fiches clients dans votre outil CRM à chaque événement.");
      case 'sheets':
        return isChecked
          ? (isEn ? "Unchecking disables Sheets syncing. You will have to export and copy data manually into spreadsheets."
                  : "En décochant, vous devrez extraire et recopier manuellement les données d'activité dans vos feuilles de calcul.")
          : (isEn ? "Instantly adds or updates rows in Google Sheets or Excel Online on every new submission or action."
                  : "Idéal pour exporter et mettre à jour automatiquement vos tableaux Excel ou Google Sheets sans copier-coller.");
      case 'slack':
        return isChecked
          ? (isEn ? "Unchecking disables internal alerts. Your team won't be notified in real-time when clients take actions."
                  : "En décochant, vos collaborateurs ne seront pas prévenus immédiatement en cas de nouvelle vente ou demande.")
          : (isEn ? "Pushes real-time alerts to Slack or Microsoft Teams channels to keep your team informed instantly."
                  : "Envoie des notifications instantanées dans vos canaux Slack ou Teams pour alerter vos équipes d'un nouvel événement.");
      case 'auto-stripe':
        return isChecked
          ? (isEn ? "Unchecking disables automated billing. You'll need to manually raise invoices for every trade."
                  : "En décochant, vous devrez créer, valider et envoyer chaque facture manuellement à vos clients.")
          : (isEn ? "Connects payment gateways with bookkeeping tools to automatically issue legal invoices upon payments."
                  : "Génère et envoie automatiquement une facture légale dans votre outil comptable dès qu'un paiement est reçu.");
      case 'emails':
        return isChecked
          ? (isEn ? "Unchecking disables auto-responder mailing. You will need to draft and send welcome emails manually."
                  : "En décochant, vous devrez envoyer chaque email de bienvenue et gérer vos listes d'envoi de courriels à la main.")
          : (isEn ? "Automates email campaigns (Gmail/Mailchimp) sending onboarding tips or sequences to new signups."
                  : "Envoie automatiquement des séquences d'emails personnalisés ou inscrit les contacts dans votre newsletter.");

      // Automation Types
      case 'leads':
        return isChecked
          ? (isEn ? "Unchecking will stop smart triage. All inbound requests will land unclassified in a single inbox."
                  : "En décochant, tous les leads arriveront en vrac dans une boîte mail unique et devront être triés à la main.")
          : (isEn ? "Automatically reviews, scores, and routes inbound requests to the appropriate team member."
                  : "Qualifie et distribue automatiquement les nouveaux contacts au bon commercial en fonction de critères précis.");
      case 'chatbot':
        return isChecked
          ? (isEn ? "Unchecking removes the 24/7 AI chat. Visitors will have to wait for business hours to get answers."
                  : "En décochant, vos clients devront attendre la réouverture de vos bureaux pour obtenir une réponse.")
          : (isEn ? "Deploys a custom AI chatbot that resolves customer inquiries and schedules calls 24/7."
                  : "Intègre un agent d'intelligence artificielle capable de répondre 24h/24 aux questions fréquentes de vos clients.");
      case 'reporting':
        return isChecked
          ? (isEn ? "Unchecking disables automated reporting. You will need to build and calculate KPI charts manually."
                  : "En décochant, vous perdrez la visibilité régulière sur vos statistiques clés à moins de les calculer vous-même.")
          : (isEn ? "Aggregates performance stats and emails automated weekly or monthly PDF reports to your team."
                  : "Génère un tableau de bord récapitulatif périodique (hebdomadaire/mensuel) envoyé directement par email.");
      case 'sync':
        return isChecked
          ? (isEn ? "Unchecking disables DB alignment. Discrepancies between your apps will require manual correction."
                  : "En décochant, des écarts de données apparaîtront entre vos systèmes, nécessitant des corrections manuelles.")
          : (isEn ? "Maintains perfect data sync between multiple databases, avoiding duplicates or mismatched records."
                  : "Maintient vos différentes bases de données parfaitement alignées en temps réel pour éviter les doublons.");

      // Automation AI
      case 'auto-ai':
        return isChecked
          ? (isEn ? "Unchecking disables smart AI processing. Your flows will be simple, linear, and rigid."
                  : "En décochant, vos flux d'automatisation resteront basiques et rigides, sans capacité d'analyse intelligente.")
          : (isEn ? "Integrates LLMs (ChatGPT/Claude) to read files, draft responses, summarize logs, or extract text."
                  : "Ajoute de l'intelligence artificielle pour analyser du texte, générer du contenu ou prendre des décisions.");

      default:
        return '';
    }
  };

  const toggleWebFeature = (id: string) => {
    const next = webDetails.features.includes(id)
      ? webDetails.features.filter((f) => f !== id)
      : [...webDetails.features, id];
    setWebDetails({ ...webDetails, features: next });
  };

  const toggleAppPlatform = (id: string) => {
    const next = appDetails.platforms.includes(id)
      ? appDetails.platforms.filter((p) => p !== id)
      : [...appDetails.platforms, id];
    setAppDetails({ ...appDetails, platforms: next });
  };

  const toggleAppIntegration = (id: string) => {
    const next = appDetails.integrations.includes(id)
      ? appDetails.integrations.filter((i) => i !== id)
      : [...appDetails.integrations, id];
    setAppDetails({ ...appDetails, integrations: next });
  };

  const toggleAutoSystem = (id: string) => {
    const next = autoDetails.targetSystems.includes(id)
      ? autoDetails.targetSystems.filter((s) => s !== id)
      : [...autoDetails.targetSystems, id];
    setAutoDetails({ ...autoDetails, targetSystems: next });
  };

  const toggleAutoType = (id: string) => {
    const next = autoDetails.automationType.includes(id)
      ? autoDetails.automationType.filter((t) => t !== id)
      : [...autoDetails.automationType, id];
    setAutoDetails({ ...autoDetails, automationType: next });
  };

  const handleValidateAndNext = () => {
    if (selectedServices.application && appDetails.platforms.length === 0) {
      setActiveTab('application');
      setErrorLocal(t('error_app_platforms', lang));
      return;
    }
    if (selectedServices.automation && autoDetails.targetSystems.length === 0) {
      setActiveTab('automation');
      setErrorLocal(t('error_auto_systems', lang));
      return;
    }
    if (selectedServices.automation && autoDetails.hasAi && !autoDetails.aiDescription.trim()) {
      setActiveTab('automation');
      setErrorLocal(t('error_auto_ai', lang));
      return;
    }

    setErrorLocal(null);
    onNext();
  };

  const getTabLabel = (tab: ServiceType) => {
    if (tab === 'website') return { name: t('tab_web', lang), icon: Globe };
    if (tab === 'application') return { name: t('tab_app', lang), icon: Cpu };
    return { name: t('tab_auto', lang), icon: Zap };
  };

  // Preset lists resolved dynamically
  const webTypes = getWebTypes(lang);
  const signDesigns = getSignDesigns(lang);
  const webFeatures = getWebFeatures(lang);
  const appPlatforms = getAppPlatforms(lang);
  const appIntegrations = getAppIntegrations(lang);
  const autoSystems = getAutoSystems(lang);
  const autoTypes = getAutoTypes(lang);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center md:text-left space-y-2">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          {t('questions_title', lang)}
        </h2>
        <p className="text-slate-400 text-sm md:text-base">
          {t('questions_desc', lang)}
        </p>
      </div>

      {errorLocal && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-medium"
        >
          {errorLocal}
        </motion.div>
      )}

      {enabledTabs.length > 1 && (
        <div id="service-form-tabs" className="flex flex-wrap gap-2 p-1.5 bg-slate-900/60 border border-slate-800 rounded-2xl">
          {enabledTabs.map((tab) => {
            const tabInfo = getTabLabel(tab);
            const TabIcon = tabInfo.icon;
            const isTabActive = activeTab === tab;

            return (
              <button
                id={`tab-btn-${tab}`}
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setErrorLocal(null);
                }}
                className={`flex-1 min-w-[140px] cursor-pointer inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${
                  isTabActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tabInfo.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 md:p-7 space-y-7 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'website' && selectedServices.website && (
            <motion.div
              key="website-subform"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 text-blue-400 pb-3 border-b border-slate-800/60">
                <Globe className="w-5 h-5" />
                <h3 className="font-extrabold text-lg text-white">{t('web_section_title', lang)}</h3>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {t('web_type_label', lang)} <span className="text-blue-400">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {webTypes.map((type) => (
                    <button
                      id={`opt-web-type-${type.id}`}
                      key={type.id}
                      type="button"
                      onClick={() => setWebDetails({ ...webDetails, siteType: type.id as any })}
                      className={`group cursor-pointer p-4 rounded-xl border text-left transition-all duration-300 ${
                        webDetails.siteType === type.id
                          ? 'bg-blue-600/5 border-blue-500/50 ring-1 ring-blue-500/20 text-white'
                          : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80'
                      }`}
                    >
                      <span className="block font-bold text-sm text-white group-hover:text-blue-400 transition-colors">
                        {type.label}
                      </span>
                      <span className="block text-xs text-slate-400 mt-1">
                        {type.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {t('web_size_label', lang)} <span className="text-blue-400">*</span>
                </label>
                {/* Responsive Grid System: grid-cols-1 sm:grid-cols-3 instead of grid-cols-3 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'small', label: t('web_size_small', lang), desc: t('web_size_small_desc', lang) },
                    { id: 'medium', label: t('web_size_medium', lang), desc: t('web_size_medium_desc', lang) },
                    { id: 'large', label: t('web_size_large', lang), desc: t('web_size_large_desc', lang) },
                  ].map((size) => (
                    <button
                      id={`opt-web-size-${size.id}`}
                      key={size.id}
                      type="button"
                      onClick={() => setWebDetails({ ...webDetails, pageSize: size.id as any })}
                      className={`cursor-pointer p-3.5 rounded-xl border text-center transition-all ${
                        webDetails.pageSize === size.id
                          ? 'bg-blue-600/5 border-blue-500/50 text-blue-400'
                          : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="block font-bold text-xs md:text-sm text-white">{size.label}</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">{size.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {t('web_design_label', lang)}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {signDesigns.map((design) => (
                    <button
                      id={`opt-web-design-${design.id}`}
                      key={design.id}
                      type="button"
                      onClick={() => setWebDetails({ ...webDetails, designType: design.id as any })}
                      className={`cursor-pointer p-4 rounded-xl border text-left transition-all ${
                        webDetails.designType === design.id
                          ? 'bg-blue-600/5 border-blue-500/50 text-white'
                          : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80'
                      }`}
                    >
                      <span className="block font-bold text-xs md:text-sm text-white">{design.label}</span>
                      <span className="block text-xs text-slate-400 mt-1">{design.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {t('web_features_label', lang)}
                </label>
                <div className="space-y-2.5">
                  {webFeatures.map((feat) => {
                    const isChecked = webDetails.features.includes(feat.id);
                    const tooltipId = `web-feat-${feat.id}`;
                    return (
                      <div key={feat.id} className="relative w-full">
                        <button
                          id={`chk-web-feat-${feat.id}`}
                          type="button"
                          onClick={() => toggleWebFeature(feat.id)}
                          onMouseEnter={() => setHoveredItemId(tooltipId)}
                          onMouseLeave={() => setHoveredItemId(null)}
                          className={`flex items-start gap-3.5 p-3.5 w-full cursor-pointer rounded-xl border text-left transition-all ${
                            isChecked
                              ? 'bg-blue-600/5 border-blue-500/40 text-white'
                              : 'bg-slate-900/35 border-slate-800 text-slate-400 hover:border-slate-700/60'
                          }`}
                        >
                          <span className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded border ${
                            isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-700 bg-slate-900'
                          }`}>
                            {isChecked && <span className="text-[10px] font-extrabold">✓</span>}
                          </span>
                          <div>
                            <span className="block font-bold text-xs md:text-sm text-white">{feat.title}</span>
                            <span className="block text-xs text-slate-400 mt-0.5">{feat.desc}</span>
                          </div>
                        </button>

                        <AnimatePresence>
                          {hoveredItemId === tooltipId && (
                            <motion.div
                              initial={{ opacity: 0, y: 5, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 5, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 w-72 p-3 bg-white/95 border border-slate-200/90 rounded-xl shadow-[0_8px_20px_-4px_rgba(0,0,0,0.3)] z-50 pointer-events-none text-left backdrop-blur-sm"
                            >
                              <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                                {getTooltipText(feat.id, isChecked)}
                              </p>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white/95" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Qualitative Questions section */}
              <div className="space-y-4 pt-5 border-t border-slate-900">
                <div className="space-y-2">
                  <label htmlFor="messagePrincipal" className="block text-xs font-semibold text-blue-300 uppercase tracking-wider">
                    {t('web_message_label', lang)}
                  </label>
                  <textarea
                    id="messagePrincipal"
                    rows={3}
                    placeholder={lang === 'en' ? "e.g., Showcase our unique craftsmanship in fine woodworking and encourage custom estimate requests..." : "Ex: Présenter notre savoir-faire unique dans l'ébénisterie d'art et encourager la prise de contact pour des devis sur-mesure..."}
                    value={webDetails.messagePrincipal || ''}
                    onChange={(e) => setWebDetails({ ...webDetails, messagePrincipal: e.target.value })}
                    className="w-full bg-slate-900/60 text-white rounded-xl py-3 px-4 text-xs border border-slate-800 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-blue-300 uppercase tracking-wider">
                    {t('web_charte_label', lang)}
                  </label>
                  {/* Responsive Grid System: grid-cols-1 sm:grid-cols-3 instead of grid-cols-3 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'yes', label: t('charte_yes', lang) },
                      { id: 'partial', label: t('charte_partial', lang) },
                      { id: 'no', label: t('charte_no', lang) },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setWebDetails({ ...webDetails, charteGraphicReady: opt.id as any })}
                        className={`cursor-pointer p-2.5 rounded-xl border text-center text-[10px] font-bold transition-all ${
                          webDetails.charteGraphicReady === opt.id
                            ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 ring-1 ring-blue-500/20'
                            : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="indispensablePages" className="block text-xs font-semibold text-blue-300 uppercase tracking-wider">
                    {t('web_pages_label', lang)}
                  </label>
                  <textarea
                    id="indispensablePages"
                    rows={2}
                    placeholder={lang === 'en' ? "e.g., Home, About, Portfolio, Services, Guided contact form." : "Ex: Accueil, À Propos, Portfolio Réalisations, Services, Formulaire de contact guidé."}
                    value={webDetails.indispensablePages || ''}
                    onChange={(e) => setWebDetails({ ...webDetails, indispensablePages: e.target.value })}
                    className="w-full bg-slate-900/60 text-white rounded-xl py-3 px-4 text-xs border border-slate-800 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="benchmarkSites" className="block text-xs font-semibold text-blue-300 uppercase tracking-wider">
                    {t('web_bench_label', lang)}
                  </label>
                  <textarea
                    id="benchmarkSites"
                    rows={2}
                    placeholder={lang === 'en' ? "e.g., stripe.com (for animations and clarity), apple.com (for sleek design)..." : "Ex: stripe.com (pour la clarté et les animations), apple.com (pour le design épuré)..."}
                    value={webDetails.benchmarkSites || ''}
                    onChange={(e) => setWebDetails({ ...webDetails, benchmarkSites: e.target.value })}
                    className="w-full bg-slate-900/60 text-white rounded-xl py-3 px-4 text-xs border border-slate-800 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'application' && selectedServices.application && (
            <motion.div
              key="application-subform"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 text-indigo-400 pb-3 border-b border-slate-800/60">
                <Cpu className="w-5 h-5" />
                <h3 className="font-extrabold text-lg text-white">{t('app_section_title', lang)}</h3>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {t('app_platforms_label', lang)} <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2.5">
                  {appPlatforms.map((plat) => {
                    const isChecked = appDetails.platforms.includes(plat.id);
                    const tooltipId = `app-plat-${plat.id}`;
                    return (
                      <div key={plat.id} className="relative w-full">
                        <button
                          id={`opt-app-plat-${plat.id}`}
                          type="button"
                          onClick={() => {
                            toggleAppPlatform(plat.id);
                            setErrorLocal(null);
                          }}
                          onMouseEnter={() => setHoveredItemId(tooltipId)}
                          onMouseLeave={() => setHoveredItemId(null)}
                          className={`flex items-start gap-4 p-4 w-full cursor-pointer rounded-xl border text-left transition-all ${
                            isChecked
                              ? 'bg-indigo-500/5 border-indigo-500/40 text-white'
                              : 'bg-slate-900/35 border-slate-800 text-slate-400 hover:border-slate-700/60'
                          }`}
                        >
                          <span className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded border ${
                            isChecked ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-700 bg-slate-900'
                          }`}>
                            {isChecked && <span className="text-[10px] font-extrabold">✓</span>}
                          </span>
                          <div>
                            <span className="block font-bold text-xs md:text-sm text-white">{plat.title}</span>
                            <span className="block text-xs text-slate-400 mt-0.5">{plat.desc}</span>
                          </div>
                        </button>

                        <AnimatePresence>
                          {hoveredItemId === tooltipId && (
                            <motion.div
                              initial={{ opacity: 0, y: 5, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 5, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 w-72 p-3 bg-white/95 border border-slate-200/90 rounded-xl shadow-[0_8px_20px_-4px_rgba(0,0,0,0.3)] z-50 pointer-events-none text-left backdrop-blur-sm"
                            >
                              <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                                {getTooltipText(plat.id, isChecked)}
                              </p>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white/95" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative w-full">
                  <button
                    id="chk-app-auth"
                    type="button"
                    onClick={() => setAppDetails({ ...appDetails, needsAuth: !appDetails.needsAuth })}
                    onMouseEnter={() => setHoveredItemId('chk-app-auth')}
                    onMouseLeave={() => setHoveredItemId(null)}
                    className={`flex items-center justify-between p-4 w-full cursor-pointer rounded-xl border text-left transition-all ${
                      appDetails.needsAuth
                        ? 'bg-indigo-500/5 border-indigo-500/40'
                        : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-indigo-400" />
                      <div>
                        <span className="block font-bold text-xs md:text-sm text-white">{t('app_members_label', lang)}</span>
                        <span className="block text-[10px] text-slate-400">{t('app_members_desc', lang)}</span>
                      </div>
                    </div>
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 ${appDetails.needsAuth ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-300 ${appDetails.needsAuth ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {hoveredItemId === 'chk-app-auth' && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 w-72 p-3 bg-white/95 border border-slate-200/90 rounded-xl shadow-[0_8px_20px_-4px_rgba(0,0,0,0.3)] z-50 pointer-events-none text-left backdrop-blur-sm"
                      >
                        <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                          {getTooltipText('app-auth', appDetails.needsAuth)}
                        </p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white/95" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative w-full">
                  <button
                    id="chk-app-db"
                    type="button"
                    onClick={() => setAppDetails({ ...appDetails, needsDatabase: !appDetails.needsDatabase })}
                    onMouseEnter={() => setHoveredItemId('chk-app-db')}
                    onMouseLeave={() => setHoveredItemId(null)}
                    className={`flex items-center justify-between p-4 w-full cursor-pointer rounded-xl border text-left transition-all ${
                      appDetails.needsDatabase
                        ? 'bg-indigo-500/5 border-indigo-500/40'
                        : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-indigo-400" />
                      <div>
                        <span className="block font-bold text-xs md:text-sm text-white">{t('app_db_label', lang)}</span>
                        <span className="block text-[10px] text-slate-400">{t('app_db_desc', lang)}</span>
                      </div>
                    </div>
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 ${appDetails.needsDatabase ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-300 ${appDetails.needsDatabase ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {hoveredItemId === 'chk-app-db' && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 w-72 p-3 bg-white/95 border border-slate-200/90 rounded-xl shadow-[0_8px_20px_-4px_rgba(0,0,0,0.3)] z-50 pointer-events-none text-left backdrop-blur-sm"
                      >
                        <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                          {getTooltipText('app-db', appDetails.needsDatabase)}
                        </p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white/95" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {t('app_complexity_label', lang)}
                </label>
                {/* Responsive Grid System: grid-cols-1 sm:grid-cols-3 instead of grid-cols-3 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'simple', label: t('complexity_simple', lang), desc: t('complexity_simple_desc', lang) },
                    { id: 'medium', label: t('complexity_medium', lang), desc: t('complexity_medium_desc', lang) },
                    { id: 'complex', label: t('complexity_complex', lang), desc: t('complexity_complex_desc', lang) },
                  ].map((level) => (
                    <button
                      id={`opt-app-complexity-${level.id}`}
                      key={level.id}
                      type="button"
                      onClick={() => setAppDetails({ ...appDetails, complexity: level.id as any })}
                      className={`cursor-pointer p-3.5 rounded-xl border text-center transition-all ${
                        appDetails.complexity === level.id
                          ? 'bg-indigo-500/5 border-indigo-500/60 text-indigo-400'
                          : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="block font-bold text-xs text-white">{level.label}</span>
                      <span className="block text-[9px] text-slate-500 mt-0.5">{level.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {t('app_integrations_label', lang)}
                </label>
                <div className="space-y-2.5">
                  {appIntegrations.map((integ) => {
                    const isChecked = appDetails.integrations.includes(integ.id);
                    const tooltipId = `app-integ-${integ.id}`;
                    return (
                      <div key={integ.id} className="relative w-full">
                        <button
                          id={`chk-app-integ-${integ.id}`}
                          type="button"
                          onClick={() => toggleAppIntegration(integ.id)}
                          onMouseEnter={() => setHoveredItemId(tooltipId)}
                          onMouseLeave={() => setHoveredItemId(null)}
                          className={`flex items-start gap-3.5 p-3.5 w-full cursor-pointer rounded-xl border text-left transition-all ${
                            isChecked
                              ? 'bg-indigo-500/5 border-indigo-500/40 text-white'
                              : 'bg-slate-900/35 border-slate-800 text-slate-400 hover:border-slate-700/60'
                          }`}
                        >
                          <span className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded border ${
                            isChecked ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-700 bg-slate-900'
                          }`}>
                            {isChecked && <span className="text-[10px] font-extrabold">✓</span>}
                          </span>
                          <div>
                            <span className="block font-bold text-xs md:text-sm text-white">{integ.title}</span>
                            <span className="block text-xs text-slate-400 mt-0.5">{integ.desc}</span>
                          </div>
                        </button>

                        <AnimatePresence>
                          {hoveredItemId === tooltipId && (
                            <motion.div
                              initial={{ opacity: 0, y: 5, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 5, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 w-72 p-3 bg-white/95 border border-slate-200/90 rounded-xl shadow-[0_8px_20px_-4px_rgba(0,0,0,0.3)] z-50 pointer-events-none text-left backdrop-blur-sm"
                            >
                              <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                                {getTooltipText(integ.id, isChecked)}
                              </p>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white/95" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {t('app_timeline_label', lang)}
                </label>
                {/* Responsive Grid System: grid-cols-1 sm:grid-cols-3 instead of grid-cols-3 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'asap', label: t('timeline_urgent', lang), desc: t('timeline_urgent_desc', lang) },
                    { id: 'standard', label: t('timeline_standard', lang), desc: t('timeline_standard_desc', lang) },
                    { id: 'flexible', label: t('timeline_flexible', lang), desc: t('timeline_flexible_desc', lang) },
                  ].map((time) => (
                    <button
                      id={`opt-app-timeline-${time.id}`}
                      key={time.id}
                      type="button"
                      onClick={() => setAppDetails({ ...appDetails, timeline: time.id as any })}
                      className={`cursor-pointer p-3.5 rounded-xl border text-center transition-all ${
                        appDetails.timeline === time.id
                          ? 'bg-indigo-500/5 border-indigo-500/60 text-indigo-400'
                          : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="block font-bold text-xs text-white">{time.label}</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">{time.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Qualitative Questions Section */}
              <div className="space-y-4 pt-5 border-t border-slate-900">
                <div className="space-y-2">
                  <label htmlFor="appMainProblem" className="block text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                    {t('app_problem_label', lang)}
                  </label>
                  <textarea
                    id="appMainProblem"
                    rows={3}
                    placeholder={lang === 'en' ? "e.g., Our team spends too much time manually consolidating intervention schedules, which leads to billing errors..." : "Ex: Notre équipe passe trop de temps à consolider manuellement les plannings d'interventions, ce qui génère des erreurs de facturation..."}
                    value={appDetails.mainProblem || ''}
                    onChange={(e) => setAppDetails({ ...appDetails, mainProblem: e.target.value })}
                    className="w-full bg-slate-900/60 text-white rounded-xl py-3 px-4 text-xs border border-slate-800 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="appUserRoles" className="block text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                    {t('app_roles_label', lang)}
                  </label>
                  <textarea
                    id="appUserRoles"
                    rows={2}
                    placeholder={lang === 'en' ? "e.g., Administrator (full control), Technician (status updates), Client (read & sign)..." : "Ex: Administrateur (contrôle global), Technicien (mise à jour du statut), Client (consultation et signature)..."}
                    value={appDetails.userRoles || ''}
                    onChange={(e) => setAppDetails({ ...appDetails, userRoles: e.target.value })}
                    className="w-full bg-slate-900/60 text-white rounded-xl py-3 px-4 text-xs border border-slate-800 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="appMvpFeatures" className="block text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                    {t('app_mvp_label', lang)}
                  </label>
                  <textarea
                    id="appMvpFeatures"
                    rows={3}
                    placeholder={lang === 'en' ? "e.g., Secure login, intervention dashboard, online signature on mobile, export hours to PDF..." : "Ex: Authentification sécurisée, tableau de bord d'interventions, signature en ligne sur mobile, export des heures en PDF..."}
                    value={appDetails.mvpFeatures || ''}
                    onChange={(e) => setAppDetails({ ...appDetails, mvpFeatures: e.target.value })}
                    className="w-full bg-slate-900/60 text-white rounded-xl py-3 px-4 text-xs border border-slate-800 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="appDataSource" className="block text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                    {t('app_source_label', lang)}
                  </label>
                  <textarea
                    id="appDataSource"
                    rows={2}
                    placeholder={lang === 'en' ? "e.g., Direct technician entry and monthly Excel client import with site addresses..." : "Ex: Saisie directe par les techniciens et import mensuel d'un fichier Excel client contenant les adresses des sites..."}
                    value={appDetails.dataSource || ''}
                    onChange={(e) => setAppDetails({ ...appDetails, dataSource: e.target.value })}
                    className="w-full bg-slate-900/60 text-white rounded-xl py-3 px-4 text-xs border border-slate-800 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'automation' && selectedServices.automation && (
            <motion.div
              key="automation-subform"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 text-amber-400 pb-3 border-b border-slate-800/60">
                <Zap className="w-5 h-5" />
                <h3 className="font-extrabold text-lg text-white">{t('auto_section_title', lang)}</h3>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {t('auto_systems_label', lang)} <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {autoSystems.map((sys) => {
                    const isChecked = autoDetails.targetSystems.includes(sys.id);
                    const tooltipId = `auto-sys-${sys.id}`;
                    return (
                      <div key={sys.id} className="relative w-full">
                        <button
                          id={`opt-auto-sys-${sys.id}`}
                          type="button"
                          onClick={() => {
                            toggleAutoSystem(sys.id);
                            setErrorLocal(null);
                          }}
                          onMouseEnter={() => setHoveredItemId(tooltipId)}
                          onMouseLeave={() => setHoveredItemId(null)}
                          className={`flex items-center gap-3 p-3 w-full cursor-pointer rounded-xl border text-left transition-all ${
                            isChecked
                              ? 'bg-amber-500/5 border-amber-500/40'
                              : 'bg-slate-900/45 border-slate-800 hover:border-slate-700/60'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isChecked ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-700 bg-slate-850'
                          }`}>
                            {isChecked && <span className="text-[9px] font-extrabold">✓</span>}
                          </span>
                          <span className="font-medium text-xs md:text-sm text-white">{sys.label}</span>
                        </button>

                        <AnimatePresence>
                          {hoveredItemId === tooltipId && (
                            <motion.div
                              initial={{ opacity: 0, y: 5, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 5, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 w-72 p-3 bg-white/95 border border-slate-200/90 rounded-xl shadow-[0_8px_20px_-4px_rgba(0,0,0,0.3)] z-50 pointer-events-none text-left backdrop-blur-sm"
                            >
                              <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                                {getTooltipText(sys.id === 'stripe' ? 'auto-stripe' : sys.id, isChecked)}
                              </p>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white/95" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {t('auto_type_label', lang)}
                </label>
                <div className="space-y-2.5">
                  {autoTypes.map((type) => {
                    const isChecked = autoDetails.automationType.includes(type.id);
                    const tooltipId = `auto-type-${type.id}`;
                    return (
                      <div key={type.id} className="relative w-full">
                        <button
                          id={`chk-auto-type-${type.id}`}
                          type="button"
                          onClick={() => toggleAutoType(type.id)}
                          onMouseEnter={() => setHoveredItemId(tooltipId)}
                          onMouseLeave={() => setHoveredItemId(null)}
                          className={`flex items-start gap-3.5 p-3.5 w-full cursor-pointer rounded-xl border text-left transition-all ${
                            isChecked
                              ? 'bg-amber-500/5 border-amber-500/40 text-white'
                              : 'bg-slate-900/35 border-slate-800 text-slate-400 hover:border-slate-700/60'
                          }`}
                        >
                          <span className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded border ${
                            isChecked ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-700 bg-slate-900'
                          }`}>
                            {isChecked && <span className="text-[10px] font-extrabold">✓</span>}
                          </span>
                          <div>
                            <span className="block font-bold text-xs md:text-sm text-white">{type.title}</span>
                            <span className="block text-xs text-slate-400 mt-0.5">{type.desc}</span>
                          </div>
                        </button>

                        <AnimatePresence>
                          {hoveredItemId === tooltipId && (
                            <motion.div
                              initial={{ opacity: 0, y: 5, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 5, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 w-72 p-3 bg-white/95 border border-slate-200/90 rounded-xl shadow-[0_8px_20px_-4px_rgba(0,0,0,0.3)] z-50 pointer-events-none text-left backdrop-blur-sm"
                            >
                              <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                                {getTooltipText(type.id, isChecked)}
                              </p>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white/95" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 pt-3 border-t border-slate-900">
                <div className="relative w-full">
                  <button
                    id="chk-auto-ai"
                    type="button"
                    onClick={() => setAutoDetails({ ...autoDetails, hasAi: !autoDetails.hasAi })}
                    onMouseEnter={() => setHoveredItemId('chk-auto-ai')}
                    onMouseLeave={() => setHoveredItemId(null)}
                    className={`flex items-center justify-between p-4 w-full cursor-pointer rounded-2xl border text-left transition-all duration-300 ${
                      autoDetails.hasAi
                        ? 'bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/40 shadow-sm'
                        : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block font-bold text-sm text-white">{t('auto_ai_label', lang)}</span>
                        <span className="block text-xs text-slate-400">{t('auto_ai_desc', lang)}</span>
                      </div>
                    </div>
                    <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-355 ${autoDetails.hasAi ? 'bg-amber-500' : 'bg-slate-700'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-355 ${autoDetails.hasAi ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {hoveredItemId === 'chk-auto-ai' && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 w-72 p-3 bg-white/95 border border-slate-200/90 rounded-xl shadow-[0_8px_20px_-4px_rgba(0,0,0,0.3)] z-50 pointer-events-none text-left backdrop-blur-sm"
                      >
                        <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                          {getTooltipText('auto-ai', autoDetails.hasAi)}
                        </p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white/95" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {autoDetails.hasAi && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden pl-1"
                    >
                      <label htmlFor="aiDescription" className="block text-xs font-semibold text-amber-300 uppercase tracking-wide">
                        {t('auto_ai_task_label', lang)} <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        id="aiDescription"
                        rows={3}
                        placeholder={lang === 'en' ? "e.g., Automatically draft response emails to customer quote requests using information from the CRM..." : "Ex: Analyser les emails entrants de support client et rédiger automatiquement des suggestions de réponses basées sur notre base documentaire..."}
                        value={autoDetails.aiDescription}
                        onChange={(e) => setAutoDetails({ ...autoDetails, aiDescription: e.target.value })}
                        className="w-full bg-slate-900 text-white border border-slate-800 focus:border-amber-500/60 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/25 transition-all"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <label htmlFor="autoVolume" className="block text-xs font-semibold text-slate-350 uppercase tracking-wider">
                    {t('auto_volume_label', lang)}
                  </label>
                  <div className="flex items-center gap-4 bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
                    <input
                      id="autoVolume"
                      type="range"
                      min={100}
                      max={20000}
                      step={100}
                      value={autoDetails.volumeEstimate}
                      onChange={(e) => setAutoDetails({ ...autoDetails, volumeEstimate: parseInt(e.target.value) })}
                      className="flex-1 accent-amber-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                    />
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 py-1.5 px-3 rounded-lg min-w-[90px] text-center">
                      {autoDetails.volumeEstimate.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')} / {lang === 'en' ? 'mo' : 'm'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="autoManualProcess" className="block text-xs font-semibold text-amber-300 uppercase tracking-wider">
                    {t('auto_manual_label', lang)}
                  </label>
                  <textarea
                    id="autoManualProcess"
                    rows={3}
                    placeholder={lang === 'en' ? 'e.g., "I receive a order email, copy the data to Excel, manually create a PDF invoice, and email it back..."' : 'Ex: "Je reçois un email de commande, je copie les données dans Excel, puis je crée un document PDF de facture à la main et je le renvoie par email..."'}
                    value={autoDetails.manualProcess || ''}
                    onChange={(e) => setAutoDetails({ ...autoDetails, manualProcess: e.target.value })}
                    className="w-full bg-slate-900/60 text-white rounded-xl py-3 px-4 text-xs border border-slate-800 focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="autoCurrentTools" className="block text-xs font-semibold text-amber-300 uppercase tracking-wider">
                    {t('auto_comm_label', lang)}
                  </label>
                  <textarea
                    id="autoCurrentTools"
                    rows={2}
                    placeholder="Ex: Gmail, Excel, Google Drive, WhatsApp, CRM Hubspot..."
                    value={autoDetails.currentTools || ''}
                    onChange={(e) => setAutoDetails({ ...autoDetails, currentTools: e.target.value })}
                    className="w-full bg-slate-900/60 text-white rounded-xl py-3 px-4 text-xs border border-slate-800 focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider">
                    {t('auto_ai_need_label', lang)}
                  </label>
                  {/* Responsive Grid System: grid-cols-1 sm:grid-cols-3 instead of grid-cols-3 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'yes', label: t('charte_yes', lang) },
                      { id: 'no', label: lang === 'en' ? 'No, not needed' : 'Non, pas nécessaire' },
                      { id: 'study', label: t('charte_partial', lang) },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAutoDetails({ ...autoDetails, hasAiIntegration: opt.id as any })}
                        className={`cursor-pointer p-2.5 rounded-xl border text-center text-[10px] font-bold transition-all ${
                          autoDetails.hasAiIntegration === opt.id
                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 ring-1 ring-amber-500/20'
                            : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav footer */}
      <div className="pt-6 border-t border-slate-800/60 flex items-center justify-between">
        <button
          id="btn-questions-back"
          type="button"
          onClick={onBack}
          className="group cursor-pointer inline-flex items-center gap-1.5 text-slate-400 hover:text-white font-medium text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t('back', lang)}
        </button>

        <button
          id="btn-questions-next"
          type="button"
          onClick={handleValidateAndNext}
          className="group cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all text-sm"
        >
          {t('next', lang)}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}
