/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Building2, User, Mail, Phone, Briefcase, ArrowRight, AlertCircle, Sparkles, UserCheck, Target } from 'lucide-react';
import { ClientInfo, validateClientInfo } from '../../../types/index';
import { motion } from 'motion/react';
import { t, Language } from '../../../services/i18n';

interface ClientInfoStepProps {
  info: ClientInfo;
  onChange: (info: ClientInfo) => void;
  onNext: () => void;
  sectors?: string[];
  lang: Language;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
}

const SECTORS = [
  'Technologie & SaaS',
  'E-commerce & Retail',
  'Santé & Bien-être',
  'Finance & Immobilier',
  'Éducation & Formation',
  'Artisanat & Services Locaux',
  'Autre secteur',
];

export default function ClientInfoStep({ info, onChange, onNext, sectors, lang, welcomeTitle, welcomeSubtitle }: ClientInfoStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const activeSectors = sectors && sectors.length > 0 ? sectors : SECTORS;

  const getSectorLabel = (sec: string) => {
    if (sec === 'Technologie & SaaS') return t('sector_tech', lang);
    if (sec === 'E-commerce & Retail') return t('sector_ecommerce', lang);
    if (sec === 'Santé & Bien-être') return t('sector_health', lang);
    if (sec === 'Finance & Immobilier') return t('sector_finance', lang);
    if (sec === 'Éducation & Formation') return t('sector_education', lang);
    if (sec === 'Artisanat & Services Locaux') return t('sector_crafts', lang);
    if (sec === 'Autre secteur') return t('sector_other', lang);
    return sec;
  };

  const handleInputChange = (field: keyof ClientInfo, value: string) => {
    const updatedInfo = { ...info, [field]: value };
    onChange(updatedInfo);

    if (touched[field]) {
      const fieldErrors = validateClientInfo(updatedInfo, lang);
      setErrors((prev) => ({
        ...prev,
        [field]: fieldErrors[field] || '',
      }));
    }
  };

  const handleBlur = (field: keyof ClientInfo) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldErrors = validateClientInfo(info, lang);
    setErrors((prev) => ({
      ...prev,
      [field]: fieldErrors[field] || '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateClientInfo(info, lang);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Mark all fields touched to show errors
      const allTouched = Object.keys(info).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      );
      setTouched(allTouched);
      return;
    }
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center md:text-left space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-medium border border-blue-500/10 mb-1">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          {lang === 'en' ? 'New Nuvatech Project' : 'Nouveau projet Nuvatech'}
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          {welcomeTitle || t('client_info_title', lang)}
        </h2>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed">
          {welcomeSubtitle || t('client_info_desc', lang)}
        </p>
      </div>

      <form id="client-info-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Nom du contact */}
          <div className="space-y-2">
            <label htmlFor="contactName" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {t('contact_name_label', lang)} <span className="text-rose-500">*</span>
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-blue-400 transition-colors">
                <User className="w-4 h-4" />
              </span>
              <input
                id="contactName"
                type="text"
                placeholder={t('contact_name_placeholder', lang)}
                value={info.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                onBlur={() => handleBlur('contactName')}
                className={`w-full bg-slate-900/60 text-white rounded-xl pl-10 pr-4 py-3 text-sm border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                  errors.contactName
                    ? 'border-rose-500/40 focus:border-rose-500'
                    : 'border-slate-800 hover:border-slate-700 focus:border-blue-500/60'
                }`}
              />
            </div>
            {errors.contactName && (
              <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.contactName}
              </p>
            )}
          </div>

          {/* Rôle du contact */}
          <div className="space-y-2">
            <label htmlFor="contactRole" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {t('contact_role_label', lang)} <span className="text-rose-500">*</span>
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-blue-400 transition-colors">
                <UserCheck className="w-4 h-4" />
              </span>
              <input
                id="contactRole"
                type="text"
                placeholder={t('contact_role_placeholder', lang)}
                value={info.contactRole || ''}
                onChange={(e) => handleInputChange('contactRole', e.target.value)}
                onBlur={() => handleBlur('contactRole')}
                className={`w-full bg-slate-900/60 text-white rounded-xl pl-10 pr-4 py-3 text-sm border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                  errors.contactRole
                    ? 'border-rose-500/40 focus:border-rose-500'
                    : 'border-slate-800 hover:border-slate-700 focus:border-blue-500/60'
                }`}
              />
            </div>
            {errors.contactRole && (
              <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.contactRole}
              </p>
            )}
          </div>

          {/* Nom de l'entreprise */}
          <div className="space-y-2">
            <label htmlFor="companyName" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {t('company_name_label', lang)}
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-blue-400 transition-colors">
                <Building2 className="w-4 h-4" />
              </span>
              <input
                id="companyName"
                type="text"
                placeholder={t('company_name_placeholder', lang)}
                value={info.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="w-full bg-slate-900/60 text-white rounded-xl pl-10 pr-4 py-3 text-sm border border-slate-800 hover:border-slate-700 focus:border-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
              />
            </div>
          </div>

          {/* Secteur d'activité */}
          <div className="space-y-2">
            <label htmlFor="sector" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {t('sector_label', lang)} <span className="text-rose-500">*</span>
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-blue-400 transition-colors">
                <Briefcase className="w-4 h-4" />
              </span>
              <select
                id="sector"
                value={info.sector}
                onChange={(e) => handleInputChange('sector', e.target.value)}
                onBlur={() => handleBlur('sector')}
                className={`w-full bg-slate-900/90 text-white rounded-xl pl-10 pr-4 py-3 text-sm border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none ${
                  errors.sector
                    ? 'border-rose-500/40 focus:border-rose-500'
                    : 'border-slate-800 hover:border-slate-700 focus:border-blue-500/60'
                }`}
              >
                <option value="" disabled>--- {t('sector_placeholder', lang)} ---</option>
                {activeSectors.map((sec) => (
                  <option key={sec} value={sec} className="bg-slate-950 text-white">
                    {getSectorLabel(sec)}
                  </option>
                ))}
              </select>
              <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 pointer-events-none">
                ▼
              </span>
            </div>
            {errors.sector && (
              <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.sector}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {t('email_label', lang)} <span className="text-rose-500">*</span>
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-blue-400 transition-colors">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="email"
                type="email"
                placeholder="jean.martin@example.com"
                value={info.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={`w-full bg-slate-900/60 text-white rounded-xl pl-10 pr-4 py-3 text-sm border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                  errors.email
                    ? 'border-rose-500/40 focus:border-rose-500'
                    : 'border-slate-800 hover:border-slate-700 focus:border-blue-500/60'
                }`}
              />
            </div>
            {errors.email && (
              <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Téléphone */}
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {t('phone_label', lang)} <span className="text-rose-500">*</span>
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-blue-400 transition-colors">
                <Phone className="w-4 h-4" />
              </span>
              <input
                id="phone"
                type="tel"
                placeholder={t('phone_placeholder', lang)}
                value={info.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                className={`w-full bg-slate-900/60 text-white rounded-xl pl-10 pr-4 py-3 text-sm border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                  errors.phone
                    ? 'border-rose-500/40 focus:border-rose-500'
                    : 'border-slate-800 hover:border-slate-700 focus:border-blue-500/60'
                }`}
              />
            </div>
            {errors.phone && (
              <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {errors.phone}
              </p>
            )}
          </div>
        </div>

        {/* Objectif principal du projet */}
        <div className="space-y-2">
          <label htmlFor="projectObjective" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            {t('objective_label', lang)} <span className="text-rose-500">*</span>
          </label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-3.5 pt-3.5 flex items-start text-slate-400 group-focus-within:text-blue-400 transition-colors">
              <Target className="w-4 h-4" />
            </span>
            <textarea
              id="projectObjective"
              rows={3}
              placeholder={t('objective_placeholder', lang)}
              value={info.projectObjective || ''}
              onChange={(e) => handleInputChange('projectObjective', e.target.value)}
              onBlur={() => handleBlur('projectObjective')}
              className={`w-full bg-slate-900/60 text-white rounded-xl pl-10 pr-4 py-3 text-sm border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                errors.projectObjective
                  ? 'border-rose-500/40 focus:border-rose-500'
                  : 'border-slate-800 hover:border-slate-700 focus:border-blue-500/60'
              }`}
            />
          </div>
          {errors.projectObjective && (
            <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {errors.projectObjective}
            </p>
          )}
        </div>

        <div className="pt-4 flex justify-end">
          <button
            id="btn-info-next"
            type="submit"
            className="group cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all text-sm"
          >
            {t('continue', lang)}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
