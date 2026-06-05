/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Terminal, CheckCircle2, ChevronRight, MessageSquareCode, HelpCircle, Mail, X, Paperclip, Link2, Trash2, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import ClientInfoStep from './features/onboarding/components/ClientInfoStep';
import ServiceSelectorStep from './features/onboarding/components/ServiceSelectorStep';
import DynamicQuestionsStep from './features/onboarding/components/DynamicQuestionsStep';
import SummaryStep from './features/onboarding/components/SummaryStep';
import SuccessView from './features/onboarding/components/SuccessView';
import AdminLogin from './features/admin/components/AdminLogin';
import AdminDashboard from './features/admin/components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ThemeSelector from './components/ThemeSelector';
import { submitBrief, fetchAppSettings, fetchAppSectors, submitSupportMessage, logErrorInDb, trackVisit, saveDraftBrief, fetchGeneralSettings, DEFAULT_GENERAL_SETTINGS } from './services/supabase';
import { t, Language } from './services/i18n';
import {
  FormSubmission,
  INITIAL_FORM_STATE,
  ServiceType,
  WebsiteDetails,
  ApplicationDetails,
  AutomationDetails,
  PricingSettings,
  DEFAULT_SECTORS,
  AttachmentFile,
  GeneralSettings
} from './types/index';

const convertFileToAttachment = (file: File): Promise<AttachmentFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      resolve({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result as string
      });
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function App() {
  // Language state
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('nuvatech_lang') as Language) || 'fr';
  });

  const toggleLanguage = () => {
    const nextLang: Language = lang === 'fr' ? 'en' : 'fr';
    setLang(nextLang);
    localStorage.setItem('nuvatech_lang', nextLang);
  };

  // Simple path routing
  const [currentRoute, setCurrentRoute] = useState<string>(() => window.location.pathname);
  
  // Custom dynamic pricing variables state
  const [pricingSettings, setPricingSettings] = useState<Partial<PricingSettings> | undefined>(undefined);

  // Custom sectors list state
  const [sectors, setSectors] = useState<string[]>(DEFAULT_SECTORS);

  useEffect(() => {
    const loadPricing = async () => {
      try {
        const settings = await fetchAppSettings();
        if (settings) {
          setPricingSettings(settings);
        }
      } catch (err) {
        console.error("Failed to fetch app settings:", err);
      }
    };
    loadPricing();
  }, []);

  useEffect(() => {
    const loadSectors = async () => {
      try {
        const data = await fetchAppSectors();
        if (data && data.length > 0) {
          setSectors(data);
        }
      } catch (err) {
        console.error("Failed to fetch app sectors:", err);
      }
    };
    loadSectors();
  }, []);

  // General settings state
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(DEFAULT_GENERAL_SETTINGS);

  useEffect(() => {
    const loadGeneral = async () => {
      try {
        const settings = await fetchGeneralSettings();
        if (settings) {
          setGeneralSettings(settings);
          
          // Apply custom CSS
          if (settings.custom_css && typeof document !== 'undefined') {
            let styleEl = document.getElementById('nuvatech-custom-css');
            if (!styleEl) {
              styleEl = document.createElement('style');
              styleEl.id = 'nuvatech-custom-css';
              document.head.appendChild(styleEl);
            }
            styleEl.innerHTML = settings.custom_css;
          }

          // Apply custom JS safely
          if (settings.custom_js) {
            try {
              const oldScript = document.getElementById('nuvatech-custom-js');
              if (oldScript) oldScript.remove();
              const script = document.createElement('script');
              script.id = 'nuvatech-custom-js';
              script.text = settings.custom_js;
              document.body.appendChild(script);
            } catch (jsErr) {
              console.error('Failed to execute custom JS:', jsErr);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch general settings:", err);
      }
    };
    loadGeneral();
  }, []);

  // Track visit and configure error handlers
  useEffect(() => {
    // 1. Track visit
    trackVisit().catch(err => console.warn('Failed tracking visit:', err));

    // 2. Global error listener
    const handleError = (event: ErrorEvent) => {
      const message = event.message || 'Unknown Javascript Error';
      const stack = event.error ? event.error.stack : '';
      const component = 'Client Global Exception';
      logErrorInDb(message, stack, component).catch(e => console.warn('Error logger failed:', e));
    };

    // 3. Global unhandled promise rejection listener
    const handleRejection = (event: PromiseRejectionEvent) => {
      const message = `Promise Rejection: ${event.reason ? (event.reason.message || event.reason.toString()) : 'No reason given'}`;
      const stack = event.reason && event.reason.stack ? event.reason.stack : '';
      const component = 'Client Async Rejection';
      logErrorInDb(message, stack, component).catch(e => console.warn('Error logger failed:', e));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentRoute(path);
  };

  // Helper to generate a random mock folder reference
  const generateNewFolderRef = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let res = 'NUV-';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  // State initialized with saved status from local storage
  const [step, setStep] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nuvatech_form_step');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to restore form step from localStorage', e);
    }
    return 1;
  });

  const [formData, setFormData] = useState<FormSubmission>(() => {
    try {
      const saved = localStorage.getItem('nuvatech_form_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.clientInfo) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to restore form data from localStorage', e);
    }
    return INITIAL_FORM_STATE;
  });

  const [folderRef, setFolderRef] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('nuvatech_folder_ref');
      if (saved && saved.trim() !== '') {
        return saved;
      }
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let res = 'NUV-';
      for (let i = 0; i < 6; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      localStorage.setItem('nuvatech_folder_ref', res);
      return res;
    } catch (e) {
      return 'NUV-ABC123';
    }
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Support modal states
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);
  const [supportName, setSupportName] = useState<string>('');
  const [supportEmail, setSupportEmail] = useState<string>('');
  const [supportMessage, setSupportMessage] = useState<string>('');
  const [isSendingSupport, setIsSendingSupport] = useState<boolean>(false);
  const [supportSubmitSuccess, setSupportSubmitSuccess] = useState<boolean>(false);
  const [supportSubmitError, setSupportSubmitError] = useState<string | null>(null);

  // Attachments support states
  const [supportFiles, setSupportFiles] = useState<AttachmentFile[]>([]);
  const [supportLinks, setSupportLinks] = useState<string[]>([]);
  const [newSupportLink, setNewSupportLink] = useState<string>('');
  const [supportFileError, setSupportFileError] = useState<string | null>(null);

  const handleSupportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setSupportFileError(null);

    if (supportFiles.length + files.length > 5) {
      setSupportFileError(t('max_files_warning', lang));
      return;
    }

    const newFiles: AttachmentFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 2 * 1024 * 1024) {
        setSupportFileError(lang === 'en' ? `File ${file.name} exceeds the 2 MB limit.` : `Le fichier ${file.name} dépasse la limite de 2 Mo.`);
        continue;
      }
      try {
        const attachment = await convertFileToAttachment(file);
        newFiles.push(attachment);
      } catch (err) {
        console.error("Error reading file", err);
      }
    }
    setSupportFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveSupportFile = (index: number) => {
    setSupportFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddSupportLink = () => {
    if (!newSupportLink.trim()) return;
    let url = newSupportLink.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    try {
      new URL(url);
      setSupportLinks(prev => [...prev, url]);
      setNewSupportLink('');
    } catch (_) {
      setSupportFileError(lang === 'en' ? "Please enter a valid URL." : "Veuillez entrer une URL valide.");
    }
  };

  const handleRemoveSupportLink = (index: number) => {
    setSupportLinks(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (isSupportModalOpen) {
      setSupportName(formData.clientInfo.contactName || '');
      setSupportEmail(formData.clientInfo.email || '');
      setSupportMessage('');
      setSupportFiles([]);
      setSupportLinks([]);
      setNewSupportLink('');
      setSupportFileError(null);
      setSupportSubmitSuccess(false);
      setSupportSubmitError(null);
    }
  }, [isSupportModalOpen, formData.clientInfo.contactName, formData.clientInfo.email]);

  const handleSendSupportMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportName.trim() || !supportEmail.trim() || !supportMessage.trim()) return;

    setIsSendingSupport(true);
    setSupportSubmitError(null);

    try {
      // 1. Save to Supabase client_onboardings table
      const res = await submitSupportMessage(supportName, supportEmail, supportMessage, supportFiles, supportLinks);

      // 2. Open local mail client pre-filled (mailto link)
      const subject = `[Support Onboarding] Message de ${supportName}`;
      let body = `Bonjour,\n\nVous avez reçu un nouveau message de support depuis le formulaire d'onboarding.\n\n` +
        `---------------------------------------\n` +
        `Nom complet : ${supportName}\n` +
        `Email de contact : ${supportEmail}\n` +
        `---------------------------------------\n\n` +
        `Message :\n${supportMessage}\n`;

      if (supportFiles.length > 0) {
        body += `\n[Fichiers joints (enregistrés dans la base de données Nuvatech)] :\n` +
          supportFiles.map(f => `- ${f.name} (${Math.round(f.size / 1024)} Ko)`).join('\n') + `\n`;
      }
      if (supportLinks.length > 0) {
        body += `\n[Liens joints] :\n` +
          supportLinks.map(l => `- ${l}`).join('\n') + `\n`;
      }

      const mailtoUrl = `mailto:${generalSettings.support_email || 'nuvatechsolutions386@keemail.me'}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoUrl;

      if (res.success) {
        setSupportSubmitSuccess(true);
        // Automatically close modal after a short delay
        setTimeout(() => {
          setIsSupportModalOpen(false);
        }, 2500);
      } else {
        setSupportSubmitError(res.error || "Une erreur s'est produite lors de la transmission.");
      }
    } catch (err: any) {
      setSupportSubmitError(err.message || "Erreur de connexion.");
    } finally {
      setIsSendingSupport(false);
    }
  };

  // Sync state changes with localStorage for robust resume capability
  useEffect(() => {
    try {
      localStorage.setItem('nuvatech_form_data', JSON.stringify(formData));
    } catch (e) {
      console.error('Failed to save form data to localStorage', e);
    }
  }, [formData]);

  useEffect(() => {
    try {
      localStorage.setItem('nuvatech_form_step', step.toString());
    } catch (e) {
      console.error('Failed to save form step to localStorage', e);
    }
  }, [step]);

  // Partial handlers for clean updates
  const handleClientInfoChange = (clientInfo: FormSubmission['clientInfo']) => {
    setFormData((prev) => ({ ...prev, clientInfo }));
  };

  const handleToggleService = (service: ServiceType) => {
    setFormData((prev) => {
      const nextServices = {
        ...prev.servicesSelected,
        [service]: !prev.servicesSelected[service],
      };
      return {
        ...prev,
        servicesSelected: nextServices,
      };
    });
  };

  const handleWebDetailsChange = (website: WebsiteDetails) => {
    setFormData((prev) => ({
      ...prev,
      details: { ...prev.details, website },
    }));
  };

  const handleAppDetailsChange = (application: ApplicationDetails) => {
    setFormData((prev) => ({
      ...prev,
      details: { ...prev.details, application },
    }));
  };

  const handleAutoDetailsChange = (automation: AutomationDetails) => {
    setFormData((prev) => ({
      ...prev,
      details: { ...prev.details, automation },
    }));
  };

  const handleBudgetChange = (globalBudget: number) => {
    setFormData((prev) => ({ ...prev, globalBudget }));
  };

  const handleBudgetTrancheChange = (budgetTranche: FormSubmission['budgetTranche']) => {
    setFormData((prev) => {
      let globalBudget = prev.globalBudget;
      if (budgetTranche === 'less_1000') {
        globalBudget = 800;
      } else if (budgetTranche === 'between_1000_3000') {
        globalBudget = 2000;
      } else if (budgetTranche === 'more_3000' && prev.globalBudget <= 3000) {
        globalBudget = 5000;
      }
      return { ...prev, budgetTranche, globalBudget };
    });
  };

  const handleDeliveryDateChange = (deliveryDate: string) => {
    setFormData((prev) => ({ ...prev, deliveryDate }));
  };

  const handleTechnicalConstraintsChange = (technicalConstraints: string) => {
    setFormData((prev) => ({ ...prev, technicalConstraints }));
  };

  const handleNotesChange = (additionalNotes: string) => {
    setFormData((prev) => ({ ...prev, additionalNotes }));
  };

  const handleAttachmentsChange = (attachments: AttachmentFile[]) => {
    setFormData((prev) => ({ ...prev, attachments }));
  };

  const handleLinksChange = (links: string[]) => {
    setFormData((prev) => ({ ...prev, links }));
  };

  const handleFormReset = () => {
    try {
      localStorage.removeItem('nuvatech_form_data');
      localStorage.removeItem('nuvatech_form_step');
      localStorage.removeItem('nuvatech_folder_ref');
    } catch (e) {
      console.error('Failed to clear localStorage on reset', e);
    }

    const newRef = generateNewFolderRef();
    try {
      localStorage.setItem('nuvatech_folder_ref', newRef);
    } catch (e) {
      console.error('Failed to store new folder ref during reset', e);
    }

    setFormData(INITIAL_FORM_STATE);
    setFolderRef(newRef);
    setSubmitError(null);
    setStep(1);
  };

  const handleFormSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const result = await submitBrief(formData, folderRef, pricingSettings);

    if (result.success) {
      // Upon successful submit to Supabase, we progress to step 5.
      setStep(5);
    } else {
      setSubmitError(
        result.error || "Une erreur est survenue lors de l'envoi de votre brief technique."
      );
    }
    setIsSubmitting(false);
  };

  // Helper labels for steps
  const stepsMeta = [
    { number: 1, name: t('step_name_1', lang), tagline: t('step_tag_1', lang) },
    { number: 2, name: t('step_name_2', lang), tagline: t('step_tag_2', lang) },
    { number: 3, name: t('step_name_3', lang), tagline: t('step_tag_3', lang) },
    { number: 4, name: t('step_name_4', lang), tagline: t('step_tag_4', lang) },
  ];

  if (currentRoute === '/admin/login') {
    return (
      <AdminLogin
        onNavigate={navigateTo}
        onLoginSuccess={() => navigateTo('/admin/dashboard')}
      />
    );
  }

  if (currentRoute.startsWith('/admin')) {
    return (
      <ProtectedRoute
        fallback={
          <AdminLogin
            onNavigate={navigateTo}
            onLoginSuccess={() => navigateTo('/admin/dashboard')}
          />
        }
      >
        <AdminDashboard onLogout={() => navigateTo('/')} />
      </ProtectedRoute>
    );
  }

  if (generalSettings.maintenance_mode) {
    return (
      <div className="min-h-screen bg-[#0A0C10] text-[#E2E8F0] flex flex-col justify-center items-center relative overflow-hidden font-sans px-4">
        {/* Background radial glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="text-center max-w-lg space-y-6 relative z-10">
          <div className="inline-flex items-center justify-center p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-3xl mb-2 shadow-[0_0_20px_rgba(245,158,11,0.15)] animate-pulse">
            <Terminal className="w-8 h-8 stroke-[2]" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#E2E8F0] tracking-tight">
            Maintenance en cours
          </h2>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed whitespace-pre-line bg-[#0F1218] border border-slate-800 p-6 rounded-2xl">
            {generalSettings.maintenance_message || "Le site est actuellement en maintenance pour mise à jour. Nous serons de retour très rapidement !"}
          </p>
          <div className="text-[10px] text-slate-500 font-mono">
            Nuvatech-Solutions &bull; Espace administration via /admin/login
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="master-app-container" className="min-h-screen bg-[#0A0C10] text-[#E2E8F0] flex flex-col md:flex-row antialiased selection:bg-blue-600 selection:text-white font-sans">
      
      {/* Sidebar Navigation - Fixed/Sticky on Desktop, hidden on Mobile */}
      <aside className="w-72 bg-[#0F1218] border-r border-slate-800/80 flex flex-col p-8 shrink-0 relative sticky top-0 h-auto md:h-screen hidden md:flex">
        {/* Subtle decorative background glow in sidebar */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="mb-12">
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Nuvatech-Solutions
          </h1>
          <p className="text-slate-500 text-[10px] mt-1.5 uppercase tracking-widest font-bold">{t('client_onboarding', lang)}</p>
        </div>

        {/* Stepper display in Sidebar */}
        <nav className="flex-1 space-y-6">
          {stepsMeta.map((s) => {
            const isActive = step === s.number;
            const isCompleted = step > s.number && step < 5;
            const isSelectable = step < 5; // allow back-clicking during drafting

            if (isCompleted && isSelectable) {
              return (
                <button
                  id={`side-step-${s.number}`}
                  key={s.number}
                  onClick={() => setStep(s.number)}
                  className="group flex items-center space-x-4 cursor-pointer text-left focus:outline-none w-full"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-xs font-mono text-blue-400 shrink-0">
                    0{s.number}
                  </div>
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wide text-blue-400 group-hover:text-blue-300 transition-colors leading-tight">
                      {s.name}
                    </span>
                    <span className="block text-[10px] text-slate-500 font-medium">{lang === 'en' ? 'Edit' : 'Modifier'}</span>
                  </div>
                </button>
              );
            }

            return (
              <div
                id={`side-step-${s.number}`}
                key={s.number}
                className={`flex items-center space-x-4 transition-all duration-300 ${
                  isActive ? '' : 'opacity-40'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono shrink-0 transition-all duration-300 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                    : 'border border-slate-700 text-slate-400'
                }`}>
                  0{s.number}
                </div>
                <div>
                  <span className={`block text-xs font-bold uppercase tracking-wide leading-tight ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}>
                    {s.name}
                  </span>
                  <span className="block text-[10px] text-slate-500 font-medium">{s.tagline}</span>
                </div>
              </div>
            );
          })}

          {step === 5 && (
            <div id="side-step-success" className="flex items-center space-x-4 pt-4 border-t border-slate-800/60">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center">
                ✓
              </div>
              <div>
                <span className="block text-xs font-bold uppercase tracking-wide text-emerald-400">
                  {t('step_name_5', lang)}
                </span>
                <span className="block text-[10px] text-slate-500">{t('step_tag_5', lang)}</span>
              </div>
            </div>
          )}
        </nav>

        {/* Theme & Language Settings switcher */}
        <div className="mt-auto mb-4 space-y-4">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">{t('interface_theme', lang)}</p>
            <ThemeSelector />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">{lang === 'fr' ? 'LANGUE' : 'LANGUAGE'}</p>
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center justify-between w-full max-w-[240px] px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold hover:border-slate-700 hover:bg-slate-900/80 transition-all cursor-pointer text-slate-350 hover:text-white"
            >
              <span>{lang === 'fr' ? 'Français' : 'English'}</span>
              <span className="text-blue-400 font-bold">{lang === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}</span>
            </button>
          </div>
        </div>

        {/* Needs Help Badge */}
        <div className="mt-0">
          <button
            type="button"
            onClick={() => setIsSupportModalOpen(true)}
            className="w-full text-left p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700/60 transition-all duration-300 group cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500/25"
          >
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('need_help', lang)} <br/>
              <span className="text-blue-400 font-medium group-hover:text-blue-300 transition-colors flex items-center gap-1.5 mt-1 text-[11px] truncate">
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                {generalSettings.support_email || 'nuvatechsolutions386@keemail.me'}
              </span>
            </p>
          </button>
        </div>
      </aside>

      {/* Main Container Area */}
      <main id="wizard-view" className="flex-1 flex flex-col relative min-h-screen overflow-x-hidden">
        {/* Subtle decorative gradients in background */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Header - Shown on Mobile only, hidden on Desktop */}
        <header id="mobile-header" className="relative z-10 w-full px-6 pt-6 pb-2 border-b border-slate-900 md:hidden bg-[#0F1218]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquareCode className="w-4.5 h-4.5 text-white stroke-[2.5]" />
              </div>
              <h1 className="text-base font-extrabold text-white tracking-tight">
                Nuvatech<span className="text-blue-400">.</span>Solutions
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleLanguage}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer text-[10px] font-bold border border-slate-800 bg-slate-950 px-2.5 py-1.5 rounded-xl shrink-0"
                title={lang === 'fr' ? 'Switch to English' : 'Passer en Français'}
              >
                {lang === 'fr' ? 'EN' : 'FR'}
              </button>
              <ThemeSelector />
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(true)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                title={t('need_help', lang)}
              >
                <HelpCircle className="w-4.5 h-4.5" />
              </button>
              <span className="text-[10px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full font-mono border border-slate-800 hidden xs:inline-block">
                v1.4.0
              </span>
            </div>
          </div>

          {/* Mobile simple progress bar */}
          {step < 5 && (
            <div className="space-y-1.5 pb-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-blue-400">
                  {lang === 'fr'
                    ? `Étape ${step} sur 4 : ${stepsMeta[step - 1].name}`
                    : `Step ${step} of 4: ${stepsMeta[step - 1].name}`
                  }
                </span>
                <span className="text-slate-500">{Math.round((step / 4) * 100)}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>
          )}
        </header>

        {/* Desktop breadcrumb-like Header area */}
        {step < 5 && (
          <header className="px-6 md:px-12 py-6 md:py-8 flex justify-between items-center relative z-10 hidden md:flex border-b border-slate-900">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight">{t('config_projet', lang)}</h2>
              <p className="text-slate-400 text-xs md:text-sm mt-1">{t('config_projet_desc', lang)}</p>
            </div>
            <div className="flex space-x-2">
              {stepsMeta.map((s) => (
                <div
                  key={s.number}
                  className={`h-1 w-8 rounded-full transition-all duration-300 ${
                    step >= s.number ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </header>
        )}

        {/* Dynamic scrollable steps body */}
        <section id="step-content-box" className="px-6 md:px-12 py-8 flex-1 relative z-10">
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <div key="step-client-info">
                  <ClientInfoStep
                    info={formData.clientInfo}
                    onChange={handleClientInfoChange}
                    onNext={() => {
                      saveDraftBrief(formData, folderRef, pricingSettings).catch(err => console.error("Draft save failed:", err));
                      setStep(2);
                    }}
                    sectors={sectors}
                    lang={lang}
                    welcomeTitle={generalSettings.welcome_title}
                    welcomeSubtitle={generalSettings.welcome_subtitle}
                  />
                </div>
              )}

              {step === 2 && (
                <div key="step-service-selector">
                  <ServiceSelectorStep
                    selectedServices={formData.servicesSelected}
                    onToggleService={handleToggleService}
                    onNext={() => setStep(3)}
                    onBack={() => setStep(1)}
                    lang={lang}
                  />
                </div>
              )}

              {step === 3 && (
                <div key="step-dynamic-questions">
                  <DynamicQuestionsStep
                    selectedServices={formData.servicesSelected}
                    webDetails={formData.details.website || INITIAL_FORM_STATE.details.website!}
                    appDetails={formData.details.application || INITIAL_FORM_STATE.details.application!}
                    autoDetails={formData.details.automation || INITIAL_FORM_STATE.details.automation!}
                    setWebDetails={handleWebDetailsChange}
                    setAppDetails={handleAppDetailsChange}
                    setAutoDetails={handleAutoDetailsChange}
                    onNext={() => setStep(4)}
                    onBack={() => setStep(2)}
                    lang={lang}
                  />
                </div>
              )}

              {step === 4 && (
                <div key="step-summary">
                  <SummaryStep
                    formData={formData}
                    onBudgetChange={handleBudgetChange}
                    onBudgetTrancheChange={handleBudgetTrancheChange}
                    onDeliveryDateChange={handleDeliveryDateChange}
                    onTechnicalConstraintsChange={handleTechnicalConstraintsChange}
                    onNotesChange={handleNotesChange}
                    onAttachmentsChange={handleAttachmentsChange}
                    onLinksChange={handleLinksChange}
                    onSubmit={handleFormSubmit}
                    onBack={() => setStep(3)}
                    isSubmitting={isSubmitting}
                    submitError={submitError}
                    pricingSettings={pricingSettings}
                    lang={lang}
                  />
                </div>
              )}

              {step === 5 && (
                <div key="step-success">
                  <SuccessView
                    formData={formData}
                    onReset={handleFormReset}
                    folderRef={folderRef}
                    pricingSettings={pricingSettings}
                    lang={lang}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Main Footer - Pure, simple, clean, no telemetry */}
        <footer id="main-footer" className="w-full px-6 md:px-12 py-6 border-t border-slate-900 bg-[#0A0C10]/80 backdrop-blur-md flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10 text-xs text-slate-500">
          <span className="font-sans">
            &copy; {new Date().getFullYear()} Nuvatech-Solutions. {lang === 'en' ? 'All rights reserved.' : 'Tous droits réservés.'}
          </span>
          <div className="flex gap-4 font-mono font-semibold">
            <a href="#" className="hover:text-blue-400 transition-colors">{lang === 'en' ? 'Privacy' : 'Confidentialité'}</a>
            <span>&middot;</span>
            <a href="#" className="hover:text-blue-400 transition-colors">{lang === 'en' ? 'Legal Notice' : 'Mentions Légales'}</a>
          </div>
        </footer>
      </main>

      {/* Support / Help Modal */}
      <AnimatePresence>
        {isSupportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSendingSupport && setIsSupportModalOpen(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden z-10"
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg md:text-xl font-extrabold text-white flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-400" />
                    {t('contact_support', lang)}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {t('contact_support_desc', lang)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSendingSupport}
                  onClick={() => setIsSupportModalOpen(false)}
                  className="p-1.5 bg-slate-950/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer disabled:opacity-40"
                  title="Fermer la boîte de dialogue"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {supportSubmitSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 space-y-4"
                >
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold animate-bounce">
                    ✓
                  </div>
                  <h4 className="text-base font-bold text-white">{t('support_success', lang)}</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    {t('support_success_desc', lang)}
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSendSupportMessage} className="space-y-4">
                  {supportSubmitError && (
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold leading-relaxed">
                      ⚠️ {supportSubmitError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="support-name" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {t('support_name', lang)}
                    </label>
                    <input
                      id="support-name"
                      type="text"
                      required
                      disabled={isSendingSupport}
                      placeholder={t('support_name_placeholder', lang)}
                      value={supportName}
                      onChange={(e) => setSupportName(e.target.value)}
                      className="w-full bg-slate-950 text-white border border-slate-800 focus:border-blue-500/60 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/25 transition-all disabled:opacity-55"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="support-email" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {t('support_email', lang)}
                    </label>
                    <input
                      id="support-email"
                      type="email"
                      required
                      disabled={isSendingSupport}
                      placeholder={t('support_email_placeholder', lang)}
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full bg-slate-950 text-white border border-slate-800 focus:border-blue-500/60 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/25 transition-all disabled:opacity-55"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="support-message" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {t('support_message', lang)}
                    </label>
                    <textarea
                      id="support-message"
                      required
                      disabled={isSendingSupport}
                      rows={3}
                      placeholder={t('support_message_placeholder', lang)}
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      className="w-full bg-slate-950 text-white border border-slate-800 focus:border-blue-500/60 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/25 transition-all disabled:opacity-55"
                    />
                  </div>

                  {/* Attachments and Links Section */}
                  <div className="space-y-3 pt-3 border-t border-slate-800/80">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {t('attachments_title', lang)}
                    </span>

                    {/* File Attachment Uploader */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          htmlFor="support-file-upload"
                          className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/80 hover:bg-slate-900 text-[10px] font-semibold text-slate-350 hover:text-white transition-all select-none ${
                            supportFiles.length >= 5 ? 'opacity-40 pointer-events-none' : ''
                          }`}
                        >
                          <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                          <span>{t('add_file_btn', lang)}</span>
                          <input
                            id="support-file-upload"
                            type="file"
                            multiple
                            disabled={isSendingSupport || supportFiles.length >= 5}
                            onChange={handleSupportFileChange}
                            className="hidden"
                            accept=".pdf,.txt,.xls,.xlsx,.csv,.doc,.docx,.png,.jpg,.jpeg,.gif"
                          />
                        </label>
                        <span className="text-[9px] text-slate-500 leading-tight">
                          {t('add_file_desc', lang)}
                        </span>
                      </div>

                      {supportFileError && (
                        <p className="text-[10px] text-rose-400 font-semibold">{supportFileError}</p>
                      )}

                      {/* Files list */}
                      {supportFiles.length > 0 && (
                        <div className="space-y-1 max-h-[100px] overflow-y-auto pr-1">
                          {supportFiles.map((file, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800/50 text-[10px]">
                              <span className="text-slate-300 truncate max-w-[200px]" title={file.name}>
                                📎 {file.name} <span className="text-slate-500">({Math.round(file.size / 1024)} Ko)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSupportFile(idx)}
                                className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer"
                                title={t('attachment_remove', lang)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Links builder */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Link2 className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                          <input
                            type="text"
                            placeholder={t('add_link_placeholder', lang)}
                            value={newSupportLink}
                            onChange={(e) => setNewSupportLink(e.target.value)}
                            className="w-full bg-slate-950 text-white border border-slate-800 focus:border-blue-500/60 rounded-xl pl-9 pr-3 py-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500/25 transition-all"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddSupportLink}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Links list */}
                      {supportLinks.length > 0 && (
                        <div className="space-y-1 max-h-[80px] overflow-y-auto pr-1">
                          {supportLinks.map((link, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800/50 text-[10px]">
                              <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate max-w-[280px]" title={link}>
                                🔗 {link}
                              </a>
                              <button
                                type="button"
                                onClick={() => handleRemoveSupportLink(idx)}
                                className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer"
                                title={t('attachment_remove', lang)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      disabled={isSendingSupport}
                      onClick={() => setIsSupportModalOpen(false)}
                      className="px-4 py-2.5 bg-slate-950/40 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
                    >
                      {t('cancel', lang)}
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingSupport}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {isSendingSupport ? (
                        <>
                          {t('sending', lang)}
                          <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </>
                      ) : (
                        <>
                          {t('send_message', lang)}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
