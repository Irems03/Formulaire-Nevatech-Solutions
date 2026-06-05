/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Globe, Cpu, Zap, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { ServiceType } from '../../../types/index';
import { motion, AnimatePresence } from 'motion/react';
import { t, Language } from '../../../services/i18n';

interface ServiceSelectorStepProps {
  selectedServices: Record<ServiceType, boolean>;
  onToggleService: (service: ServiceType) => void;
  onNext: () => void;
  onBack: () => void;
  lang: Language;
}

interface ServiceCard {
  id: ServiceType;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  borderColor: string;
  glowColor: string;
}

const CARDS: ServiceCard[] = [
  {
    id: 'website',
    icon: Globe,
    gradient: 'from-blue-500/10 to-teal-500/10 hover:from-blue-500/15 hover:to-teal-500/20',
    borderColor: 'border-blue-500/20 group-hover:border-blue-500/50',
    glowColor: 'shadow-blue-500/5',
  },
  {
    id: 'application',
    icon: Cpu,
    gradient: 'from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/15 hover:to-purple-500/20',
    borderColor: 'border-indigo-500/20 group-hover:border-indigo-500/50',
    glowColor: 'shadow-indigo-500/5',
  },
  {
    id: 'automation',
    icon: Zap,
    gradient: 'from-amber-500/10 to-rose-500/10 hover:from-amber-500/15 hover:to-rose-500/20',
    borderColor: 'border-amber-500/20 group-hover:border-amber-500/50',
    glowColor: 'shadow-amber-500/5',
  },
];

export default function ServiceSelectorStep({
  selectedServices,
  onToggleService,
  onNext,
  onBack,
  lang,
}: ServiceSelectorStepProps) {
  const [error, setError] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<ServiceType | null>(null);

  const hasSelectedAny = Object.values(selectedServices).some((val) => val);

  const handleNext = () => {
    if (!hasSelectedAny) {
      setError(t('error_select_service', lang));
      return;
    }
    setError(null);
    onNext();
  };

  const getCardFeatures = (id: ServiceType, lang: Language): string[] => {
    if (id === 'website') {
      return lang === 'en'
        ? ['Responsive Mobile', 'Integrated CMS', 'SEO & Performance', 'Inbound Marketing']
        : ['Responsive Mobile', 'CMS Intégré', 'SEO & Performance', 'Marketing branché'];
    }
    if (id === 'application') {
      return lang === 'en'
        ? ['User Accounts', 'Database', 'Cloud Security', 'Stripe Payments']
        : ['Gestion des comptes', 'Base de données', 'Sécurité cloud', 'Paiements Stripe'];
    }
    return lang === 'en'
      ? ['API Integrations', 'Conversational AI Agents', 'Automated Reporting', 'Lead Synchronization']
      : ['Bridges d\'API', 'Agents IA conversationnels', 'Automated Reporting', 'Sincronisation de leads'];
  };

  const getTooltipText = (id: ServiceType, isSelected: boolean): string => {
    if (id === 'website') {
      return isSelected
        ? (lang === 'en'
            ? "Unchecking this option will remove the website from your estimate. Without it, clients cannot search or find you on the web."
            : "Décocher cette option supprimera le site de votre estimation. Sans site vitrine, vos clients ne pourront pas vous trouver sur le web.")
        : (lang === 'en'
            ? "Checking this option lets you create a modern website to establish your online presence and attract new leads."
            : "Cocher cette option vous permet de créer un site internet moderne pour asseoir votre crédibilité et attirer des prospects.");
    }
    if (id === 'application') {
      return isSelected
        ? (lang === 'en'
            ? "Unchecking will remove the custom application. You will lose the estimate for your interactive member/admin portals."
            : "En décochant, vous abandonnez la création de votre outil sur-mesure (SaaS, portail client, application mobile).")
        : (lang === 'en'
            ? "Checking this option lets you develop a custom interactive application with user accounts and database access."
            : "Cocher cette option vous permet d'obtenir une plateforme interactive sur-mesure (espace membre, dashboard, SaaS).");
    }
    return isSelected
      ? (lang === 'en'
          ? "Unchecking will disable automation. You will have to keep transferring data and performing repetitive tasks manually."
          : "En décochant, vous devrez continuer à traiter vos données, emails et synchronisations manuellement.")
      : (lang === 'en'
          ? "Checking this option allows you to automate repetitive tasks and connect your existing software to save time."
          : "Cocher cette option permet d'automatiser vos tâches répétitives et de connecter vos outils existants.");
  };

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
          {t('services_title', lang)}
        </h2>
        <p className="text-slate-400 text-sm md:text-base">
          {t('services_desc', lang)}
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-medium"
        >
          {error}
        </motion.div>
      )}

      {/* Responsive Grid System: md:grid-cols-3 instead of lg:grid-cols-3 to be tablet-friendly */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {CARDS.map((card) => {
          const isSelected = selectedServices[card.id];
          const IconComponent = card.icon;
          const features = getCardFeatures(card.id, lang);

          return (
            <div key={card.id} className="relative">
              <button
                id={`service-card-${card.id}`}
                onClick={() => {
                  onToggleService(card.id);
                  if (error) setError(null);
                }}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`group relative text-left w-full cursor-pointer h-full rounded-2xl border p-5 transition-all duration-300 backdrop-blur-md bg-slate-950/60 hover:bg-slate-900/60 ${card.glowColor} ${
                  isSelected
                    ? 'border-blue-500/80 ring-2 ring-blue-500/20 bg-slate-900/85'
                    : 'border-slate-800/80 hover:border-slate-700/60 shadow-inner'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-4 right-4 bg-blue-600 text-white p-1.5 rounded-full z-10">
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  </span>
                )}

                <div className="space-y-4">
                  {/* Icon block */}
                  <div
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${
                      isSelected
                        ? 'from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/30'
                        : 'from-slate-800 to-slate-900 text-slate-400 border border-slate-700/50 group-hover:text-white'
                    } transition-colors duration-300`}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>

                  {/* Info block */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">
                        {t('service_' + card.id + '_title', lang)}
                      </h3>
                    </div>
                    <span className="block text-xs font-medium text-slate-400 group-hover:text-slate-300">
                      {t('service_' + card.id + '_tagline', lang)}
                    </span>
                  </div>

                  <p className="text-xs md:text-sm text-slate-400 leading-relaxed min-h-[60px]">
                    {t('service_' + card.id + '_desc', lang)}
                  </p>

                  {/* Mini features list */}
                  <div className="pt-2 border-t border-slate-800/60 flex flex-wrap gap-1.5">
                    {features.map((feat) => (
                      <span
                        key={feat}
                        className="inline-flex items-center text-[10px] md:text-xs font-medium px-2 py-0.5 bg-slate-800/40 text-slate-300 rounded border border-slate-800"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {hoveredCard === card.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-72 p-3 bg-white/95 border border-slate-200/90 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.35)] z-50 pointer-events-none text-left backdrop-blur-sm"
                  >
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                      {getTooltipText(card.id, isSelected)}
                    </p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white/95" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Nav footer */}
      <div className="pt-6 border-t border-slate-800/60 flex items-center justify-between">
        <button
          id="btn-services-back"
          type="button"
          onClick={onBack}
          className="group cursor-pointer inline-flex items-center gap-1.5 text-slate-400 hover:text-white font-medium text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t('back', lang)}
        </button>

        <button
          id="btn-services-next"
          type="button"
          onClick={handleNext}
          className={`group cursor-pointer inline-flex items-center gap-2 font-bold px-6 py-3 rounded-xl shadow-lg transition-all text-sm ${
            hasSelectedAny
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98]'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {t('next', lang)}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}
