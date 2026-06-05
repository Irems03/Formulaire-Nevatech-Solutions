/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ArrowLeft,
  Check,
  Building2,
  User,
  Mail,
  Phone,
  DollarSign,
  AlertTriangle,
  Globe,
  Cpu,
  Zap,
  Briefcase,
  Sparkles
} from 'lucide-react';
import { FormSubmission, calculateDevEstimate, AttachmentFile } from '../../../types/index';
import { motion } from 'motion/react';
import { t, Language } from '../../../services/i18n';
import { Paperclip, Link2, Trash2, Plus, MessageSquare, Paintbrush, FileText, Eye, HelpCircle, Users, Database } from 'lucide-react';

interface SummaryStepProps {
  formData: FormSubmission;
  onBudgetChange: (budget: number) => void;
  onBudgetTrancheChange: (tranche: FormSubmission['budgetTranche']) => void;
  onDeliveryDateChange: (date: string) => void;
  onTechnicalConstraintsChange: (constraints: string) => void;
  onNotesChange: (notes: string) => void;
  onAttachmentsChange?: (attachments: AttachmentFile[]) => void;
  onLinksChange?: (links: string[]) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
  pricingSettings?: any;
  lang: Language;
}

export default function SummaryStep({
  formData,
  onBudgetChange,
  onBudgetTrancheChange,
  onDeliveryDateChange,
  onTechnicalConstraintsChange,
  onNotesChange,
  onAttachmentsChange,
  onLinksChange,
  onSubmit,
  onBack,
  isSubmitting = false,
  submitError = null,
  pricingSettings,
  lang,
}: SummaryStepProps) {
  const [newLink, setNewLink] = React.useState('');
  const [fileError, setFileError] = React.useState<string | null>(null);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !onAttachmentsChange) return;
    setFileError(null);

    const currentAttachments = formData.attachments || [];
    if (currentAttachments.length + files.length > 5) {
      setFileError(t('max_files_warning', lang));
      return;
    }

    const newFiles: AttachmentFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 2 * 1024 * 1024) {
        setFileError(lang === 'en' ? `File ${file.name} exceeds the 2 MB limit.` : `Le fichier ${file.name} dépasse la limite de 2 Mo.`);
        continue;
      }
      try {
        const attachment = await convertFileToAttachment(file);
        newFiles.push(attachment);
      } catch (err) {
        console.error("Error reading file", err);
      }
    }
    onAttachmentsChange([...currentAttachments, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    if (!onAttachmentsChange) return;
    const currentAttachments = formData.attachments || [];
    onAttachmentsChange(currentAttachments.filter((_, i) => i !== index));
  };

  const handleAddLink = () => {
    if (!newLink.trim() || !onLinksChange) return;
    let url = newLink.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    try {
      new URL(url);
      const currentLinks = formData.links || [];
      onLinksChange([...currentLinks, url]);
      setNewLink('');
      setFileError(null);
    } catch (_) {
      setFileError(lang === 'en' ? "Please enter a valid URL." : "Veuillez entrer une URL valide.");
    }
  };

  const handleRemoveLink = (index: number) => {
    if (!onLinksChange) return;
    const currentLinks = formData.links || [];
    onLinksChange(currentLinks.filter((_, i) => i !== index));
  };
  // Compute prices
  const { min, max } = calculateDevEstimate(formData, pricingSettings);

  const countSelected = Object.values(formData.servicesSelected).filter(Boolean).length;

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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center md:text-left space-y-2">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          {t('summary_title', lang)}
        </h2>
        <p className="text-slate-400 text-sm md:text-base">
          {t('summary_desc', lang)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurations Details Column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Client summary */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              {t('contact_summary_title', lang)}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
              <div className="flex items-center gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <div>
                  <span className="block text-[10px] text-slate-500">Contact</span>
                  <span className="text-white font-medium">{formData.clientInfo.contactName}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <div>
                  <span className="block text-[10px] text-slate-500">{t('summary_role', lang)}</span>
                  <span className="text-white font-medium">{formData.clientInfo.contactRole || t('summary_role_none', lang)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <div>
                  <span className="block text-[10px] text-slate-500">{t('summary_company', lang)}</span>
                  <span className="text-white font-medium">{formData.clientInfo.companyName || t('summary_company_none', lang)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <div>
                  <span className="block text-[10px] text-slate-500">Email</span>
                  <span className="text-white font-medium break-all">{formData.clientInfo.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <div>
                  <span className="block text-[10px] text-slate-500">{lang === 'en' ? 'Phone' : 'Téléphone'}</span>
                  <span className="text-white font-medium">{formData.clientInfo.phone}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                <div>
                  <span className="block text-[10px] text-slate-500">{lang === 'en' ? 'Sector' : 'Secteur'}</span>
                  <span className="text-white font-medium">{getSectorLabel(formData.clientInfo.sector)}</span>
                </div>
              </div>
            </div>

            {/* Objectif principal */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-900 text-xs space-y-1.5">
              <span className="block text-[10px] text-blue-400 font-bold uppercase tracking-wider">{t('objective_label', lang)}</span>
              <p className="text-slate-350 leading-relaxed italic">
                "{formData.clientInfo.projectObjective || (lang === 'en' ? 'Not specified' : 'Non spécifié')}"
              </p>
            </div>
          </div>

          {/* Scope selections lists */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {t('summary_modules_title', lang)}
            </h3>

            <div className="space-y-3">
              {/* Site Web summary */}
              {formData.servicesSelected.website && formData.details.website && (
                <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex gap-4">
                  <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/10 h-min">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t('module_web_title', lang)}</h4>
                    <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-400">
                      <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {lang === 'en' ? 'Type: ' : 'Type : '} {t('web_type_' + formData.details.website.siteType, lang)}
                      </span>
                      <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {lang === 'en' ? 'Pages: ' : 'Pages : '} {t('web_size_' + formData.details.website.pageSize, lang)}
                      </span>
                      <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {lang === 'en' ? 'Design: ' : 'Design : '} {t('web_design_' + formData.details.website.designType, lang)}
                      </span>
                    </div>
                    {formData.details.website.features.length > 0 && (
                      <div className="text-[10px] text-slate-400">
                        <span className="font-bold text-slate-355 block mb-1">Extensions:</span>
                        <div className="flex flex-wrap gap-1">
                          {formData.details.website.features.map((f) => (
                            <span key={f} className="text-[9px] bg-blue-500/5 text-blue-300 border border-blue-500/15 px-1.5 py-0.5 rounded">
                              + {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Qualitative info */}
                    <div className="pt-3 border-t border-slate-900/60 text-[10px] space-y-2.5">
                      {formData.details.website.messagePrincipal && (
                        <div className="flex items-start gap-2 text-slate-300">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-500 font-bold block">{lang === 'en' ? 'Main message to convey:' : 'Message principal à transmettre :'}</span>
                            <p className="italic">"{formData.details.website.messagePrincipal}"</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-2 text-slate-300">
                        <Paintbrush className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-slate-500 font-bold block">{lang === 'en' ? 'Graphic chart & texts:' : 'Charte graphique et textes :'}</span>
                          <span className="font-medium">
                            {formData.details.website.charteGraphicReady === 'yes'
                              ? (lang === 'en' ? '✓ Everything ready' : '✓ Tout est prêt')
                              : formData.details.website.charteGraphicReady === 'partial'
                              ? (lang === 'en' ? '⚡ Partially' : '⚡ Partiellement')
                              : (lang === 'en' ? '❌ Needs creation' : '❌ Besoin de création')}
                          </span>
                        </div>
                      </div>
                      {formData.details.website.indispensablePages && (
                        <div className="flex items-start gap-2 text-slate-300">
                          <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-500 font-bold block">{lang === 'en' ? 'Essential pages:' : 'Pages indispensables :'}</span>
                            <span>{formData.details.website.indispensablePages}</span>
                          </div>
                        </div>
                      )}
                      {formData.details.website.benchmarkSites && (
                        <div className="flex items-start gap-2 text-slate-300">
                          <Eye className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-500 font-bold block">{lang === 'en' ? 'Liked website examples:' : 'Exemples de sites web appréciés :'}</span>
                            <span>{formData.details.website.benchmarkSites}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Application Summary */}
              {formData.servicesSelected.application && formData.details.application && (
                <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex gap-4">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/10 h-min">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t('module_app_title', lang)}</h4>
                    <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-400">
                      <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        Timeline : {t('timeline_' + formData.details.application.timeline, lang)}
                      </span>
                      <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {lang === 'en' ? 'Complexity: ' : 'Complexité : '} {t('complexity_' + formData.details.application.complexity, lang)}
                      </span>
                      {formData.details.application.needsAuth && <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-teal-400">{lang === 'en' ? 'Auth active' : 'Auth active'}</span>}
                      {formData.details.application.needsDatabase && <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-teal-400">{lang === 'en' ? 'Database' : 'Base de données'}</span>}
                    </div>
                    <div className="text-[10px] text-slate-400 space-y-1">
                      <span className="font-bold text-slate-355 block">{lang === 'en' ? 'Platforms:' : 'Plateformes :'}</span>
                      <div className="flex flex-wrap gap-1">
                        {formData.details.application.platforms.map((p) => (
                          <span key={p} className="text-[9px] bg-indigo-500/5 text-indigo-300 border border-indigo-500/15 px-1.5 py-0.5 rounded uppercase font-mono">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Qualitative info */}
                    <div className="pt-3 border-t border-slate-900/60 text-[10px] space-y-2.5">
                      {formData.details.application.mainProblem && (
                        <div className="flex items-start gap-2 text-slate-300">
                          <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-500 font-bold block">{lang === 'en' ? 'Problem to solve:' : 'Problème à résoudre :'}</span>
                            <p className="italic">"{formData.details.application.mainProblem}"</p>
                          </div>
                        </div>
                      )}
                      {formData.details.application.userRoles && (
                        <div className="flex items-start gap-2 text-slate-300">
                          <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-500 font-bold block">{lang === 'en' ? 'User roles required:' : 'Rôles utilisateurs requis :'}</span>
                            <span>{formData.details.application.userRoles}</span>
                          </div>
                        </div>
                      )}
                      {formData.details.application.mvpFeatures && (
                        <div className="flex items-start gap-2 text-slate-300">
                          <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-500 font-bold block">{lang === 'en' ? 'Essential MVP features:' : 'Fonctionnalités MVP indispensables :'}</span>
                            <span>{formData.details.application.mvpFeatures}</span>
                          </div>
                        </div>
                      )}
                      {formData.details.application.dataSource && (
                        <div className="flex items-start gap-2 text-slate-300">
                          <Database className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-500 font-bold block">{lang === 'en' ? 'Data source:' : 'Source des données :'}</span>
                            <span>{formData.details.application.dataSource}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Automation summary */}
              {formData.servicesSelected.automation && formData.details.automation && (
                <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex gap-4">
                  <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/10 h-min">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t('module_auto_title', lang)}</h4>
                    <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-400">
                      <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        Volume: ~{formData.details.automation.volumeEstimate.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')} / {lang === 'en' ? 'mo' : 'm'}
                      </span>
                      {formData.details.automation.hasAi && <span className="bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-amber-400 font-bold">{lang === 'en' ? 'AI active' : 'IA active'}</span>}
                    </div>
                    <div className="space-y-1 text-[10px] text-slate-400">
                      <span className="font-bold text-slate-355 block">{lang === 'en' ? 'Connected tools:' : 'Outils interconnectés :'}</span>
                      <div className="flex flex-wrap gap-1">
                        {formData.details.automation.targetSystems.map((s) => (
                          <span key={s} className="text-[9px] bg-amber-500/5 text-amber-300 border border-amber-500/15 px-1.5 py-0.5 rounded uppercase font-mono">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Qualitative info */}
                    <div className="pt-3 border-t border-slate-900/60 text-[10px] space-y-2.5">
                      {formData.details.automation.manualProcess && (
                        <div className="flex items-start gap-2 text-slate-300">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-500 font-bold block">{lang === 'en' ? 'Current manual process:' : 'Processus manuel actuel :'}</span>
                            <p className="italic">"{formData.details.automation.manualProcess}"</p>
                          </div>
                        </div>
                      )}
                      {formData.details.automation.currentTools && (
                        <div className="flex items-start gap-2 text-slate-300">
                          <Cpu className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-500 font-bold block">{lang === 'en' ? 'Communication tools:' : 'Outils de communication :'}</span>
                            <span>{formData.details.automation.currentTools}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-2 text-slate-300">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-slate-500 font-bold block">{lang === 'en' ? 'Desired AI integration:' : 'Intégration d\'IA souhaitée :'}</span>
                          <span className="font-medium">
                            {formData.details.automation.hasAiIntegration === 'yes'
                              ? (lang === 'en' ? '✓ Yes, highly' : '✓ Oui, fortement')
                              : formData.details.automation.hasAiIntegration === 'study'
                              ? (lang === 'en' ? '⚡ Under study' : '⚡ À étudier')
                              : (lang === 'en' ? '❌ No' : '❌ Non')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Calendrier et Contraintes */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
            {/* Date de livraison souhaitée */}
            <div className="space-y-2">
              <label htmlFor="deliveryDate" className="block text-xs font-semibold text-slate-350 uppercase tracking-wider">
                {t('delivery_date_label', lang)} <span className="text-rose-500">*</span>
              </label>
              <input
                id="deliveryDate"
                type="date"
                required
                value={formData.deliveryDate || ''}
                onChange={(e) => onDeliveryDateChange(e.target.value)}
                className="w-full bg-slate-950 text-white rounded-xl py-2.5 px-3 text-xs border border-slate-800 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/25"
              />
            </div>

            {/* Contraintes techniques */}
            <div className="space-y-2">
              <label htmlFor="technicalConstraints" className="block text-xs font-semibold text-slate-355 uppercase tracking-wider">
                {t('tech_constraints_label', lang)}
              </label>
              <textarea
                id="technicalConstraints"
                rows={2}
                placeholder={lang === 'en' ? "e.g., GDPR compliance, hosting in AWS Frankfurt, enhanced database security..." : "Ex: Respect du RGPD, hébergement sur nos serveurs AWS en France, sécurité renforcée..."}
                value={formData.technicalConstraints || ''}
                onChange={(e) => onTechnicalConstraintsChange(e.target.value)}
                className="w-full bg-slate-950 text-white rounded-xl py-2.5 px-3 text-xs border border-slate-800 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/25"
              />
            </div>

            {/* Consignes particulières */}
            <div className="space-y-2">
              <label htmlFor="additionalNotes" className="block text-xs font-semibold text-slate-355 uppercase tracking-wider">
                {t('additional_notes_label', lang)}
              </label>
              <textarea
                id="additionalNotes"
                rows={2}
                placeholder={lang === 'en' ? "e.g., Design preferences, third-party software integrations..." : "Ex: Préférences de design, intégration d'outils annexes..."}
                value={formData.additionalNotes}
                onChange={(e) => onNotesChange(e.target.value)}
                className="w-full bg-slate-950 text-white rounded-xl py-2.5 px-3 text-xs border border-slate-800 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/25"
              />
            </div>
          </div>

          {/* Pièces jointes et liens utiles */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-blue-400" />
                {t('attachments_title', lang)}
              </h4>
              <p className="text-slate-500 text-[10px] mt-1 leading-normal">
                {t('attachments_desc', lang)}
              </p>
            </div>

            {/* Fichiers uploader */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-3">
                <label
                  htmlFor="brief-file-upload"
                  className={`cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white transition-all select-none ${
                    (formData.attachments || []).length >= 5 ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  <Paperclip className="w-4 h-4 text-blue-400" />
                  <span>{t('add_file_btn', lang)}</span>
                  <input
                    id="brief-file-upload"
                    type="file"
                    multiple
                    disabled={isSubmitting || (formData.attachments || []).length >= 5}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.txt,.xls,.xlsx,.csv,.doc,.docx,.png,.jpg,.jpeg,.gif"
                  />
                </label>
                <span className="text-[10px] text-slate-500 leading-tight">
                  {t('add_file_desc', lang)}
                </span>
              </div>

              {fileError && (
                <p className="text-[10px] text-rose-400 font-semibold">{fileError}</p>
              )}

              {/* Files preview list */}
              {(formData.attachments || []).length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="block text-[10px] text-slate-400 font-semibold">
                    {t('attached_files_title', lang).replace('{0}', (formData.attachments || []).length.toString())}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(formData.attachments || []).map((file, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-950/85 px-3 py-2 rounded-xl border border-slate-800/60 text-xs">
                        <span className="text-slate-300 truncate pr-2 max-w-[200px]" title={file.name}>
                          📎 {file.name} <span className="text-slate-500 text-[10px]">({Math.round(file.size / 1024)} Ko)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                          title={t('attachment_remove', lang)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Liens builder */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800/40">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder={t('add_link_placeholder', lang)}
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    className="w-full bg-slate-950 text-white border border-slate-800 focus:border-blue-500/60 rounded-xl pl-10 pr-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/25 transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Links preview list */}
              {(formData.links || []).length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="block text-[10px] text-slate-400 font-semibold">
                    {t('attached_links_title', lang)}
                  </span>
                  <div className="space-y-1.5">
                    {(formData.links || []).map((link, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-950/85 px-3 py-2 rounded-xl border border-slate-800/60 text-xs">
                        <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate max-w-[280px] sm:max-w-[600px]" title={link}>
                          🔗 {link}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                          title={t('attachment_remove', lang)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Estimator & Submission Actions Column */}
        <div className="space-y-5">
          {/* Estimate Display Card */}
          <div className="bg-gradient-to-b from-slate-900/80 to-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-blue-400" />
                {t('estimate_title', lang)}
              </h3>
              {countSelected > 1 && (
                <span className="inline-flex text-[9px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  {lang === 'en'
                    ? `Pack Discount ${countSelected === 2 ? '-10%' : '-15%'} included`
                    : `Remise Pack ${countSelected === 2 ? '-10%' : '-15%'} incluse`}
                </span>
              )}
            </div>

            <div className="text-center py-4 bg-slate-950/60 rounded-xl border border-slate-900 relative overflow-hidden">
              <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">{t('estimate_range_title', lang)}</span>
              <div className="text-xl md:text-2xl font-mono font-extrabold text-white flex items-center justify-center gap-1">
                <span className="text-base font-sans text-slate-400 mr-0.5">$</span>{min.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')}
                <span className="text-slate-550 text-xs font-sans mx-1.5">{lang === 'en' ? 'to' : 'à'}</span>
                <span className="text-base font-sans text-slate-400 mr-0.5">$</span>{max.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')}
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 max-w-[200px] mx-auto leading-relaxed">
                {t('estimate_desc', lang)}
              </p>

              {/* Visual Jauge */}
              <div className="mt-4 px-4">
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden relative border border-slate-800/85">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${max > min ? Math.min(Math.max(((formData.globalBudget - min) / (max - min)) * 100, 0), 100) : 50}%` }}
                  />
                </div>
                <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1.5 px-0.5">
                  <span>Min: ${min.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')}</span>
                  <span className="text-blue-400 font-bold">${formData.globalBudget.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')} ({lang === 'en' ? 'Target' : 'Cible'})</span>
                  <span>Max: ${max.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')}</span>
                </div>
              </div>
            </div>

            {/* Live budget tranche selection */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {t('budget_question', lang)} <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'less_1000', label: lang === 'en' ? 'Less than $1,000' : 'Moins de 1 000 $', desc: lang === 'en' ? 'For micro-needs or simple scripts' : 'Pour les micro-besoins ou scripts simples' },
                  { id: 'between_1000_3000', label: lang === 'en' ? 'Between $1,000 and $3,000' : 'Entre 1 000 $ et 3 000 $', desc: lang === 'en' ? 'Ideal for showcase site or medium automation' : 'Idéal site vitrine ou automatisation intermédiaire' },
                  { id: 'more_3000', label: lang === 'en' ? 'More than $3,000' : 'Plus de 3 000 $', desc: lang === 'en' ? 'SaaS, e-commerce, business app, or advanced AI' : 'SaaS, e-commerce, application métier ou IA avancée' },
                ].map((tranche) => (
                  <button
                    key={tranche.id}
                    type="button"
                    onClick={() => onBudgetTrancheChange(tranche.id as any)}
                    className={`cursor-pointer p-3 rounded-xl border text-left transition-all ${
                      formData.budgetTranche === tranche.id
                        ? 'bg-blue-600/10 border-blue-500/50 text-white ring-1 ring-blue-500/20'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block font-bold text-xs text-white">{tranche.label}</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">{tranche.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Slider de budget optionnel */}
            {formData.budgetTranche === 'more_3000' && (
              <div className="space-y-2 pt-3 border-t border-slate-900/60">
                <div className="flex justify-between text-xs font-bold text-slate-355">
                  <span>{t('budget_slider_title', lang)}</span>
                  <span className="font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 border border-blue-500/20 rounded">
                    ${formData.globalBudget.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')}
                  </span>
                </div>
                <input
                  id="range-client-budget"
                  type="range"
                  min={3000}
                  max={50000}
                  step={500}
                  value={formData.globalBudget}
                  onChange={(e) => onBudgetChange(parseInt(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>$3,000</span>
                  <span>$26,500</span>
                  <span>$50,000+</span>
                </div>
              </div>
            )}

            {/* Dynamic visual indicator budget coherence */}
            <div className="pt-1.5">
              {formData.globalBudget < min ? (
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-400 leading-relaxed animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-white">{t('budget_warning_title', lang)}</span>
                    {t('budget_warning_desc', lang)
                      .replace('{0}', formData.globalBudget.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR'))
                      .replace('{1}', min.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR'))
                    }
                  </div>
                </div>
              ) : formData.globalBudget > max ? (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-start gap-2.5 text-[11px] text-indigo-400 leading-relaxed animate-pulse">
                  <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-white">{t('budget_optimal_title', lang)}</span>
                    {t('budget_optimal_desc', lang)
                      .replace('{0}', formData.globalBudget.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR'))
                      .replace('{1}', max.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR'))
                    }
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-start gap-2.5 text-[11px] text-blue-400 leading-relaxed">
                  <span className="p-1 bg-blue-600 text-white rounded-full font-black text-[8px] flex items-center justify-center">✓</span>
                  <div>
                    <span className="font-bold block text-white">{t('budget_coherent_title', lang)}</span>
                    {t('budget_coherent_desc', lang)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save status errors banner */}
      {submitError && (
        <div id="summary-error-banner" className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-xs text-rose-400 flex items-start gap-3 animate-pulse">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-white mb-0.5">{t('save_error_title', lang)}</span>
            {lang === 'en'
              ? `${submitError} (Your browser kept your local draft safe, please try again).`
              : `${submitError} (Votre navigateur a conservé votre brouillon locale en sécurité, veuillez réessayer).`
            }
          </div>
        </div>
      )}

      {/* Nav footer */}
      <div className="pt-6 border-t border-slate-800/60 flex items-center justify-between">
        <button
          id="btn-summary-back"
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className={`group cursor-pointer inline-flex items-center gap-1.5 text-slate-400 hover:text-white font-medium text-sm transition-colors ${
            isSubmitting ? 'opacity-40 cursor-not-allowed' : ''
          }`}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t('back', lang)}
        </button>

        <button
          id="btn-summary-submit"
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className={`group cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98] transition-all text-sm ${
            isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? (
            <>
              {t('submitting', lang)}
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </>
          ) : (
            <>
              {t('submit', lang)}
              <Check className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
