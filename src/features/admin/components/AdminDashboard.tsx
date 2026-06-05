/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LogOut,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  Download,
  Building,
  Mail,
  Phone,
  FolderOpen,
  Calendar,
  Layers,
  DollarSign,
  FileText,
  BadgeAlert,
  ArrowUpDown,
  Laptop,
  CheckCircle,
  HelpCircle,
  Clock,
  Briefcase,
  ChevronRight,
  Maximize2,
  X,
  Sliders,
  Settings,
  Cpu,
  BookmarkCheck,
  Zap,
  Check,
  Copy,
  Terminal,
  Paperclip,
  Trash2,
  Euro,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabase, fetchAppSettings, saveAppSettings, updateOnboardingStatus, fetchAppSectors, saveAppSectors, fetchErrorLogs, resolveErrorLog, deleteErrorLog, fetchAnalyticsData, fetchGeneralSettings, saveGeneralSettings, DEFAULT_GENERAL_SETTINGS } from '../../../services/supabase';
import { PricingSettings, DEFAULT_PRICING_SETTINGS, DEFAULT_SECTORS, ErrorLog, AnalyticsStats, GeneralSettings } from '../../../types/index';
import ThemeSelector from '../../../components/ThemeSelector';

interface AdminDashboardProps {
  onLogout: () => void;
}

interface OnboardingBrief {
  id: string;
  contact_name: string;
  company_name: string | null;
  email: string;
  phone: string;
  industry: string;
  project_types: string[];
  specifications: any;
  complexity_level: string;
  delivery_deadline: string;
  client_target_budget: number;
  estimated_min_price: number;
  estimated_max_price: number;
  special_instructions: string | null;
  folder_ref: string;
  submitted_at: string;
  status?: string;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [briefs, setBriefs] = useState<OnboardingBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBrief, setSelectedBrief] = useState<OnboardingBrief | null>(null);

  // Sectors management states
  const [sectors, setSectors] = useState<string[]>(DEFAULT_SECTORS);
  const [newSector, setNewSector] = useState('');
  const [savingSectors, setSavingSectors] = useState(false);
  const [sectorsFeedback, setSectorsFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Development Prompt states
  const [promptModalContent, setPromptModalContent] = useState<string | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);

  // Helper to construct a detailed text of the specifications
  const getSpecsTextForPrompt = (b: OnboardingBrief) => {
    let specsTextList: string[] = [];
    if (b.project_types.includes('website') && b.specifications?.website) {
      const w = b.specifications.website;
      const featuresStr = w.features && w.features.length > 0 ? w.features.join(', ') : 'aucune spécifiée';
      let websiteText = `Site Internet -\n    - Type de site: ${w.siteType || 'Non spécifié'}\n    - Volume de pages: ${w.pageSize || 'Non spécifié'}\n    - Niveau de design: ${w.designType || 'Non spécifié'}\n    - Fonctionnalités avancées: ${featuresStr}`;
      
      if (w.messagePrincipal) websiteText += `\n    - Message principal à transmettre: "${w.messagePrincipal}"`;
      if (w.charteGraphicReady) {
        const charteLabel = w.charteGraphicReady === 'yes' ? 'Charte graphique et textes prêts' : w.charteGraphicReady === 'partial' ? 'Charte/textes partiellement prêts' : 'Pas de charte graphique (à concevoir)';
        websiteText += `\n    - État de la charte & des textes: ${charteLabel}`;
      }
      if (w.indispensablePages) websiteText += `\n    - Pages indispensables demandées: ${w.indispensablePages}`;
      if (w.benchmarkSites) websiteText += `\n    - Références visuelles/fonctionnelles (Inspirations): ${w.benchmarkSites}`;
      
      specsTextList.push(websiteText);
    }
    if (b.project_types.includes('application') && b.specifications?.application) {
      const a = b.specifications.application;
      const platformsStr = a.platforms && a.platforms.length > 0 ? a.platforms.join(', ') : 'aucune spécifiée';
      const integrationsStr = a.integrations && a.integrations.length > 0 ? a.integrations.join(', ') : 'aucune spécifiée';
      let appText = `Application Web / Métier -\n    - Plateformes cibles: ${platformsStr}\n    - Authentification: ${a.needsAuth ? 'Oui' : 'Non'}\n    - Base de Données: ${a.needsDatabase ? 'Oui' : 'Non'}\n    - Intégrations API: ${integrationsStr}\n    - Complexité globale: ${a.complexity || 'Non spécifiée'}`;
      
      if (a.mainProblem) appText += `\n    - Problème métier à résoudre: "${a.mainProblem}"`;
      if (a.userRoles) appText += `\n    - Rôles utilisateurs requis: ${a.userRoles}`;
      if (a.mvpFeatures) appText += `\n    - Fonctionnalités indispensables pour la V1 (MVP): ${a.mvpFeatures}`;
      if (a.dataSource) appText += `\n    - Provenance/source des données de l'application: ${a.dataSource}`;
      
      specsTextList.push(appText);
    }
    if (b.project_types.includes('automation') && b.specifications?.automation) {
      const au = b.specifications.automation;
      const targetSystemsStr = au.targetSystems && au.targetSystems.length > 0 ? au.targetSystems.join(', ') : 'aucun spécifié';
      const typesStr = au.automationType && au.automationType.length > 0 ? au.automationType.join(', ') : 'non spécifié';
      let autoText = `Automatisation & IA -\n    - Outils à connecter: ${targetSystemsStr}\n    - Types de flux d'automatisation: ${typesStr}\n    - Volume de tâches mensuel: ${au.volumeEstimate || 'Non renseigné'} tâches/mois\n    - IA intégrée: ${au.hasAi ? 'Oui' : 'Non'}\n    - Tâche IA (description): ${au.aiDescription || 'aucune'}`;
      
      if (au.manualProcess) autoText += `\n    - Description du processus manuel actuel (chronophage): "${au.manualProcess}"`;
      if (au.currentTools) autoText += `\n    - Outils et logiciels devant communiquer: ${au.currentTools}`;
      if (au.hasAiIntegration) {
        const aiIntLabel = au.hasAiIntegration === 'yes' ? 'IA fortement demandée' : au.hasAiIntegration === 'study' ? 'Intégration d\'IA à étudier' : 'Pas de besoin en IA';
        autoText += `\n    - Type d'IA requis: ${aiIntLabel}`;
      }
      
      specsTextList.push(autoText);
    }
    return specsTextList.length > 0 ? specsTextList.join('\n\n') : 'Aucune spécification renseignée.';
  };

  const handleGeneratePrompt = (b: OnboardingBrief) => {
    const projectTypesStr = b.project_types.map(t => {
      if (t === 'website') return 'Site Internet';
      if (t === 'application') return 'Application Web / Mobile';
      if (t === 'automation') return 'Automatisation & IA';
      return t;
    }).join(', ');

    const specsText = getSpecsTextForPrompt(b);
    const clientName = `${b.contact_name}${b.company_name ? ` (${b.company_name})` : ''}`;
    const roleStr = b.specifications?.client_info_extended?.contact_role ? `\n- Rôle du contact principal : ${b.specifications.client_info_extended.contact_role}` : '';
    const objectiveStr = b.specifications?.client_info_extended?.project_objective ? `\n- Objectif principal du projet : ${b.specifications.client_info_extended.project_objective}` : '';
    const budgetTrancheStr = b.specifications?.section3?.budget_tranche ? ` (Tranche : ${b.specifications.section3.budget_tranche === 'less_1000' ? 'Moins de 1 000 $' : b.specifications.section3.budget_tranche === 'between_1000_3000' ? 'Entre 1 000 $ et 3 000 $' : 'Plus de 3 000 $'})` : '';
    const constraintsStr = b.specifications?.section3?.technical_constraints ? `\n- Contraintes techniques/réglementaires : ${b.specifications.section3.technical_constraints}` : '';

    const promptText = `Agis en tant qu'Ingénieur Logiciel Senior et Architecte Solutions Cloud, expert en React (v19), TypeScript, Tailwind CSS (v4), Motion et Supabase.
Tu vas concevoir et implémenter l'architecture technique complète de la solution commandée par notre client.

Voici le cahier des charges précis extrait de notre formulaire Nuvatech-Solutions :

=== COORDONNÉES & CONTEXTE CLIENT ===
- Client : ${clientName}${roleStr}
- Secteur d'activité : ${b.industry}${objectiveStr}
- Budget cible : ${b.client_target_budget.toLocaleString('fr-FR')} $${budgetTrancheStr}
- Date ou délai de livraison souhaité : ${b.delivery_deadline}

=== SCOPE TECHNIQUE DU PROJET ===
- Types de services sollicités : ${projectTypesStr}
- Détails techniques & Expression du besoin :
${specsText}

=== CONSIGNES SPÉCIFIQUES & NOTES ===${constraintsStr}
- Consignes particulières du client : ${b.special_instructions || 'Aucune consigne spécifique.'}

=== DIRECTIVES POUR LE PROMPT DE DÉVELOPPEMENT ===
En te basant rigoureusement sur ces informations réelles, produis les éléments d'ingénierie logicielle suivants :
1. ARCHITECTURE DES REPERTOIRES : Propose une structure propre et modulaire des dossiers (features, components, hooks, services, types) adaptée à un projet React/Vite.
2. SCHÉMA DE BASE DE DONNÉES SUPABASE (SQL) : Fournis le script SQL complet de création des tables, clés étrangères, index de performance, déclencheurs (triggers) de mise à jour automatique, et les politiques de sécurité (RLS) associées.
3. CODE SOURCE MAJEUR : Écris le code source complet (TypeScript) des services de communication Supabase, du composant principal de la fonctionnalité clé, ainsi que des hooks React personnalisés pour la gestion d'état.
4. DESIGN SYSTEM & ESTHÉTIQUE : Indique les choix de palettes de couleurs (HSL harmonieux, mode sombre premium), les micro-animations interactives (avec Motion/Framer Motion) et la typographie pour un rendu moderne et engageant.
5. PLAN D'IMPLÉMENTATION : Établis une checklist ordonnée des étapes pour assembler, tester et déployer cette application.`;

    // Copy to clipboard
    navigator.clipboard.writeText(promptText).then(() => {
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 3000);
    }).catch(err => {
      console.error('Failed to copy prompt to clipboard:', err);
    });

    setPromptModalContent(promptText);
  };

  // Pricing variables config panel states
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING_SETTINGS);
  const [savingPricing, setSavingPricing] = useState(false);
  const [priceFeedback, setPriceFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'leads' | 'prospects' | 'pricing' | 'general' | 'errors' | 'analytics' | 'sql_setup'>('leads');

  // Filters and queries
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [projectTypeFilter, setProjectTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState<'submitted_at' | 'client_target_budget'>('submitted_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Error logs state
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [errorLogsLoading, setErrorLogsLoading] = useState(false);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [errorStatusFilter, setErrorStatusFilter] = useState<'All' | 'Nouveau' | 'En cours' | 'Résolu'>('All');
  const [fixNotesText, setFixNotesText] = useState('');
  const [errorActionFeedback, setErrorActionFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<AnalyticsStats | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // General settings state
  const [generalConfig, setGeneralConfig] = useState<GeneralSettings>(DEFAULT_GENERAL_SETTINGS);
  const [savingGeneralConfig, setSavingGeneralConfig] = useState(false);
  const [generalConfigFeedback, setGeneralConfigFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const loadErrorLogsData = async () => {
    setErrorLogsLoading(true);
    try {
      const data = await fetchErrorLogs();
      if (data) setErrorLogs(data);
    } catch (err) {
      console.warn('Could not load error logs:', err);
    } finally {
      setErrorLogsLoading(false);
    }
  };

  const loadAnalyticsStats = async () => {
    setAnalyticsLoading(true);
    try {
      const data = await fetchAnalyticsData();
      if (data) setAnalyticsData(data);
    } catch (err) {
      console.warn('Could not load analytics stats:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadGeneralConfigSettings = async () => {
    try {
      const data = await fetchGeneralSettings();
      if (data) setGeneralConfig(data);
    } catch (err) {
      console.warn('Could not load general settings:', err);
    }
  };

  // Load briefs and pricing rules from Supabase
  const loadData = async () => {
    setLoading(true);
    setError(null);
    const supabase = getSupabase();

    // Trigger secondary loaders
    loadErrorLogsData();
    loadAnalyticsStats();
    loadGeneralConfigSettings();

    if (!supabase) {
      setError("Le client Supabase n'est pas configuré. Veuillez connecter Supabase pour charger les données réelles.");
      setLoading(false);
      setBriefs(getMockOnboardings());
      return;
    }

    try {
      const { data, error: selectError } = await supabase
        .from('client_onboardings')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (selectError) {
        throw selectError;
      }

      setBriefs(data || []);
    } catch (err: any) {
      console.error('Error fetching table onboarding details:', err);
      setError(
        `Une erreur est survenue lors de l'accès aux données : ${err.message || err.toString()}. Utilisation du mode de démonstration.`
      );
      setBriefs(getMockOnboardings());
    } finally {
      setLoading(false);
    }
  };

  const loadPricingSettings = async () => {
    try {
      const data = await fetchAppSettings();
      if (data) {
        setPricing({ ...DEFAULT_PRICING_SETTINGS, ...data });
      }
    } catch (err) {
      console.warn('Could not load custom pricing settings:', err);
    }
  };

  const loadSectorsSettings = async () => {
    try {
      const data = await fetchAppSectors();
      if (data && data.length > 0) {
        setSectors(data);
      }
    } catch (err) {
      console.warn('Could not load custom sectors settings:', err);
    }
  };

  useEffect(() => {
    loadData();
    loadPricingSettings();
    loadSectorsSettings();
  }, []);

  const handleSignOut = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    onLogout();
  };

  // Status changer helper
  const handleStatusChange = async (id: string, newStatus: string) => {
    // Optimistic state updates
    setBriefs((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );

    const res = await updateOnboardingStatus(id, newStatus);
    if (!res.success) {
      console.error('Failed to change status in Supabase table:', res.error);
      // Re-fetch to synchronize state safely in case of API issues
      loadData();
    }
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPricing(true);
    setPriceFeedback(null);

    const res = await saveAppSettings(pricing);
    if (res.success) {
      setPriceFeedback({
        type: 'success',
        message: 'La grille de tarification a bien été mise à jour en base de données et est désormais active instantanément sur le frontend !'
      });
      setTimeout(() => setPriceFeedback(null), 7000);
    } else {
      setPriceFeedback({
        type: 'error',
        message: `Erreur durant l'enregistrement : ${res.error || 'Veuillez vérifier vos permissions RLS.'}`
      });
    }
    setSavingPricing(false);
  };

  const handleAddSector = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSector = newSector.trim();
    if (!cleanSector) return;
    if (sectors.includes(cleanSector)) {
      setSectorsFeedback({ type: 'error', message: 'Ce secteur existe déjà dans la liste.' });
      return;
    }
    setSectors([...sectors, cleanSector]);
    setNewSector('');
    setSectorsFeedback(null);
  };

  const handleRemoveSector = (sectorToRemove: string) => {
    setSectors(sectors.filter(s => s !== sectorToRemove));
    setSectorsFeedback(null);
  };

  const handleSaveSectors = async () => {
    setSavingSectors(true);
    setSectorsFeedback(null);
    const res = await saveAppSectors(sectors);
    if (res.success) {
      setSectorsFeedback({
        type: 'success',
        message: 'La liste des secteurs d\'activité a été enregistrée avec succès et est désormais active !'
      });
      setTimeout(() => setSectorsFeedback(null), 5000);
    } else {
      setSectorsFeedback({
        type: 'error',
        message: `Erreur lors de l'enregistrement : ${res.error || 'Veuillez vérifier vos permissions.'}`
      });
    }
    setSavingSectors(false);
  };

  const handleResolveError = async (id: string, nextStatus: 'Nouveau' | 'En cours' | 'Résolu') => {
    setErrorActionFeedback(null);
    const res = await resolveErrorLog(id, nextStatus, fixNotesText);
    if (res.success) {
      setErrorActionFeedback({ type: 'success', message: `Erreur mise à jour avec succès (Statut: ${nextStatus}) !` });
      setErrorLogs(prev => prev.map(l => l.id === id ? { ...l, status: nextStatus, fix_notes: fixNotesText, resolved_at: nextStatus === 'Résolu' ? new Date().toISOString() : undefined } : l));
      if (selectedError?.id === id) {
        setSelectedError(prev => prev ? { ...prev, status: nextStatus, fix_notes: fixNotesText, resolved_at: nextStatus === 'Résolu' ? new Date().toISOString() : undefined } : null);
      }
      setTimeout(() => setErrorActionFeedback(null), 4000);
    } else {
      setErrorActionFeedback({ type: 'error', message: `Erreur lors de la mise à jour : ${res.error}` });
    }
  };

  const handleDeleteError = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce log d\'erreur ?')) return;
    setErrorActionFeedback(null);
    const res = await deleteErrorLog(id);
    if (res.success) {
      setErrorActionFeedback({ type: 'success', message: 'Log d\'erreur supprimé avec succès !' });
      setErrorLogs(prev => prev.filter(l => l.id !== id));
      if (selectedError?.id === id) setSelectedError(null);
      setTimeout(() => setErrorActionFeedback(null), 4000);
    } else {
      setErrorActionFeedback({ type: 'error', message: `Erreur lors de la suppression : ${res.error}` });
    }
  };

  const handleSaveGeneralConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGeneralConfig(true);
    setGeneralConfigFeedback(null);
    const res = await saveGeneralSettings(generalConfig);
    if (res.success) {
      setGeneralConfigFeedback({ type: 'success', message: 'La configuration générale a bien été mise à jour en base de données et est active instantanément !' });
      setTimeout(() => setGeneralConfigFeedback(null), 5000);
    } else {
      setGeneralConfigFeedback({ type: 'error', message: `Erreur de sauvegarde : ${res.error || 'Veuillez vérifier vos permissions.'}` });
    }
    setSavingGeneralConfig(false);
  };

  // Sort and filter briefs (excluding early prospects)
  const filteredBriefs = briefs
    .filter((b) => {
      if (b.status === 'Prospect') return false;
      const query = searchQuery.toLowerCase();
      const matchSearch =
        b.contact_name.toLowerCase().includes(query) ||
        (b.company_name && b.company_name.toLowerCase().includes(query)) ||
        b.email.toLowerCase().includes(query) ||
        b.folder_ref.toLowerCase().includes(query);

      const matchIndustry = industryFilter === 'All' || b.industry === industryFilter;

      const matchProjectType =
        projectTypeFilter === 'All' || b.project_types.includes(projectTypeFilter.toLowerCase());

      const bStatus = b.status || 'Nouveau';
      const matchStatus = statusFilter === 'All' || bStatus === statusFilter;

      return matchSearch && matchIndustry && matchProjectType && matchStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'submitted_at') {
        comparison = new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
      } else if (sortField === 'client_target_budget') {
        comparison = a.client_target_budget - b.client_target_budget;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

  // Sort and filter prospects (only step 1 filled)
  const filteredProspects = briefs
    .filter((b) => {
      if (b.status !== 'Prospect') return false;
      const query = searchQuery.toLowerCase();
      return (
        b.contact_name.toLowerCase().includes(query) ||
        (b.company_name && b.company_name.toLowerCase().includes(query)) ||
        b.email.toLowerCase().includes(query) ||
        b.folder_ref.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

  // Sort and filter error logs
  const filteredErrors = errorLogs
    .filter((log) => {
      if (errorStatusFilter !== 'All' && log.status !== errorStatusFilter) return false;
      const query = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(query) ||
        (log.component && log.component.toLowerCase().includes(query)) ||
        (log.url && log.url.toLowerCase().includes(query))
      );
    });

  // Calculate high value insights
  const briefsOnly = briefs.filter(b => b.status !== 'Prospect');
  const totalSubmissions = briefsOnly.length;
  const totalProspects = briefs.filter(b => b.status === 'Prospect').length;
  const avgBudget = totalSubmissions
    ? Math.round(briefsOnly.reduce((sum, current) => sum + current.client_target_budget, 0) / totalSubmissions)
    : 0;

  const totalMinPipeline = briefsOnly.reduce((sum, cur) => sum + cur.estimated_min_price, 0);
  const totalMaxPipeline = briefsOnly.reduce((sum, cur) => sum + cur.estimated_max_price, 0);

  // Get unique industries from available
  const uniqueIndustries = Array.from(new Set(briefsOnly.map((b) => b.industry)));

  // Helper formatting currency
  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  // Helper date rendering
  const formatDateString = (isoString: string) => {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  const toggleSort = (field: 'submitted_at' | 'client_target_budget') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#E2E8F0] antialiased flex flex-col font-sans">
      
      {/* Upper Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#0F1218]/95 backdrop-blur-md border-b border-slate-800/80 px-6 md:px-12 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-[0_0_15px_rgba(37,99,235,0.30)]">
            <Layers className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-md font-bold text-white tracking-tight leading-none">Console Executive</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Super-Admin Panel</p>
          </div>
        </div>

        <div className="hidden md:block text-xs font-bold text-slate-500 uppercase tracking-widest">
          Console de Contrôle
        </div>

        <div className="flex items-center gap-3.5">
          <ThemeSelector />

          <button
            onClick={loadData}
            title="Rafraîchir"
            className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-all focus:outline-none cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-950 hover:border-rose-900 font-semibold rounded-xl text-xs transition-all focus:outline-none cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Déconnexion
          </button>
        </div>
      </header>

      {/* Sub-header Navigation Tabs */}
      <div className="bg-[#0F1218] border-b border-slate-800/80 px-6 md:px-12 py-2.5 overflow-x-auto flex gap-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === 'leads' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Briefs Soumis ({totalSubmissions})
        </button>
        <button
          onClick={() => setActiveTab('prospects')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === 'prospects' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          Prospects Capturés ({totalProspects})
        </button>
        <button
          onClick={() => setActiveTab('errors')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === 'errors' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <BadgeAlert className="w-3.5 h-3.5" />
          Journal d'Erreurs ({errorLogs.filter(e => e.status !== 'Résolu').length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === 'analytics' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Diagnostics & Clics
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === 'pricing' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Ajustement des Tarifs
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === 'general' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Configuration Générale
        </button>
        <button
          onClick={() => setActiveTab('sql_setup')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === 'sql_setup' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Guide SQL Supabase
        </button>
      </div>

      {/* Main Stats and Lead Grid */}
      <main className="flex-1 px-6 md:px-12 py-8 max-w-7xl w-full mx-auto space-y-8">
        
        {/* Statistics section */}
        <section id="admin-stats-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-[#0F1218] border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Nombre d'Onboarding</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-white">{totalSubmissions}</span>
              <span className="text-slate-400 text-xs">dossiers</span>
            </div>
            <p className="text-slate-500 text-xs mt-3 leading-relaxed flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-blue-500" />
              Soumissions en temps réel
            </p>
          </div>

          <div className="bg-[#0F1218] border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Budget Moyen Saisi</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-extrabold text-emerald-400">{formatUSD(avgBudget)}</span>
            </div>
            <p className="text-slate-500 text-xs mt-3 leading-relaxed flex items-center gap-1.5">
              <Euro className="w-3.5 h-3.5 text-emerald-400" />
              Cible moyenne déclarée de l'UI
            </p>
          </div>

          <div className="bg-[#0F1218] border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden sm:col-span-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Pipeline Estimé (Algorithme Nuvatech)</span>
            <div className="flex items-baseline gap-3 mt-2 flex-wrap">
              <span className="text-2xl font-extrabold text-blue-400">{formatUSD(totalMinPipeline)}</span>
              <span className="text-slate-600 text-sm font-bold">à</span>
              <span className="text-2xl font-extrabold text-indigo-400">{formatUSD(totalMaxPipeline)}</span>
            </div>
            <p className="text-slate-500 text-xs mt-3 leading-relaxed flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              Pipeline global généré par l'onboarding
            </p>
          </div>
        </section>

        {/* Database notice/warning */}
        {error && (
          <div className="p-4 bg-amber-950/20 border border-amber-900/60 rounded-xl text-amber-200 text-xs flex gap-3 leading-relaxed items-start">
            <BadgeAlert className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300 mb-0.5">Note du Système :</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Tab 1: Gestion des Leads */}
        {activeTab === 'leads' && (
          <section className="bg-[#0F1218] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800/80 bg-[#0F1218]/40 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
              
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  title="Rechercher"
                  placeholder="Rechercher par nom, entreprise, email ou dossier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#141822] border border-slate-800 focus:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-600" />
              </div>

              {/* Quick dropdown filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-[#141822] border border-slate-800 rounded-xl px-3 py-2 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-500">Secteur :</span>
                  <select
                    title="Filtrer par secteur d'activité"
                    value={industryFilter}
                    onChange={(e) => setIndustryFilter(e.target.value)}
                    className="bg-transparent border-none text-slate-200 focus:outline-none font-medium cursor-pointer"
                  >
                    <option value="All" className="bg-[#0F1218]">Tous</option>
                    {uniqueIndustries.map((ind) => (
                      <option key={ind} value={ind} className="bg-[#0F1218]">{ind}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-[#141822] border border-slate-800 rounded-xl px-3 py-2 text-xs">
                  <Laptop className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-500">Service :</span>
                  <select
                    title="Filtrer par type de projet"
                    value={projectTypeFilter}
                    onChange={(e) => setProjectTypeFilter(e.target.value)}
                    className="bg-transparent border-none text-slate-200 focus:outline-none font-medium cursor-pointer"
                  >
                    <option value="All" className="bg-[#0F1218]">Tous</option>
                    <option value="Website" className="bg-[#0F1218]">Site Web</option>
                    <option value="Application" className="bg-[#0F1218]">Application Web/Mobile</option>
                    <option value="Automation" className="bg-[#0F1218]">Automatisation & IA</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-[#141822] border border-slate-800 rounded-xl px-3 py-2 text-xs">
                  <BookmarkCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-500">Statut :</span>
                  <select
                    title="Filtrer par statut"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent border-none text-slate-200 focus:outline-none font-medium cursor-pointer"
                  >
                    <option value="All" className="bg-[#0F1218]">Tous</option>
                    <option value="Nouveau" className="bg-[#0F1218]">Nouveau</option>
                    <option value="En cours" className="bg-[#0F1218]">En cours</option>
                    <option value="Validé" className="bg-[#0F1218]">Validé</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-[#141822]/40">
                    <th className="px-6 py-4">Réf. Dossier</th>
                    <th className="px-6 py-4">Contact / Entreprise</th>
                    <th className="px-6 py-4">Secteur d'Activité</th>
                    <th className="px-6 py-4">Piliers Choisis</th>
                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('client_target_budget')}>
                      <div className="flex items-center gap-1.5">
                        Budget Saisi
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      </div>
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('submitted_at')}>
                      <div className="flex items-center gap-1.5">
                        Soumis le
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      </div>
                    </th>
                    <th className="px-6 py-4">Statut Projet</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredBriefs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-500 text-xs">
                        Aucune demande trouvée pour les critères de recherche sélectionnés.
                      </td>
                    </tr>
                  ) : (
                    filteredBriefs.map((b) => (
                      <tr
                        key={b.id}
                        className="hover:bg-slate-900/30 transition-all cursor-pointer group text-xs border-b border-slate-800/50"
                        onClick={() => setSelectedBrief(b)}
                      >
                        <td className="px-6 py-4 font-mono font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                          {b.folder_ref}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-200">{b.contact_name}</div>
                          {b.company_name && (
                            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              <Building className="w-3 h-3 shrink-0" />
                              {b.company_name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-medium">{b.industry}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1.5">
                            {b.project_types.map((type) => {
                              let label = type === 'website' ? 'Site Web' : type === 'application' ? 'App' : 'Automation';
                              let badgeClass = 'bg-slate-900 border-slate-800 text-slate-400';
                              if (type === 'website') badgeClass = 'bg-cyan-950/30 border-cyan-800/40 text-cyan-400';
                              if (type === 'application') badgeClass = 'bg-indigo-950/30 border-indigo-800/40 text-indigo-400';
                              if (type === 'automation') badgeClass = 'bg-purple-950/30 border-purple-800/40 text-purple-400';
                              
                              return (
                                <span key={type} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeClass}`}>
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold text-slate-200">
                          {formatUSD(b.client_target_budget)}
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-medium whitespace-nowrap">
                          {formatDateString(b.submitted_at)}
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          {/* Dropdown status update inside the cell */}
                          <select
                            title="Modifier le statut du projet"
                            value={b.status || 'Nouveau'}
                            onChange={async (e) => {
                              const nextStatus = e.target.value;
                              await handleStatusChange(b.id, nextStatus);
                            }}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-sans cursor-pointer focus:outline-none transition-all ${
                              (b.status || 'Nouveau') === 'Nouveau'
                                ? 'bg-blue-950/40 border-blue-800/40 text-blue-400'
                                : (b.status || 'Nouveau') === 'En cours'
                                ? 'bg-amber-950/40 border-amber-800/40 text-amber-500'
                                : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400'
                            }`}
                          >
                            <option value="Nouveau" className="bg-[#0F1218] text-blue-400">Nouveau</option>
                            <option value="En cours" className="bg-[#0F1218] text-amber-500">En cours</option>
                            <option value="Validé" className="bg-[#0F1218] text-emerald-400">Validé</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBrief(b);
                            }}
                            title="Voir les détails du dossier"
                            className="inline-flex items-center justify-center p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Prospects Tab (captured early from Step 1) */}
        {activeTab === 'prospects' && (
          <section className="bg-[#0F1218] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800/80 bg-[#0F1218]/40 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
              <div>
                <h3 className="text-white font-bold text-sm">Prospects (Formulaires non finalisés)</h3>
                <p className="text-[11px] text-slate-500 mt-1">Utilisateurs ayant rempli l'Étape 1 (coordonnées) mais n'ayant pas soumis le brief technique complet. Relancez-les pour faire d'eux des clients fidèles !</p>
              </div>
              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  placeholder="Rechercher un prospect..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#141822] border border-slate-800 focus:border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-600" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-[#141822]/40">
                    <th className="px-6 py-4">Nom complet</th>
                    <th className="px-6 py-4">Entreprise</th>
                    <th className="px-6 py-4">Secteur</th>
                    <th className="px-6 py-4">Email / Téléphone</th>
                    <th className="px-6 py-4">Abandonné le</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredProspects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500 text-xs">
                        Aucun prospect capturé pour le moment.
                      </td>
                    </tr>
                  ) : (
                    filteredProspects.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/30 transition-all text-xs border-b border-slate-800/50">
                        <td className="px-6 py-4 font-semibold text-slate-200">{p.contact_name}</td>
                        <td className="px-6 py-4 text-slate-450">{p.company_name || 'N/A'}</td>
                        <td className="px-6 py-4 text-slate-450">{p.industry}</td>
                        <td className="px-6 py-4 space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            {p.email}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-450">
                            <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            {p.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-450">{formatDateString(p.submitted_at)}</td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={`mailto:${p.email}?subject=Votre projet chez Nuvatech Solutions&body=Bonjour ${p.contact_name},\n\nNous avons remarqué que vous avez commencé à configurer votre projet sur notre site mais n'avez pas finalisé votre demande.\n\nNous serions ravis de vous accompagner dans la réalisation de votre projet. Quand seriez-vous disponible pour un court appel de qualification ?\n\nCordialement,\nL'équipe Nuvatech Solutions`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600/10 hover:bg-blue-650 text-blue-400 hover:text-white rounded-lg border border-blue-800/50 text-[10px] font-bold transition-all cursor-pointer"
                          >
                            <Mail className="w-3 h-3" />
                            Relancer par Email
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Journal d'Erreurs (Errors Tab) */}
        {activeTab === 'errors' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* List */}
            <div className="lg:col-span-2 bg-[#0F1218] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl flex flex-col">
              <div className="p-5 border-b border-slate-800/80 bg-[#0F1218]/40 flex flex-col sm:flex-row gap-3 justify-between items-center">
                <div>
                  <h3 className="text-white font-bold text-sm">Journal d'Erreurs</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Suivi en temps réel des bugs rencontrés par les utilisateurs.</p>
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={errorStatusFilter}
                    onChange={(e) => setErrorStatusFilter(e.target.value as any)}
                    className="bg-[#141822] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="All">Tous les statuts</option>
                    <option value="Nouveau">Nouveau</option>
                    <option value="En cours">En cours</option>
                    <option value="Résolu">Résolu</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto flex-1 max-h-[600px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-[#141822]/40">
                      <th className="px-5 py-3">Composant / Exception</th>
                      <th className="px-5 py-3">Message</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {errorLogsLoading ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-slate-500 text-xs">
                          Chargement des exceptions...
                        </td>
                      </tr>
                    ) : filteredErrors.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-slate-500 text-xs">
                          Aucune exception enregistrée.
                        </td>
                      </tr>
                    ) : (
                      filteredErrors.map((err) => (
                        <tr
                          key={err.id}
                          onClick={() => {
                            setSelectedError(err);
                            setFixNotesText(err.fix_notes || '');
                          }}
                          className={`hover:bg-slate-900/35 transition-all text-xs border-b border-slate-800/50 cursor-pointer ${
                            selectedError?.id === err.id ? 'bg-blue-950/15 border-blue-900/30' : ''
                          }`}
                        >
                          <td className="px-5 py-3">
                            <span className="font-mono text-[11px] text-indigo-400 bg-indigo-950/20 px-2 py-0.5 rounded border border-indigo-900/30">{err.component || 'Global'}</span>
                          </td>
                          <td className="px-5 py-3 font-semibold text-slate-200 truncate max-w-[200px]" title={err.message}>
                            {err.message}
                          </td>
                          <td className="px-5 py-3 text-slate-450">{formatDateString(err.created_at)}</td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase ${
                              err.status === 'Nouveau' ? 'bg-rose-950/30 border-rose-800/40 text-rose-400' :
                              err.status === 'En cours' ? 'bg-amber-950/30 border-amber-800/40 text-amber-500' :
                              'bg-emerald-950/30 border-emerald-800/40 text-emerald-400'
                            }`}>
                              {err.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Details & Fix */}
            <div className="bg-[#0F1218] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6 flex flex-col justify-between">
              {selectedError ? (
                <div className="space-y-5 flex-1">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-white font-bold text-sm">Détail du Log</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedError.id}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteError(selectedError.id)}
                      className="p-1.5 hover:bg-rose-950/30 text-slate-500 hover:text-rose-455 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-900/50"
                      title="Supprimer ce log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {errorActionFeedback && (
                    <div className={`p-3 border rounded-xl text-xs font-semibold ${
                      errorActionFeedback.type === 'success' ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-300' : 'bg-rose-950/20 border-rose-900/60 text-rose-300'
                    }`}>
                      {errorActionFeedback.message}
                    </div>
                  )}

                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Message d'Erreur :</span>
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/70 font-semibold text-rose-350 select-text leading-relaxed whitespace-pre-wrap mt-1">
                        {selectedError.message}
                      </div>
                    </div>

                    {selectedError.stack && (
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Trace d'Exécution (Stack Trace) :</span>
                        <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800/70 font-mono text-[10px] text-slate-400 overflow-x-auto max-h-[150px] overflow-y-auto mt-1 whitespace-pre select-text">
                          {selectedError.stack}
                        </pre>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-850">
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">URL active :</span>
                        <a href={selectedError.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate block cursor-pointer">
                          {selectedError.url || 'Inconnue'}
                        </a>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">Appareil (User Agent) :</span>
                        <span className="truncate block select-all text-slate-350" title={selectedError.user_agent}>
                          {selectedError.user_agent || 'Inconnu'}
                        </span>
                      </div>
                    </div>

                    {/* Resolution Form */}
                    <div className="space-y-3 pt-3 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Notes de Correction & Fixes :</span>
                      <textarea
                        rows={3}
                        placeholder="Ex: Corrigé le bug en remplaçant la variable de configuration indéfinie, ou notez la solution ici..."
                        value={fixNotesText}
                        onChange={(e) => setFixNotesText(e.target.value)}
                        className="w-full bg-[#141822] border border-slate-800 focus:border-slate-700 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-200"
                      />
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleResolveError(selectedError.id, 'En cours')}
                          className="flex-1 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-white font-bold py-2 rounded-xl text-[10px] transition-all cursor-pointer"
                        >
                          Marquer En cours
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveError(selectedError.id, 'Résolu')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-[10px] transition-all cursor-pointer shadow-lg shadow-emerald-600/10"
                        >
                          Marquer Résolu ✓
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs py-24 text-center">
                  <BadgeAlert className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
                  Sélectionnez une erreur dans la liste pour voir sa trace de débogage et y apporter une correction sur cette interface.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Diagnostics & Clics (Analytics Tab) */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Main stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-[#0F1218] border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Nombre total de Clics / Visites</span>
                <div className="text-3xl font-extrabold text-white mt-2">
                  {analyticsLoading ? '...' : analyticsData?.totalVisits || 0}
                </div>
                <p className="text-slate-500 text-xs mt-3">Compteur global de visites de l'application.</p>
              </div>

              <div className="bg-[#0F1218] border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Visiteurs Uniques (Navigateur)</span>
                <div className="text-3xl font-extrabold text-blue-400 mt-2">
                  {analyticsLoading ? '...' : analyticsData?.uniqueVisitors || 0}
                </div>
                <p className="text-slate-500 text-xs mt-3">Visiteurs distincts identifiés par signature locale.</p>
              </div>

              <div className="bg-[#0F1218] border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Taux de Conversion (Briefs/Clics)</span>
                <div className="text-3xl font-extrabold text-emerald-400 mt-2">
                  {analyticsLoading ? '...' : `${analyticsData?.conversionRate || 0} %`}
                </div>
                <p className="text-slate-500 text-xs mt-3">Proportion de visiteurs uniques soumettant un brief complet.</p>
              </div>
            </div>

            {/* Diagnostics details */}
            <div className="bg-[#0F1218] border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <h3 className="text-white font-bold text-sm">Diagnostic d'Audience et Clics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ce panneau récapitule l'activité mesurée de l'application. Les événements d'analyse sont insérés de manière anonyme à chaque premier chargement de page.
              </p>
              <div className="p-4 bg-slate-950 border border-slate-800/70 rounded-xl font-mono text-[11px] text-slate-400 space-y-2">
                <div>&gt; _visitor_cookie_detection: Active</div>
                <div>&gt; _campaign_source_tracking: referrer-detection</div>
                <div>&gt; _live_telemetry_status: connecté à app_analytics (RLS habilité)</div>
              </div>
            </div>
          </div>
        )}

        {/* Configuration Générale (General Settings Tab) */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveGeneralConfig} className="space-y-6">
            
            {generalConfigFeedback && (
              <div className={`p-4 border rounded-xl text-xs font-semibold ${
                generalConfigFeedback.type === 'success' ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-300' : 'bg-rose-950/20 border-rose-900/60 text-rose-300'
              }`}>
                {generalConfigFeedback.message}
              </div>
            )}

            {/* Mode Maintenance Card */}
            <div className="bg-[#0F1218] border border-slate-800/80 rounded-2xl p-6 space-y-5">
              <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-500" />
                    Mode Maintenance de l'Application
                  </h3>
                  <p className="text-[11px] text-slate-550 mt-0.5">Activer la maintenance coupe l'accès au formulaire client tout en gardant l'admin accessible.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={generalConfig.maintenance_mode}
                    onChange={(e) => setGeneralConfig(prev => ({ ...prev, maintenance_mode: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-focus:ring-1 peer-focus:ring-blue-500/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
                </label>
              </div>

              {generalConfig.maintenance_mode && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Message de Maintenance :</label>
                  <textarea
                    rows={2}
                    value={generalConfig.maintenance_message}
                    onChange={(e) => setGeneralConfig(prev => ({ ...prev, maintenance_message: e.target.value }))}
                    className="w-full bg-[#141822] border border-slate-800 focus:border-slate-700 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-200"
                  />
                </div>
              )}
            </div>

            {/* Custom Texts Welcome banners */}
            <div className="bg-[#0F1218] border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-500" />
                  Textes d'Accueil de l'Onboarding (Étape 1)
                </h3>
                <p className="text-[11px] text-slate-550 mt-0.5">Personnalisez le message de bienvenue visible par vos prospects à l'étape 1.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Titre principal :</label>
                  <input
                    type="text"
                    value={generalConfig.welcome_title}
                    onChange={(e) => setGeneralConfig(prev => ({ ...prev, welcome_title: e.target.value }))}
                    className="w-full bg-[#141822] border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Sous-titre / Description :</label>
                  <textarea
                    rows={2}
                    value={generalConfig.welcome_subtitle}
                    onChange={(e) => setGeneralConfig(prev => ({ ...prev, welcome_subtitle: e.target.value }))}
                    className="w-full bg-[#141822] border border-slate-800 focus:border-slate-700 rounded-xl p-3 text-xs focus:outline-none text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Code Injectors Patching */}
            <div className="bg-[#0F1218] border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  Patchs de Code Correctifs (CSS & JS)
                </h3>
                <p className="text-[11px] text-slate-550 mt-0.5">Saisissez ici du code correctif. Il sera injecté directement sur l'interface du client.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Patch CSS (Style de l'UI) :</label>
                  <textarea
                    rows={6}
                    placeholder="Ex: #master-app-container { border: 1px solid #2563eb; } or styling overrides..."
                    value={generalConfig.custom_css}
                    onChange={(e) => setGeneralConfig(prev => ({ ...prev, custom_css: e.target.value }))}
                    className="w-full bg-[#141822] border border-slate-800 focus:border-slate-700 rounded-xl p-3 text-xs font-mono focus:outline-none text-slate-350"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Patch JS (Script personnalisé) :</label>
                  <textarea
                    rows={6}
                    placeholder="Ex: console.log('Custom script loaded!'); or tracking triggers..."
                    value={generalConfig.custom_js}
                    onChange={(e) => setGeneralConfig(prev => ({ ...prev, custom_js: e.target.value }))}
                    className="w-full bg-[#141822] border border-slate-800 focus:border-slate-700 rounded-xl p-3 text-xs font-mono focus:outline-none text-slate-350"
                  />
                </div>
              </div>
            </div>

            {/* Uploads and contact email settings */}
            <div className="bg-[#0F1218] border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-500" />
                  Support Client & Limites Fichiers
                </h3>
                <p className="text-[11px] text-slate-550 mt-0.5">Paramètres d'envoi et de transfert.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Adresse email de support :</label>
                  <input
                    type="email"
                    value={generalConfig.support_email}
                    onChange={(e) => setGeneralConfig(prev => ({ ...prev, support_email: e.target.value }))}
                    className="w-full bg-[#141822] border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Limite de taille fichier (Mo) :</label>
                  <input
                    type="number"
                    value={generalConfig.max_upload_size}
                    onChange={(e) => setGeneralConfig(prev => ({ ...prev, max_upload_size: Number(e.target.value) }))}
                    className="w-full bg-[#141822] border border-slate-800 focus:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingGeneralConfig}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl text-xs transition-all shadow-lg shadow-blue-500/10 cursor-pointer disabled:opacity-50"
              >
                {savingGeneralConfig ? 'Enregistrement...' : 'Enregistrer la Configuration'}
              </button>
            </div>
          </form>
        )}

        {/* Guide SQL / Setup Tab */}
        {activeTab === 'sql_setup' && (
          <div className="bg-[#0F1218] border border-slate-800/80 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-white font-bold text-sm">Installation SQL Supabase (Migrations)</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Pour assurer le bon fonctionnement du **Journal d'Erreurs** et des **Diagnostics de clics**, exécutez le script SQL ci-dessous dans l'éditeur SQL de votre console Supabase.
              </p>
            </div>

            <div className="relative">
              <pre className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl font-mono text-[10px] text-slate-350 overflow-x-auto select-all max-h-[400px] overflow-y-auto">
{`-- 1. Création de la table pour le Journal d'Erreurs
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

-- 2. Habilitation de la sécurité ligne (RLS) sur error_logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- 3. Politiques RLS pour error_logs (autoriser l'insertion pour tout le monde, et accès complet pour l'admin)
CREATE POLICY "Allow anonymous inserts to error_logs" ON error_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all operations for error_logs" ON error_logs
    FOR ALL USING (true);


-- 4. Création de la table pour le traçage des clics/visites
CREATE TABLE IF NOT EXISTS app_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL, -- 'visit'
    visitor_id TEXT,
    referrer TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Habilitation de la sécurité ligne (RLS) sur app_analytics
ALTER TABLE app_analytics ENABLE ROW LEVEL SECURITY;

-- 6. Politiques RLS pour app_analytics
CREATE POLICY "Allow anonymous inserts to app_analytics" ON app_analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all operations for app_analytics" ON app_analytics
    FOR ALL USING (true);
`}
              </pre>
            </div>

            <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-indigo-300 text-xs leading-relaxed flex gap-2">
              <Sparkles className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Une fois ce script exécuté dans votre projet Supabase, les erreurs loggées et les clics de vos visiteurs commenceront automatiquement à alimenter vos diagnostics en temps réel.
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Ajustement des Tarifs (Configuration Panel) */}
        {activeTab === 'pricing' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Introductory descriptive Card */}
            <div className="bg-gradient-to-r from-blue-900/10 to-indigo-900/10 border border-slate-800 p-6 rounded-2xl">
              <h2 className="text-white text-base font-bold tracking-tight mb-2 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                Configuration Générale de l'Application
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ajustez en temps réel les variables de l'application (tarifs de devis et secteurs d'activité) stockées dans la base de données Supabase (<code className="text-blue-300 font-mono">app_settings</code>), sans avoir à réécrire ou rédéployer le code.
              </p>
            </div>

            {/* Gestion des Secteurs d'Activité Card */}
            <div className="bg-[#0F1218] border border-slate-800/80 rounded-2xl p-6 space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block mb-1">Étape 1 : Tunnel Client</span>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-cyan-400" />
                  Secteurs d'Activité du Formulaire
                </h3>
              </div>

              {sectorsFeedback && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`p-4 border rounded-xl text-xs font-semibold flex items-center gap-3 ${
                    sectorsFeedback.type === 'success'
                      ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-300'
                      : 'bg-rose-950/20 border-rose-900/60 text-rose-300'
                  }`}
                >
                  {sectorsFeedback.type === 'success' ? (
                    <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <BadgeAlert className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <span>{sectorsFeedback.message}</span>
                </motion.div>
              )}

              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gérez la liste des secteurs d'activité disponibles pour vos prospects. Cliquez sur la croix (<code className="text-rose-400 font-bold">×</code>) pour retirer un secteur, puis cliquez sur **Enregistrer les Secteurs** pour valider.
                </p>

                {/* List of current sectors as badges */}
                <div className="flex flex-wrap gap-2.5 p-4 bg-[#141822] border border-slate-800/60 rounded-xl min-h-[50px]">
                  {sectors.map((sector) => (
                    <span
                      key={sector}
                      className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 py-1.5 px-3 rounded-xl text-xs font-medium"
                    >
                      {sector}
                      <button
                        type="button"
                        onClick={() => handleRemoveSector(sector)}
                        title={`Supprimer ${sector}`}
                        className="text-slate-500 hover:text-rose-400 focus:outline-none transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {sectors.length === 0 && (
                    <span className="text-slate-500 text-xs italic">Aucun secteur configuré. Cliquez sur le bouton d'ajout ci-dessous pour commencer.</span>
                  )}
                </div>

                {/* Form to add a new sector */}
                <div className="flex gap-3 max-w-md">
                  <input
                    type="text"
                    title="Nouveau secteur"
                    placeholder="Ex. Énergie & Climat, Transport..."
                    value={newSector}
                    onChange={(e) => setNewSector(e.target.value)}
                    className="flex-1 bg-[#141822] border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddSector}
                    className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={savingSectors}
                  onClick={handleSaveSectors}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  {savingSectors ? 'Enregistrement...' : 'Enregistrer les Secteurs'}
                </button>
              </div>
            </div>

            {/* Success Feedback Banner */}
            {priceFeedback && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`p-4 border rounded-xl text-xs font-semibold flex items-center gap-3 ${
                  priceFeedback.type === 'success'
                    ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-900/60 text-rose-300'
                }`}
              >
                {priceFeedback.type === 'success' ? (
                  <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <BadgeAlert className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span>{priceFeedback.message}</span>
              </motion.div>
            )}

            <form onSubmit={handleSavePricing} className="space-y-6">
              
              {/* Category 1: Site Internet */}
              <div className="bg-[#0F1218] border border-slate-800/80 rounded-2xl p-6 space-y-6">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block mb-1">Architecture Web</span>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-cyan-400" />
                    Catégorie : Site Internet (Frais de base & Options)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Site Vitrine */}
                  <div className="bg-[#141822] p-4 rounded-xl border border-slate-850 space-y-3">
                    <span className="text-xs font-bold text-slate-300 block">Site Vitrine (Base)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-500 font-bold block mb-1">MIN ($)</label>
                        <input
                          type="number"
                          title="Prix minimum pour site vitrine"
                          placeholder="Min $"
                          value={pricing.website_vitrine_min}
                          onChange={(e) => setPricing(prev => ({ ...prev, website_vitrine_min: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 font-bold block mb-1">MAX ($)</label>
                        <input
                          title="Prix maximum pour site vitrine"
                          placeholder="Max $"
                          type="number"
                          value={pricing.website_vitrine_max}
                          onChange={(e) => setPricing(prev => ({ ...prev, website_vitrine_max: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* E-Commerce */}
                  <div className="bg-[#141822] p-4 rounded-xl border border-slate-850 space-y-3">
                    <span className="text-xs font-bold text-slate-300 block">E-Commerce (Base)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-500 font-bold block mb-1">MIN ($)</label>
                        <input
                          title="Prix minimum pour site e-commerce"
                          placeholder="Min $"
                          type="number"
                          value={pricing.website_ecommerce_min}
                          onChange={(e) => setPricing(prev => ({ ...prev, website_ecommerce_min: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 font-bold block mb-1">MAX ($)</label>
                        <input
                          title="Prix maximum pour site e-commerce"
                          placeholder="Max $"
                          type="number"
                          value={pricing.website_ecommerce_max}
                          onChange={(e) => setPricing(prev => ({ ...prev, website_ecommerce_max: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Portfolio */}
                  <div className="bg-[#141822] p-4 rounded-xl border border-slate-850 space-y-3">
                    <span className="text-xs font-bold text-slate-300 block">Portfolio (Base)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-500 font-bold block mb-1">MIN ($)</label>
                        <input
                          title="Prix minimum pour portfolio"
                          placeholder="Min $"
                          type="number"
                          value={pricing.website_portfolio_min}
                          onChange={(e) => setPricing(prev => ({ ...prev, website_portfolio_min: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 font-bold block mb-1">MAX ($)</label>
                        <input
                          title="Prix maximum pour portfolio"
                          placeholder="Max $"
                          type="number"
                          value={pricing.website_portfolio_max}
                          onChange={(e) => setPricing(prev => ({ ...prev, website_portfolio_max: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Landing page */}
                  <div className="bg-[#141822] p-4 rounded-xl border border-slate-850 space-y-3">
                    <span className="text-xs font-bold text-slate-300 block">Page d'Atterrissage (Base)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-500 font-bold block mb-1">MIN ($)</label>
                        <input
                          title="Prix minimum pour landing page"
                          placeholder="Min $"
                          type="number"
                          value={pricing.website_landing_min}
                          onChange={(e) => setPricing(prev => ({ ...prev, website_landing_min: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 font-bold block mb-1">MAX ($)</label>
                        <input
                          title="Prix maximum pour landing page"
                          placeholder="Max $"
                          type="number"
                          value={pricing.website_landing_max}
                          onChange={(e) => setPricing(prev => ({ ...prev, website_landing_max: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Sub configuration options width pagesize, custom design, features */}
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block pt-2">Suppléments Web & Options UI</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Page count medium */}
                  <div className="bg-[#141822] p-4 rounded-xl border border-slate-850 space-y-3">
                    <span className="text-xs font-bold text-slate-350 block">Volume Moyen Pages (+)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MIN ($)</label>
                        <input
                          title="Prix minimum pour volume moyen de pages"
                          placeholder="Min $"
                          type="number"
                          value={pricing.website_pagesize_medium_min}
                          onChange={(e) => setPricing(prev => ({ ...prev, website_pagesize_medium_min: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MAX ($)</label>
                        <input
                          title="Prix maximum pour volume moyen de pages"
                          placeholder="Max $"
                          type="number"
                          value={pricing.website_pagesize_medium_max}
                          onChange={(e) => setPricing(prev => ({ ...prev, website_pagesize_medium_max: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Page count large */}
                  <div className="bg-[#141822] p-4 rounded-xl border border-slate-850 space-y-3">
                    <span className="text-xs font-bold text-slate-350 block">Volume Grand Pages (+)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MIN ($)</label>
                        <input
                          title="Prix minimum pour volume grand de pages"
                          placeholder="Min $"
                          type="number"
                          value={pricing.website_pagesize_large_min}
                          onChange={(e) => setPricing(prev => ({ ...prev, website_pagesize_large_min: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MAX ($)</label>
                        <input
                          title="Prix maximum pour volume grand de pages"
                          placeholder="Max $"
                          type="number"
                          value={pricing.website_pagesize_large_max}
                          onChange={(e) => setPricing(prev => ({ ...prev, website_pagesize_large_max: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Custom Design addition */}
                  <div className="bg-[#141822] p-4 rounded-xl border border-slate-850 space-y-3">
                    <span className="text-xs font-bold text-slate-350 block">Design Sur-Mesure (+)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MIN ($)</label>
                        <input
                          title="Prix minimum pour design sur-mesure"
                          placeholder="Min $"
                          type="number"
                          value={pricing.website_design_custom_min}
                          onChange={(e) => setPricing(prev => ({ ...prev, website_design_custom_min: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MAX ($)</label>
                        <input
                          title="Prix maximum pour design sur-mesure"
                          placeholder="Max $"
                          type="number"
                          value={pricing.website_design_custom_max}
                          onChange={(e) => setPricing(prev => ({ ...prev, website_design_custom_max: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Unit features cost */}
                  <div className="bg-[#141822] p-4 rounded-xl border border-slate-850 space-y-3">
                    <span className="text-xs font-bold text-slate-355 block">Option Web Unitaire (+)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MIN ($)</label>
                        <input
                          title="Prix minimum pour option web supplémentaire"
                          placeholder="Min $"
                          type="number"
                          value={pricing.website_feature_unit_min}
                          onChange={(e) => setPricing(prev => ({ ...prev, website_feature_unit_min: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MAX ($)</label>
                        <input
                          title="Prix maximum pour option web supplémentaire"
                          placeholder="Max $"
                          type="number"
                          value={pricing.website_feature_unit_max}
                          onChange={(e) => setPricing(prev => ({ ...prev, website_feature_unit_max: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Category 2: Application Web & Mobile */}
              <div className="bg-[#0F1218] border border-slate-800/80 rounded-2xl p-6 space-y-6">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mb-1">Logiciel Tactique & API</span>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-indigo-400" />
                    Catégorie : Application Professionnelle (Coûts fixes & Complexité)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Web & mobile platforms unit */}
                  <div className="bg-[#141822] p-4 rounded-xl border border-slate-850 space-y-3">
                    <span className="text-xs font-bold text-slate-300 block">Frais par Plateforme (+)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-500 Block mb-1">MIN ($)</label>
                        <input
                          title="Prix minimum pour plateforme applicative supplémentaire"
                          placeholder="Min $"
                          type="number"
                          value={pricing.app_platform_unit_min}
                          onChange={(e) => setPricing(prev => ({ ...prev, app_platform_unit_min: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MAX ($)</label>
                        <input
                          title="Prix maximum pour plateforme applicative supplémentaire"
                          placeholder="Max $"
                          type="number"
                          value={pricing.app_platform_unit_max}
                          onChange={(e) => setPricing(prev => ({ ...prev, app_platform_unit_max: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Authentication needs */}
                  <div className="bg-[#141822] p-4 rounded-xl border border-slate-850 space-y-3">
                    <span className="text-xs font-bold text-slate-300 block">Module Portails d'accès (+)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MIN ($)</label>
                        <input
                          title="Prix minimum pour authentification application"
                          placeholder="Min $"
                          type="number"
                          value={pricing.app_needs_auth_min}
                          onChange={(e) => setPricing(prev => ({ ...prev, app_needs_auth_min: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MAX ($)</label>
                        <input
                          title="Prix maximum pour authentification application"
                          placeholder="Max $"
                          type="number"
                          value={pricing.app_needs_auth_max}
                          onChange={(e) => setPricing(prev => ({ ...prev, app_needs_auth_max: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Database configuration options */}
                  <div className="bg-[#141822] p-4 rounded-xl border border-slate-850 space-y-3">
                    <span className="text-xs font-bold text-slate-300 block">Base de Données & Stock (+)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MIN ($)</label>
                        <input
                          title="Prix minimum pour base de données application"
                          placeholder="Min $"
                          type="number"
                          value={pricing.app_needs_database_min}
                          onChange={(e) => setPricing(prev => ({ ...prev, app_needs_database_min: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MAX ($)</label>
                        <input
                          title="Prix maximum pour base de données application"
                          placeholder="Max $"
                          type="number"
                          value={pricing.app_needs_database_max}
                          onChange={(e) => setPricing(prev => ({ ...prev, app_needs_database_max: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Integrations unit stripe etc*/}
                  <div className="bg-[#141822] p-4 rounded-xl border border-slate-850 space-y-3">
                    <span className="text-xs font-bold text-slate-300 block">Coût Intégration API (+)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MIN ($)</label>
                        <input
                          title="Prix minimum pour intégration API application"
                          placeholder="Min $"
                          type="number"
                          value={pricing.app_integration_unit_min}
                          onChange={(e) => setPricing(prev => ({ ...prev, app_integration_unit_min: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MAX ($)</label>
                        <input
                          title="Prix maximum pour intégration API application"
                          placeholder="Max $"
                          type="number"
                          value={pricing.app_integration_unit_max}
                          onChange={(e) => setPricing(prev => ({ ...prev, app_integration_unit_max: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  
                  {/* Complexity modifier - medium */}
                  <div className="bg-[#141822] p-4 rounded-xl border border-slate-850 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300 block">Complexité : Moyenne (+)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MIN ($)</label>
                        <input
                          title="Prix minimum pour complexité moyenne application"
                          placeholder="Min $"
                          type="number"
                          value={pricing.app_complexity_medium_min}
                          onChange={(e) => setPricing(prev => ({ ...prev, app_complexity_medium_min: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MAX ($)</label>
                        <input
                          title="Prix maximum pour complexité moyenne application"
                          placeholder="Max $"
                          type="number"
                          value={pricing.app_complexity_medium_max}
                          onChange={(e) => setPricing(prev => ({ ...prev, app_complexity_medium_max: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Complexity modifier - complex */}
                  <div className="bg-[#141822] p-4 rounded-xl border border-slate-850 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-400 block">Complexité : Élevée (+)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MIN ($)</label>
                        <input
                          title="Prix minimum pour complexité avancée application"
                          placeholder="Min $"
                          type="number"
                          value={pricing.app_complexity_complex_min}
                          onChange={(e) => setPricing(prev => ({ ...prev, app_complexity_complex_min: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MAX ($)</label>
                        <input
                          title="Prix maximum pour complexité avancée application"
                          placeholder="Max $"
                          type="number"
                          value={pricing.app_complexity_complex_max}
                          onChange={(e) => setPricing(prev => ({ ...prev, app_complexity_complex_max: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Category 3: Automatisation & IA */}
              <div className="bg-[#0F1218] border border-slate-800/80 rounded-2xl p-6 space-y-6">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block mb-1">Productivité & Intelligence de Flux</span>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    Catégorie : Automatisation workflow & IA (Bases & Boosters)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Target systems unit */}
                  <div className="bg-[#141822] p-4 rounded-xl border border-slate-850 space-y-3">
                    <span className="text-xs font-bold text-slate-300 block">Frais par Outil Connecté (+)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MIN ($)</label>
                        <input
                          title="Prix minimum pour système connecté d'automatisation"
                          placeholder="Min $"
                          type="number"
                          value={pricing.automation_system_unit_min}
                          onChange={(e) => setPricing(prev => ({ ...prev, automation_system_unit_min: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MAX ($)</label>
                        <input
                          title="Prix maximum pour système connecté d'automatisation"
                          placeholder="Max $"
                          type="number"
                          value={pricing.automation_system_unit_max}
                          onChange={(e) => setPricing(prev => ({ ...prev, automation_system_unit_max: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Automation workflows unit types */}
                  <div className="bg-[#141822] p-4 rounded-xl border border-slate-850 space-y-3">
                    <span className="text-xs font-bold text-slate-300 block">Frais par Flux Configuré (+)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MIN ($)</label>
                        <input
                          title="Prix minimum pour scénario type d'automatisation"
                          placeholder="Min $"
                          type="number"
                          value={pricing.automation_type_unit_min}
                          onChange={(e) => setPricing(prev => ({ ...prev, automation_type_unit_min: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MAX ($)</label>
                        <input
                          title="Prix maximum pour scénario type d'automatisation"
                          placeholder="Max $"
                          type="number"
                          value={pricing.automation_type_unit_max}
                          onChange={(e) => setPricing(prev => ({ ...prev, automation_type_unit_max: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* AI Option Booster */}
                  <div className="bg-[#141822] p-4 rounded-xl border border-slate-855 space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 py-0.5 px-2 bg-purple-950 text-purple-400 font-bold border-l border-b border-purple-900 text-[8px] tracking-wide rounded-bl-lg">IA SPECIAL</div>
                    <span className="text-xs font-bold text-slate-300 block">Booster Intelligence Artificielle (+)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MIN ($)</label>
                        <input
                          title="Prix minimum pour booster d'intelligence artificielle"
                          placeholder="Min $"
                          type="number"
                          value={pricing.automation_ai_booster_min}
                          onChange={(e) => setPricing(prev => ({ ...prev, automation_ai_booster_min: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MAX ($)</label>
                        <input
                          title="Prix maximum pour booster d'intelligence artificielle"
                          placeholder="Max $"
                          type="number"
                          value={pricing.automation_ai_booster_max}
                          onChange={(e) => setPricing(prev => ({ ...prev, automation_ai_booster_max: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* High task volume booster */}
                  <div className="bg-[#141822] p-4 rounded-xl border border-slate-850 space-y-3">
                    <span className="text-xs font-bold text-slate-300 block">Booster Grand Volume Tasks (+)</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MIN ($)</label>
                        <input
                          title="Prix minimum pour booster de volume d'automatisation"
                          placeholder="Min $"
                          type="number"
                          value={pricing.automation_volume_booster_min}
                          onChange={(e) => setPricing(prev => ({ ...prev, automation_volume_booster_min: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1">MAX ($)</label>
                        <input
                          title="Prix maximum pour booster de volume d'automatisation"
                          placeholder="Max $"
                          type="number"
                          value={pricing.automation_volume_booster_max}
                          onChange={(e) => setPricing(prev => ({ ...prev, automation_volume_booster_max: Number(e.target.value) }))}
                          className="w-full bg-[#0F1218] border border-slate-800 rounded-lg py-1.5 px-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Dynamic submit and sync trigger actions */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={savingPricing}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-blue-800/40 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${savingPricing ? 'animate-spin' : ''}`} />
                  {savingPricing ? 'Enregistrement de la grille...' : 'Mettre à Jour la Grille de Tarification'}
                </button>
              </div>

            </form>
          </motion.div>
        )}
      </main>

      {/* Detail Slide-Over Overlay Panel */}
      <AnimatePresence>
        {selectedBrief && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            
            {/* Blurred dark background backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBrief(null)}
              className="absolute inset-0 bg-[#06080C]/80 backdrop-blur-sm"
            />

            {/* Slide over side sheet */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="w-full max-w-2xl bg-[#0F1218] border-l border-slate-800 h-full flex flex-col relative z-10 shadow-2xl overflow-y-auto"
            >
              
              {/* Header */}
              <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-[#0F1218] z-10">
                <div>
                  <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest block mb-1">
                    Dossier {selectedBrief.folder_ref}
                  </span>
                  <h3 className="text-lg font-bold text-white tracking-tight">Analyse de la Demande Onboarding</h3>
                </div>
                <button
                  onClick={() => setSelectedBrief(null)}
                  title="Fermer les détails"
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-8 space-y-8 flex-1">
                
                {/* 1. Coordonnées Section */}
                <div className="space-y-4">
                  <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-800/80 pb-2 flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-blue-500" />
                    Informations du Client (Étape 1)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#141822] rounded-xl border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block mb-1">Nom du Contact</span>
                      <span className="text-sm font-semibold text-slate-200">{selectedBrief.contact_name}</span>
                    </div>

                    <div className="p-4 bg-[#141822] rounded-xl border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block mb-1">Rôle du Contact</span>
                      <span className="text-sm font-semibold text-slate-200">{selectedBrief.specifications?.client_info_extended?.contact_role || 'Non spécifié'}</span>
                    </div>

                    <div className="p-4 bg-[#141822] rounded-xl border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block mb-1">Nom d'Entreprise</span>
                      <span className="text-sm font-semibold text-slate-200">{selectedBrief.company_name || 'Non spécifié'}</span>
                    </div>

                    <div className="p-4 bg-[#141822] rounded-xl border border-slate-800/60 font-medium">
                      <span className="text-[10px] text-slate-500 block mb-1">Adresse E-mail</span>
                      <a
                        href={`mailto:${selectedBrief.email}`}
                        className="text-sm font-semibold text-blue-400 hover:underline flex items-center gap-1.5 mt-0.5"
                      >
                        <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        {selectedBrief.email}
                      </a>
                    </div>

                    <div className="p-4 bg-[#141822] rounded-xl border border-slate-800/60 font-medium">
                      <span className="text-[10px] text-slate-500 block mb-1">Téléphone</span>
                      <a
                        href={`tel:${selectedBrief.phone}`}
                        className="text-sm font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 mt-0.5"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {selectedBrief.phone}
                      </a>
                    </div>

                    <div className="p-4 bg-[#141822] rounded-xl border border-slate-800/60">
                      <span className="text-[10px] text-slate-500 block mb-1">Secteur d'Activité</span>
                      <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-slate-500" />
                        {selectedBrief.industry}
                      </span>
                    </div>

                    {selectedBrief.specifications?.client_info_extended?.project_objective && (
                      <div className="p-4 bg-[#141822] rounded-xl border border-slate-800/60 sm:col-span-2">
                        <span className="text-[10px] text-slate-500 block mb-1">Objectif principal du projet</span>
                        <p className="text-xs text-slate-350 italic leading-relaxed">
                          "{selectedBrief.specifications.client_info_extended.project_objective}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status selection update in details */}
                <div className="space-y-4">
                  <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-800/80 pb-2 flex items-center gap-2">
                    <BookmarkCheck className="w-3.5 h-3.5 text-blue-400" />
                    Statut Opérationnel (En Direct)
                  </h4>
                  <div className="p-4 border border-slate-800 bg-[#0F1218] rounded-xl flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Sliders className="w-4 h-4 text-slate-500" />
                      Statut actuel du Projet :
                    </div>
                    <select
                      title="Modifier le statut actuel"
                      value={selectedBrief.status || 'Nouveau'}
                      onChange={async (e) => {
                        const nextStatus = e.target.value;
                        await handleStatusChange(selectedBrief.id, nextStatus);
                        setSelectedBrief(prev => prev ? { ...prev, status: nextStatus } : null);
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-sans cursor-pointer focus:outline-none transition-all ${
                        (selectedBrief.status || 'Nouveau') === 'Nouveau'
                          ? 'bg-blue-950/40 border-blue-800/40 text-blue-400'
                          : (selectedBrief.status || 'Nouveau') === 'En cours'
                          ? 'bg-amber-950/40 border-amber-805/40 text-amber-500'
                          : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400'
                      }`}
                    >
                      <option value="Nouveau" className="bg-[#0F1218] text-blue-400">Nouveau</option>
                      <option value="En cours" className="bg-[#0F1218] text-amber-500">En cours</option>
                      <option value="Validé" className="bg-[#0F1218] text-emerald-400">Validé</option>
                    </select>
                  </div>
                </div>

                {/* 2. Cahier des charges / Spécifications */}
                <div className="space-y-4">
                  <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-800/80 pb-2 flex items-center gap-2">
                    <Laptop className="w-3.5 h-3.5 text-indigo-500" />
                    Spécifications Techniques (Étapes 2 & 3)
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Render specs according to selected categories */}
                    {selectedBrief.project_types.map((type) => {
                      const specDetails = selectedBrief.specifications?.website && type === 'website' ? selectedBrief.specifications.website : (selectedBrief.specifications?.[type] || null);
                      if (!specDetails) return null;

                      return (
                        <div key={type} className="p-5 bg-[#141822] rounded-xl border border-slate-800/60 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="font-bold text-slate-200 uppercase tracking-wide text-xs">
                              {type === 'website' ? 'Site Internet' : type === 'application' ? 'Application Web / Mobile' : type === 'automation' ? 'Automatisation workflow & IA' : 'Ticket Support'}
                            </span>
                            <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-blue-400 font-mono">Actif</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs pt-1.5 shrink-0">
                            {type === 'website' && (
                              <>
                                <div><span className="text-slate-500 block mb-0.5">Type de site :</span> <span className="font-bold text-slate-300 capitalize">{specDetails.siteType}</span></div>
                                <div><span className="text-slate-500 block mb-0.5">Taille de volume :</span> <span className="font-bold text-slate-300 capitalize">{specDetails.pageSize}</span></div>
                                <div><span className="text-slate-500 block mb-0.5">Design :</span> <span className="font-bold text-slate-300 capitalize">{specDetails.designType}</span></div>
                                <div className="col-span-2 mt-1">
                                  <span className="text-slate-500 block mb-1">Fonctionnalités requises :</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {specDetails.features && specDetails.features.length > 0 ? (
                                      specDetails.features.map((f: string) => (
                                        <span key={f} className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 leading-none">{f}</span>
                                      ))
                                    ) : (
                                      <span className="text-slate-500 italic">Aucune</span>
                                    )}
                                  </div>
                                </div>
                                {specDetails.messagePrincipal && (
                                  <div className="col-span-2 mt-1">
                                    <span className="text-slate-500 block mb-0.5">Message principal :</span>
                                    <p className="text-slate-300 italic">"{specDetails.messagePrincipal}"</p>
                                  </div>
                                )}
                                {specDetails.charteGraphicReady && (
                                  <div>
                                    <span className="text-slate-500 block mb-0.5">Charte & textes :</span>
                                    <span className="font-bold text-slate-300">
                                      {specDetails.charteGraphicReady === 'yes' ? 'Tout est prêt' : specDetails.charteGraphicReady === 'partial' ? 'Partiellement prêts' : 'À concevoir'}
                                    </span>
                                  </div>
                                )}
                                {specDetails.indispensablePages && (
                                  <div className="col-span-2 mt-1">
                                    <span className="text-slate-500 block mb-0.5">Pages indispensables :</span>
                                    <span className="text-slate-300">{specDetails.indispensablePages}</span>
                                  </div>
                                )}
                                {specDetails.benchmarkSites && (
                                  <div className="col-span-2 mt-1">
                                    <span className="text-slate-500 block mb-0.5">Sites d'inspiration :</span>
                                    <span className="text-slate-300">{specDetails.benchmarkSites}</span>
                                  </div>
                                )}
                              </>
                            )}

                            {type === 'application' && (
                              <>
                                <div><span className="text-slate-500 block mb-0.5">Complexité :</span> <span className="font-bold text-slate-300 capitalize">{specDetails.complexity}</span></div>
                                <div><span className="text-slate-500 block mb-0.5">Calendrier :</span> <span className="font-bold text-slate-300 capitalize">{specDetails.timeline}</span></div>
                                <div><span className="text-slate-500 block mb-0.5">Authentification :</span> <span className="font-bold text-slate-300">{specDetails.needsAuth ? 'Oui' : 'Non'}</span></div>
                                <div><span className="text-slate-500 block mb-0.5">Base de données :</span> <span className="font-bold text-slate-300">{specDetails.needsDatabase ? 'Oui' : 'Non'}</span></div>
                                <div className="col-span-2">
                                  <span className="text-slate-500 block mb-1">Plateformes :</span>
                                  <div className="flex flex-wrap gap-1">
                                    {specDetails.platforms?.map((p: string) => (
                                      <span key={p} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 uppercase font-mono text-[10px]">{p}</span>
                                    ))}
                                  </div>
                                </div>
                                <div className="col-span-2 mt-1">
                                  <span className="text-slate-500 block mb-1">API & Intégrations :</span>
                                  <div className="flex flex-wrap gap-1">
                                    {specDetails.integrations?.map((i: string) => (
                                      <span key={i} className="px-2 py-0.5 rounded bg-indigo-950/20 text-indigo-400 border border-indigo-900/40 leading-none">{i}</span>
                                    ))}
                                  </div>
                                </div>
                                {specDetails.mainProblem && (
                                  <div className="col-span-2 mt-1.5">
                                    <span className="text-slate-500 block mb-0.5">Problème principal :</span>
                                    <p className="text-slate-300 italic">"{specDetails.mainProblem}"</p>
                                  </div>
                                )}
                                {specDetails.userRoles && (
                                  <div className="col-span-2 mt-1">
                                    <span className="text-slate-500 block mb-0.5">Rôles utilisateurs requis :</span>
                                    <span className="text-slate-300">{specDetails.userRoles}</span>
                                  </div>
                                )}
                                {specDetails.mvpFeatures && (
                                  <div className="col-span-2 mt-1">
                                    <span className="text-slate-500 block mb-0.5">Fonctionnalités indispensables MVP :</span>
                                    <span className="text-slate-300">{specDetails.mvpFeatures}</span>
                                  </div>
                                )}
                                {specDetails.dataSource && (
                                  <div className="col-span-2 mt-1">
                                    <span className="text-slate-500 block mb-0.5">Source des données :</span>
                                    <span className="text-slate-300">{specDetails.dataSource}</span>
                                  </div>
                                )}
                              </>
                            )}

                            {type === 'automation' && (
                              <>
                                <div><span className="text-slate-500 block mb-0.5">IA Native :</span> <span className="font-bold text-slate-300">{specDetails.hasAi ? 'Oui' : 'Non'}</span></div>
                                <div><span className="text-slate-500 block mb-0.5">Volume mensuel est. :</span> <span className="font-bold font-mono text-slate-300">{specDetails.volumeEstimate} tâches</span></div>
                                <div className="col-span-2">
                                  <span className="text-slate-500 block mb-1">Outils d'intégration :</span>
                                  <div className="flex flex-wrap gap-1">
                                    {specDetails.targetSystems?.map((sys: string) => (
                                      <span key={sys} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-mono text-[10px]">{sys}</span>
                                    ))}
                                  </div>
                                </div>
                                {specDetails.hasAi && specDetails.aiDescription && (
                                  <div className="col-span-2 mt-1.5 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                                    <span className="text-slate-500 block mb-1 text-[10px] font-bold uppercase tracking-wider">Demande d'Intelligence Artificielle :</span>
                                    <p className="text-slate-300 italic leading-relaxed text-[11px]">{specDetails.aiDescription}</p>
                                  </div>
                                )}
                                {specDetails.manualProcess && (
                                  <div className="col-span-2 mt-1.5">
                                    <span className="text-slate-500 block mb-0.5">Processus manuel actuel :</span>
                                    <p className="text-slate-300 italic">"{specDetails.manualProcess}"</p>
                                  </div>
                                )}
                                {specDetails.currentTools && (
                                  <div className="col-span-2 mt-1">
                                    <span className="text-slate-500 block mb-0.5">Outils de communication :</span>
                                    <span className="text-slate-300">{specDetails.currentTools}</span>
                                  </div>
                                )}
                                {specDetails.hasAiIntegration && (
                                  <div>
                                    <span className="text-slate-500 block mb-0.5">Intégration d'IA voulue :</span>
                                    <span className="font-bold text-slate-300 font-sans">
                                      {specDetails.hasAiIntegration === 'yes' ? 'Oui, fortement' : specDetails.hasAiIntegration === 'study' ? 'À étudier' : 'Non'}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}

                            {type === 'support' && (
                              <div className="col-span-2">
                                <span className="text-slate-500 block mb-1.5 font-semibold text-[10px] uppercase tracking-wider">Message d'aide / Question :</span>
                                <p className="text-slate-200 bg-slate-950/60 p-3.5 rounded-xl border border-slate-850/60 font-sans text-xs whitespace-pre-wrap leading-relaxed">
                                  {specDetails.support_message || selectedBrief.special_instructions || 'Aucun message'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Metadata summary (complexity level, delivery timeline) */}
                    <div className="p-4 border border-slate-800 bg-[#0F1218] rounded-xl flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-4 h-4 text-slate-500" />
                        Complexité globale estimée :
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] border border-blue-800/40 bg-blue-950/20 text-blue-400 font-bold uppercase font-mono">
                        {selectedBrief.complexity_level}
                      </span>
                    </div>

                    <div className="p-4 border border-slate-800 bg-[#0F1218] rounded-xl flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        Délai de livraison fixé :
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] border border-indigo-800/40 bg-indigo-950/20 text-indigo-400 font-bold uppercase font-mono">
                        {selectedBrief.delivery_deadline}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Budget Cible & Devis Estime */}
                <div className="space-y-4">
                  <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-800/80 pb-2 flex items-center gap-2">
                    <Euro className="w-3.5 h-3.5 text-emerald-500" />
                    Cible Budget & Estimation Financière (Étape 4)
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#141822] rounded-xl border border-slate-800/60 flex flex-col justify-center">
                      <span className="text-[10px] text-slate-500 block mb-1">Budget Souhaité par le Client</span>
                      <span className="text-xl font-black text-emerald-400">
                        {selectedBrief.client_target_budget === 800 && selectedBrief.specifications?.section3?.budget_tranche === 'less_1000'
                          ? 'Moins de 1 000 $'
                          : selectedBrief.client_target_budget === 2000 && selectedBrief.specifications?.section3?.budget_tranche === 'between_1000_3000'
                          ? 'Entre 1 000 $ et 3 000 $'
                          : formatUSD(selectedBrief.client_target_budget)}
                      </span>
                      {selectedBrief.specifications?.section3?.budget_tranche && (
                        <span className="text-[10px] text-slate-400 mt-1 font-semibold">
                          Tranche sélectionnée : {
                            selectedBrief.specifications.section3.budget_tranche === 'less_1000'
                              ? 'Moins de 1 000 $'
                              : selectedBrief.specifications.section3.budget_tranche === 'between_1000_3000'
                              ? 'Entre 1 000 $ et 3 000 $'
                              : 'Plus de 3 000 $'
                          }
                        </span>
                      )}
                    </div>

                    <div className="p-4 bg-blue-950/20 rounded-xl border border-blue-900/40">
                      <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wide block mb-1">Calculateur Nuvatech (Devis)</span>
                      <span className="text-base font-black text-white flex items-baseline gap-1">
                        {formatUSD(selectedBrief.estimated_min_price)} <span className="text-slate-500 font-medium text-xs">à</span> {formatUSD(selectedBrief.estimated_max_price)}
                      </span>
                    </div>

                    {selectedBrief.specifications?.section3?.delivery_date && (
                      <div className="p-4 bg-[#141822] rounded-xl border border-slate-800/60 sm:col-span-2">
                        <span className="text-[10px] text-slate-500 block mb-1">Date limite de livraison souhaitée</span>
                        <span className="text-sm font-semibold text-slate-200">{selectedBrief.specifications.section3.delivery_date}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Instructions Spéciales */}
                <div className="space-y-4">
                  <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-800/80 pb-2 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    Consignes Spécifiques & Instructions Additionnelles
                  </h4>
                  <div className="p-5 bg-[#141822] rounded-xl border border-slate-800/60 font-medium">
                    {selectedBrief.special_instructions ? (
                      <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                        {selectedBrief.special_instructions}
                      </p>
                    ) : (
                      <p className="text-slate-500 text-xs italic">
                        Le client n'a pas laissé de consignes ou d'instructions supplémentaires pour ce brief.
                      </p>
                    )}
                  </div>
                </div>

                {/* 5. Pièces Jointes & Liens Utiles */}
                {((selectedBrief.specifications?.attachments && selectedBrief.specifications.attachments.length > 0) ||
                  (selectedBrief.specifications?.links && selectedBrief.specifications.links.length > 0)) && (
                  <div className="space-y-4">
                    <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-800/80 pb-2 flex items-center gap-2">
                      <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                      Documents & Liens Joints par le Client
                    </h4>
                    
                    <div className="space-y-3">
                      {/* Files list */}
                      {selectedBrief.specifications?.attachments && selectedBrief.specifications.attachments.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Fichiers ({selectedBrief.specifications.attachments.length}) :</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {selectedBrief.specifications.attachments.map((file: any, idx: number) => (
                              <a
                                key={idx}
                                href={file.dataUrl}
                                download={file.name}
                                className="flex justify-between items-center bg-[#141822] hover:bg-slate-900 border border-slate-800/60 hover:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs text-blue-400 hover:text-blue-300 font-medium transition-all group cursor-pointer"
                                title={`Télécharger ${file.name}`}
                              >
                                <span className="truncate pr-2 max-w-[220px]">
                                  📎 {file.name}
                                </span>
                                <span className="text-[9px] text-slate-500 font-mono group-hover:text-blue-400 shrink-0">
                                  ({Math.round(file.size / 1024)} Ko)
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Links list */}
                      {selectedBrief.specifications?.links && selectedBrief.specifications.links.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-800/40">
                          <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Liens Utiles :</span>
                          <div className="space-y-1.5">
                            {selectedBrief.specifications.links.map((link: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 bg-[#141822] border border-slate-800/60 px-3.5 py-2.5 rounded-xl text-xs">
                                <a
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:underline truncate flex-1 font-medium cursor-pointer"
                                  title={link}
                                >
                                  🔗 {link}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit dates */}
                <div className="text-[11px] text-slate-605 text-right font-semibold">
                  Dossier reçu le {formatDateString(selectedBrief.submitted_at)}
                </div>

              </div>

              {/* Footer action buttons */}
              <div className="p-8 border-t border-slate-800 bg-[#141822]/20 flex flex-col sm:flex-row gap-3.5 sticky bottom-0">
                <a
                  href={`mailto:${selectedBrief.email}?subject=Réponse à votre brief de projet Nuvatech Solutions (Réf: ${selectedBrief.folder_ref})`}
                  className="flex-1 bg-slate-900 border border-slate-800/80 hover:bg-slate-850 text-slate-300 font-bold py-3 px-4 rounded-xl text-xs transition-all text-center flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4 text-blue-500" />
                  Contacter par Email
                </a>
                <button
                  onClick={() => handleGeneratePrompt(selectedBrief)}
                  className="flex-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all text-center flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.15)]"
                >
                  <Cpu className="w-4 h-4" />
                  Générer le Prompt de Développement
                </button>
                <button
                  onClick={() => setSelectedBrief(null)}
                  className="px-6 py-3 border border-slate-800 bg-[#0F1218] hover:bg-slate-900 text-slate-300 hover:text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Fermer
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Prompt Modal Overlay */}
      <AnimatePresence>
        {promptModalContent && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPromptModalContent(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0F1218] border border-slate-800 w-full max-w-2xl rounded-2xl p-6 relative z-10 shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4 animate-none">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-600/10 border border-blue-900/30 text-blue-400">
                    <Terminal className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Prompt de Développement Généré</h3>
                    <p className="text-[10px] text-slate-500">Prêt à être collé dans Google AI Studio ou VS Code</p>
                  </div>
                </div>
                <button
                  onClick={() => setPromptModalContent(null)}
                  title="Fermer le modal"
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Notice */}
              <div className="p-3 bg-blue-950/10 border border-blue-900/30 rounded-xl mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>Le prompt a été copié automatiquement dans le presse-papiers !</span>
                </div>
                {promptCopied && (
                  <span className="text-[10px] bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-bounce">
                    Copié !
                  </span>
                )}
              </div>

              {/* Text Area */}
              <div className="w-full flex mb-5">
                <textarea
                  readOnly
                  title="Contenu du prompt de développement"
                  placeholder="Contenu du prompt..."
                  value={promptModalContent}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  className="w-full bg-[#141822] border border-slate-800/80 rounded-xl p-4 text-xs font-mono text-slate-300 focus:outline-none focus:text-slate-200 resize-none h-[400px] overflow-y-auto"
                />
              </div>

              {/* Footer */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(promptModalContent);
                    setPromptCopied(true);
                    setTimeout(() => setPromptCopied(false), 3000);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer"
                >
                  {promptCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {promptCopied ? 'Copié !' : 'Recopier le prompt'}
                </button>
                <button
                  onClick={() => setPromptModalContent(null)}
                  className="px-4 py-2.5 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white font-semibold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Mock onboarding data in case local demo is run without active Supabase variables
function getMockOnboardings(): OnboardingBrief[] {
  return [
    {
      id: 'mock-1',
      contact_name: 'Stéphane Picard',
      company_name: 'Hélios Industries',
      email: 's.picard@helios-ind.fr',
      phone: '+33 6 12 34 56 78',
      industry: 'Industrie & Énergie',
      project_types: ['website', 'application'],
      specifications: {
        website: {
          siteType: 'vitrine',
          pageSize: 'medium',
          designType: 'custom',
          features: ['contact', 'seo']
        },
        application: {
          platforms: ['web'],
          needsAuth: true,
          needsDatabase: true,
          integrations: ['stripe'],
          complexity: 'medium',
          timeline: 'standard'
        }
      },
      complexity_level: 'medium',
      delivery_deadline: 'standard',
      client_target_budget: 15000,
      estimated_min_price: 13000,
      estimated_max_price: 18000,
      special_instructions: "Nous souhaiterions connecter une interface d'administration à notre CRM interne actuel en phase 2. Ce devis initial servira d'estimation pour notre comité de direction de fin de trimestre.",
      folder_ref: 'NUV-HL89Z1',
      submitted_at: new Date(Date.now() - 3600000 * 2.5).toISOString(),
      status: 'En cours'
    },
    {
      id: 'mock-2',
      contact_name: 'Amandine Renaud',
      company_name: 'Aura Cosmétiques',
      email: 'contact@aura-cosmetics.co.uk',
      phone: '+33 1 45 89 23 11',
      industry: 'E-commerce & Retail',
      project_types: ['website', 'automation'],
      specifications: {
        website: {
          siteType: 'ecommerce',
          pageSize: 'large',
          designType: 'custom',
          features: ['contact', 'payment', 'multilang']
        },
        automation: {
          targetSystems: ['crm', 'stripe', 'slack'],
          automationType: ['leads', 'reporting'],
          hasAi: true,
          aiDescription: "Envoi de rapports automatisés basés sur de la catégorisation par IA des retours clients (sentiment analysis)."
        }
      },
      complexity_level: 'complex',
      delivery_deadline: 'standard',
      client_target_budget: 25000,
      estimated_min_price: 18500,
      estimated_max_price: 27000,
      special_instructions: "La synchronisation instantanée du stock avec notre ERP physique est un point absolument bloquant pour notre lancements de produits.",
      folder_ref: 'NUV-AU22B0',
      submitted_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      status: 'Nouveau'
    },
    {
      id: 'mock-3',
      contact_name: 'Julien Mercier',
      company_name: 'EduNode Ltd',
      email: 'j.mercier@edunode.edu',
      phone: '+33 7 88 56 34 21',
      industry: 'Éducation & Formation',
      project_types: ['application'],
      specifications: {
        application: {
          platforms: ['web', 'ios', 'android'],
          needsAuth: true,
          needsDatabase: true,
          integrations: ['stripe', 'calendar'],
          complexity: 'complex',
          timeline: 'flexible'
        }
      },
      complexity_level: 'complex',
      delivery_deadline: 'flexible',
      client_target_budget: 35000,
      estimated_min_price: 31050,
      estimated_max_price: 49000,
      special_instructions: 'Besoin de mettre en place des flux de visioconférences planifiés et des passerelles de paiement réutilisables.',
      folder_ref: 'NUV-ED08X9',
      submitted_at: new Date(Date.now() - 3600000 * 40).toISOString(),
      status: 'Validé'
    }
  ];
}
