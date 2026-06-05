/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  RotateCcw,
  Sparkles,
  Download,
  Share2,
  FileText,
  BadgeAlert,
  ArrowRight
} from 'lucide-react';
import { FormSubmission, calculateDevEstimate } from '../../../types/index';
import { motion } from 'motion/react';
import { t, Language } from '../../../services/i18n';

interface SuccessViewProps {
  formData: FormSubmission;
  onReset: () => void;
  folderRef: string;
  pricingSettings?: any;
  lang: Language;
}

export default function SuccessView({ formData, onReset, folderRef, pricingSettings, lang }: SuccessViewProps) {
  const [copied, setCopied] = useState(false);
  const { min, max } = calculateDevEstimate(formData, pricingSettings);

  const generateBriefString = () => {
    const isFr = lang === 'fr';
    let brief = isFr ? `=== BRIEF PROJET NUVATECH-SOLUTIONS ===\n` : `=== NUVATECH-SOLUTIONS PROJECT BRIEF ===\n`;
    brief += isFr ? `Numéro de dossier : ${folderRef}\n` : `Folder number: ${folderRef}\n`;
    brief += isFr ? `Date : ${new Date().toLocaleDateString('fr-FR')}\n\n` : `Date: ${new Date().toLocaleDateString('en-US')}\n\n`;
    brief += isFr ? `CLIENT :\n` : `CLIENT:\n`;
    brief += isFr ? `- Contact : ${formData.clientInfo.contactName}\n` : `- Contact: ${formData.clientInfo.contactName}\n`;
    brief += isFr ? `- Entreprise : ${formData.clientInfo.companyName || 'Non spécifiée'}\n` : `- Company: ${formData.clientInfo.companyName || 'Not specified'}\n`;
    brief += `- Email : ${formData.clientInfo.email}\n`;
    brief += isFr ? `- Téléphone : ${formData.clientInfo.phone}\n` : `- Phone: ${formData.clientInfo.phone}\n`;
    brief += isFr ? `- Secteur : ${formData.clientInfo.sector}\n\n` : `- Sector: ${formData.clientInfo.sector}\n\n`;
    brief += isFr ? `SERVICES RETENUS :\n` : `SERVICES SELECTED:\n`;

    if (formData.servicesSelected.website && formData.details.website) {
      const web = formData.details.website;
      brief += isFr 
        ? `- [Site Web] Type: ${web.siteType}, Taille: ${web.pageSize}, Design: ${web.designType}\n`
        : `- [Website] Type: ${web.siteType}, Size: ${web.pageSize}, Design: ${web.designType}\n`;
      if (web.features.length > 0) {
        brief += `  Features: ${web.features.join(', ')}\n`;
      }
    }
    if (formData.servicesSelected.application && formData.details.application) {
      const app = formData.details.application;
      brief += isFr
        ? `- [Application] Platforms: ${app.platforms.join(', ')}, Complexité: ${app.complexity}, Timeline: ${app.timeline}\n`
        : `- [Application] Platforms: ${app.platforms.join(', ')}, Complexity: ${app.complexity}, Timeline: ${app.timeline}\n`;
      brief += isFr
        ? `  Options: Auth=${app.needsAuth ? 'Oui' : 'Non'}, DB=${app.needsDatabase ? 'Oui' : 'Non'}\n`
        : `  Options: Auth=${app.needsAuth ? 'Yes' : 'No'}, DB=${app.needsDatabase ? 'Yes' : 'No'}\n`;
      if (app.integrations.length > 0) {
        brief += `  Intégrations: ${app.integrations.join(', ')}\n`;
      }
    }
    if (formData.servicesSelected.automation && formData.details.automation) {
      const aut = formData.details.automation;
      brief += isFr
        ? `- [Automatisation] Connectivités: ${aut.targetSystems.join(', ')}\n`
        : `- [Automation] Connections: ${aut.targetSystems.join(', ')}\n`;
      brief += isFr
        ? `  Tâches types: ${aut.automationType.join(', ')}, Volume mensuel: ~${aut.volumeEstimate}/mois\n`
        : `  Typical tasks: ${aut.automationType.join(', ')}, Monthly volume: ~${aut.volumeEstimate}/month\n`;
      brief += isFr
        ? `  IA Active: ${aut.hasAi ? 'Oui' : 'Non'}\n`
        : `  AI Active: ${aut.hasAi ? 'Yes' : 'No'}\n`;
      if (aut.hasAi) {
        brief += isFr
          ? `  Fonction IA : ${aut.aiDescription}\n`
          : `  AI Function: ${aut.aiDescription}\n`;
      }
    }

    brief += isFr ? `\nESTIMATION TECHNIQUE :\n` : `\nTECHNICAL ESTIMATE:\n`;
    brief += isFr
      ? `- Fourchette indicative : $${min.toLocaleString('fr-FR')} - $${max.toLocaleString('fr-FR')}\n`
      : `- Indicative range: $${min.toLocaleString('en-US')} - $${max.toLocaleString('en-US')}\n`;
    brief += isFr
      ? `- Budget cible client : $${formData.globalBudget.toLocaleString('fr-FR')}\n`
      : `- Client target budget: $${formData.globalBudget.toLocaleString('en-US')}\n`;
    if (formData.additionalNotes) {
      brief += isFr ? `\nNote client : ${formData.additionalNotes}\n` : `\nClient note: ${formData.additionalNotes}\n`;
    }

    if (formData.attachments && formData.attachments.length > 0) {
      brief += isFr ? `\nFICHIERS JOINTS :\n` : `\nATTACHED FILES:\n`;
      brief += formData.attachments.map(f => `- ${f.name} (${Math.round(f.size / 1024)} Ko)`).join('\n') + `\n`;
    }

    if (formData.links && formData.links.length > 0) {
      brief += isFr ? `\nLIENS UTILES :\n` : `\nUSEFUL LINKS:\n`;
      brief += formData.links.map(l => `- ${l}`).join('\n') + `\n`;
    }

    return brief;
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(generateBriefString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadBrief = () => {
    const briefString = generateBriefString();
    const blob = new Blob([briefString], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = lang === 'fr' ? `Cahier-des-charges-${folderRef}.txt` : `Project-brief-${folderRef}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="text-center space-y-6 md:space-y-8 max-w-2xl mx-auto py-5"
    >
      {/* Dynamic badge logo success */}
      <div className="space-y-4">
        <div className="relative inline-flex items-center justify-center">
          {/* Pulsing ring background */}
          <span className="absolute inline-flex h-20 w-20 rounded-full bg-emerald-500/10 animate-ping" />
          <div className="relative p-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
            {lang === 'en' ? 'Specifications sheet finalized!' : 'Cahier des charges finalisé !'}
          </h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-md mx-auto">
            {lang === 'en' ? (
              <>Your technical brief for the agency <strong className="text-blue-400">Nuvatech-Solutions</strong> has been successfully generated.</>
            ) : (
              <>Votre brief technique pour l'agence <strong className="text-blue-400">Nuvatech-Solutions</strong> a été généré avec succès.</>
            )}
          </p>
        </div>
      </div>

      {/* Dossier Badge receipt summary layout */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 md:p-6 text-left space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800/80 pb-4 gap-2">
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider">
              {lang === 'en' ? 'Folder reference' : 'Référence dossier'}
            </span>
            <span className="font-mono text-base font-extrabold text-blue-400">{folderRef}</span>
          </div>
          <div className="text-left md:text-right">
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider">
              {lang === 'en' ? 'Analysis Status' : "Status d'analyse"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/5 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <Sparkles className="w-3 h-3 text-emerald-400 font-bold animate-pulse" />
              {lang === 'en' ? 'Eligible for Nuvatech Study' : 'Éligible Étude Nuvatech'}
            </span>
          </div>
        </div>

        <div className="space-y-3.5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            {lang === 'en' ? 'Summary of indicative study' : "Résumé de l'étude indicative"}
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-900/60">
              <span className="text-slate-500 text-[10px]">{lang === 'en' ? 'Client' : 'Client'}</span>
              <p className="text-white font-medium trunc-text leading-tight">{formData.clientInfo.contactName}</p>
              <p className="text-slate-400 text-[10px]">
                {formData.clientInfo.companyName || (lang === 'en' ? 'Independent' : 'Indépendant')}
              </p>
            </div>

            <div className="space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-900/60">
              <span className="text-slate-500 text-[10px]">{lang === 'en' ? 'Estimated Global Quote' : 'Devis Global Estimé'}</span>
              <p className="text-blue-400 font-bold leading-tight font-mono">
                ${min.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')} - ${max.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')}
              </p>
              <p className="text-slate-400 text-[10px]">
                {lang === 'en' ? 'Target budget: ' : 'Budget cible: '}${formData.globalBudget.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')}
              </p>
            </div>
          </div>

          {/* Module checklist selected */}
          <div className="space-y-1.5 pt-1.5">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              {lang === 'en' ? 'Requested technology pillars' : 'Piliers technologiques sollicités'}
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              {formData.servicesSelected.website && (
                <span className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 py-1 px-2.5 rounded-xl border border-blue-500/15">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {lang === 'en' ? 'Website' : 'Site Web'}
                </span>
              )}
              {formData.servicesSelected.application && (
                <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 py-1 px-2.5 rounded-xl border border-indigo-500/15">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  {lang === 'en' ? 'Custom App' : 'Application Custom'}
                </span>
              )}
              {formData.servicesSelected.automation && (
                <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 py-1 px-2.5 rounded-xl border border-amber-500/15">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {lang === 'en' ? 'Automation & AI' : 'Automatisation & IA'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Agency Note warning informative bottom layout */}
        <div className="p-3.5 bg-blue-500/5 rounded-2xl border border-blue-500/15 text-xs text-slate-350 leading-relaxed">
          {lang === 'en' ? (
            <>
              <strong className="text-white font-semibold">Next step:</strong> A Nuvatech business engineer will analyze your specifications sheet ID <span className="font-mono text-blue-400 font-bold">{folderRef}</span> within 24 business hours. We will contact you back by email at <strong className="text-white font-semibold">{formData.clientInfo.email}</strong> or by phone at <strong className="text-white font-semibold">{formData.clientInfo.phone}</strong> for a free technological demonstration.
            </>
          ) : (
            <>
              <strong className="text-white font-semibold">Prochaine étape :</strong> Un ingénieur d'affaires Nuvatech va analyser votre cahier des charges ID <span className="font-mono text-blue-400 font-bold">{folderRef}</span> sous 24h ouvrées. Nous vous recontacterons par email à <strong className="text-white font-semibold">{formData.clientInfo.email}</strong> ou par téléphone au <strong className="text-white font-semibold">{formData.clientInfo.phone}</strong> pour une démonstration technologique gratuite.
            </>
          )}
        </div>
      </div>

      {/* Action triggers dashboard success */}
      <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
        <button
          id="btn-success-copy"
          type="button"
          onClick={handleCopyClipboard}
          className="cursor-pointer inline-flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-5 py-3 rounded-xl transition-all text-xs md:text-sm"
        >
          <Copy className="w-4 h-4 text-slate-400" />
          {copied 
            ? (lang === 'en' ? 'Summary Copied!' : 'Résumé Copié !') 
            : (lang === 'en' ? 'Copy Text' : 'Copier textuellement')
          }
        </button>

        <button
          id="btn-success-download"
          type="button"
          onClick={handleDownloadBrief}
          className="cursor-pointer inline-flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-5 py-3 rounded-xl transition-all text-xs md:text-sm"
        >
          <Download className="w-4 h-4 text-slate-400" />
          {lang === 'en' ? 'Download brief (.txt)' : 'Télécharger le brief (.txt)'}
        </button>

        <button
          id="btn-success-reset"
          type="button"
          onClick={onReset}
          className="cursor-pointer inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all text-xs md:text-sm shadow-lg shadow-blue-500/10"
        >
          <RotateCcw className="w-4 h-4" />
          {lang === 'en' ? 'New Briefing' : 'Nouveau Briefing'}
        </button>
      </div>
    </motion.div>
  );
}
