/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FormSubmission, calculateDevEstimate, PricingSettings, AttachmentFile, ErrorLog, AnalyticsStats, GeneralSettings } from '../types/index';

let supabaseClientInstance: SupabaseClient | null = null;

/**
 * Lazily retrieves or instantiates the Supabase client.
 * Returns null if the VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables are missing,
 * which prevents the application from crashing on startup.
 */
export function getSupabase(): SupabaseClient | null {
  const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
  const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.trim() === '' || supabaseAnonKey.trim() === '') {
    return null;
  }

  if (!supabaseClientInstance) {
    try {
      supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey);
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseClientInstance;
}

/**
 * Fetches dynamic settings from Supabase 'app_settings' table.
 */
export async function fetchAppSettings(): Promise<Partial<PricingSettings> | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'pricing_rules')
      .maybeSingle();

    if (error) {
      console.warn('Error loading app_settings:', error);
      return null;
    }

    return data?.value as Partial<PricingSettings> | null;
  } catch (err) {
    console.warn('Failed to fetch app settings:', err);
    return null;
  }
}

/**
 * Saves dynamic settings to Supabase 'app_settings' table.
 */
export async function saveAppSettings(settings: PricingSettings): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: "Le client Supabase n'est pas disponible." };
  }

  try {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'pricing_rules', value: settings }, { onConflict: 'key' });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || err.toString() };
  }
}

/**
 * Updates the status of an onboarding brief.
 */
export async function updateOnboardingStatus(id: string, status: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: "Le client Supabase n'est pas disponible." };
  }

  try {
    const { error } = await supabase
      .from('client_onboardings')
      .update({ status: status })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || err.toString() };
  }
}

/**
 * Submits the technical brief to Supabase 'client_onboardings' table.
 * If Supabase is not configured, it simulates a successful submission to let the user preview the app cleanly.
 */
export async function submitBrief(
  formData: FormSubmission,
  folderRef: string,
  customPricingSettings?: Partial<PricingSettings>
): Promise<{ success: boolean; error?: string; simulated?: boolean }> {
  const supabase = getSupabase();

  if (!supabase) {
    console.warn(
      'Supabase is not configured yet. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Falling back to local preview mode.'
    );
    // Return a mock success to allow client-side preview in the builder
    return { success: true, simulated: true };
  }

  try {
    // Étape 4 inputs / pricing dynamic calculation with custom pricing settings
    const { min, max } = calculateDevEstimate(formData, customPricingSettings);

    // Étape 2 & 3: project_types (Array)
    const projectTypes = (Object.keys(formData.servicesSelected) as Array<keyof typeof formData.servicesSelected>).filter(
      (key) => formData.servicesSelected[key]
    );

    // specifications (JSONB containing all dynamic qualitative and quantitative parameters)
    const specifications = {
      services_selected: formData.servicesSelected,
      client_info_extended: {
        contact_role: formData.clientInfo.contactRole,
        project_objective: formData.clientInfo.projectObjective,
      },
      website: formData.servicesSelected.website ? formData.details.website : null,
      application: formData.servicesSelected.application ? formData.details.application : null,
      automation: formData.servicesSelected.automation ? formData.details.automation : null,
      section3: {
        budget_tranche: formData.budgetTranche,
        delivery_date: formData.deliveryDate,
        technical_constraints: formData.technicalConstraints,
      },
      attachments: formData.attachments || [],
      links: formData.links || []
    };

    // complexity and timeline (from Étape 2 & 3)
    const complexityLevel = formData.servicesSelected.application
      ? formData.details.application?.complexity || 'medium'
      : (formData.servicesSelected.automation ? 'medium' : 'simple');

    // Use deliveryDate if specified, else timeline
    const deliveryDeadline = formData.deliveryDate || (formData.servicesSelected.application
      ? formData.details.application?.timeline || 'standard'
      : 'standard');

    // Merge technical constraints and additional notes for backward compatibility
    let specialInstructions = '';
    if (formData.technicalConstraints?.trim()) {
      specialInstructions += `[Contraintes techniques & réglementaires] :\n${formData.technicalConstraints.trim()}\n\n`;
    }
    if (formData.additionalNotes?.trim()) {
      specialInstructions += `[Consignes additionnelles] :\n${formData.additionalNotes.trim()}\n\n`;
    }
    if (formData.attachments && formData.attachments.length > 0) {
      specialInstructions += `[Fichiers joints] :\n` + formData.attachments.map(f => `- ${f.name} (${Math.round(f.size / 1024)} Ko)`).join('\n') + `\n\n`;
    }
    if (formData.links && formData.links.length > 0) {
      specialInstructions += `[Liens joints] :\n` + formData.links.map(l => `- ${l}`).join('\n') + `\n\n`;
    }

    const payload = {
      // Étape 1
      contact_name: formData.clientInfo.contactName,
      company_name: formData.clientInfo.companyName || null,
      email: formData.clientInfo.email,
      phone: formData.clientInfo.phone,
      industry: formData.clientInfo.sector,

      // Étape 2 & 3
      project_types: projectTypes,
      specifications: specifications,
      complexity_level: complexityLevel,
      delivery_deadline: deliveryDeadline,

      // Étape 4
      client_target_budget: formData.globalBudget,
      estimated_min_price: min,
      estimated_max_price: max,
      special_instructions: specialInstructions.trim() || null,
      
      status: 'Nouveau',
      folder_ref: folderRef,
      submitted_at: new Date().toISOString(),
    };

    // Check if brief already exists as Prospect/Brouillon to update it, otherwise insert new
    const { data: existing } = await supabase
      .from('client_onboardings')
      .select('id, status')
      .eq('folder_ref', folderRef)
      .maybeSingle();

    let dbResult;
    if (existing?.id) {
      dbResult = await supabase
        .from('client_onboardings')
        .update({ ...payload, status: 'Nouveau' })
        .eq('id', existing.id);
    } else {
      dbResult = await supabase
        .from('client_onboardings')
        .insert([payload]);
    }

    if (dbResult.error) {
      console.error('Supabase save error details:', dbResult.error);
      return { success: false, error: `${dbResult.error.code}: ${dbResult.error.message}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unhandled submit error:', err);
    return { success: false, error: err.message || 'Une erreur inconnue est survenue.' };
  }
}

/**
 * Fetches the dynamic list of sectors of activity from Supabase 'app_settings' table.
 */
export async function fetchAppSectors(): Promise<string[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'sectors')
      .maybeSingle();

    if (error) {
      console.warn('Error loading sectors settings:', error);
      return null;
    }

    return data?.value as string[] | null;
  } catch (err) {
    console.warn('Failed to fetch app sectors:', err);
    return null;
  }
}

/**
 * Saves the dynamic list of sectors of activity to Supabase 'app_settings' table.
 */
export async function saveAppSectors(sectors: string[]): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: "Le client Supabase n'est pas disponible." };
  }

  try {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'sectors', value: sectors }, { onConflict: 'key' });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || err.toString() };
  }
}

/**
 * Submits a help/support message to the client_onboardings table as a support ticket.
 */
export async function submitSupportMessage(
  name: string,
  email: string,
  message: string,
  files?: AttachmentFile[],
  links?: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: "Supabase n'est pas configuré." };

  try {
    const folderRef = 'SUP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    let specialInstructions = `[MESSAGE DE SUPPORT CLIENT] :\n${message}\n\n`;
    if (files && files.length > 0) {
      specialInstructions += `[Fichiers joints] :\n` + files.map(f => `- ${f.name} (${Math.round(f.size / 1024)} Ko)`).join('\n') + `\n\n`;
    }
    if (links && links.length > 0) {
      specialInstructions += `[Liens joints] :\n` + links.map(l => `- ${l}`).join('\n') + `\n\n`;
    }

    const payload = {
      contact_name: name,
      company_name: '[Ticket Support]',
      email: email,
      phone: 'SUPPORT',
      industry: 'Support',
      project_types: ['support'],
      specifications: { 
        support_message: message,
        attachments: files || [],
        links: links || []
      },
      complexity_level: 'simple',
      delivery_deadline: 'N/A',
      client_target_budget: 0,
      estimated_min_price: 0,
      estimated_max_price: 0,
      special_instructions: specialInstructions.trim(),
      status: 'Nouveau',
      folder_ref: folderRef,
      submitted_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('client_onboardings')
      .insert([payload]);

    if (error) {
      console.error('Failed to submit support ticket:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Unhandled support submit error:', err);
    return { success: false, error: err.message || err.toString() };
  }
}

/**
 * Log error in the database.
 */
export async function logErrorInDb(
  message: string,
  stack?: string,
  component?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const user_agent = typeof navigator !== 'undefined' ? navigator.userAgent : '';

  const payload = {
    message,
    stack,
    component,
    url,
    user_agent,
    status: 'Nouveau',
    created_at: new Date().toISOString()
  };

  if (!supabase) {
    // Save to local storage for demo fallback
    try {
      const stored = localStorage.getItem('nuvatech_error_logs');
      const logs = stored ? JSON.parse(stored) : [];
      logs.unshift({ ...payload, id: 'local-' + Math.random().toString(36).substring(2, 9) });
      localStorage.setItem('nuvatech_error_logs', JSON.stringify(logs.slice(0, 50)));
    } catch (e) {
      console.warn('LocalStorage error saving log:', e);
    }
    return { success: true };
  }

  try {
    const { error } = await supabase.from('error_logs').insert([payload]);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || err.toString() };
  }
}

/**
 * Fetch error logs from database.
 */
export async function fetchErrorLogs(): Promise<ErrorLog[] | null> {
  const supabase = getSupabase();
  if (!supabase) {
    try {
      const stored = localStorage.getItem('nuvatech_error_logs');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  try {
    const { data, error } = await supabase
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error loading error_logs:', error);
      const stored = localStorage.getItem('nuvatech_error_logs');
      return stored ? JSON.parse(stored) : [];
    }
    return data as ErrorLog[];
  } catch (err) {
    console.warn('Failed to fetch error logs:', err);
    return null;
  }
}

/**
 * Update the status / resolution notes of an error log.
 */
export async function resolveErrorLog(
  id: string,
  status: 'Nouveau' | 'En cours' | 'Résolu',
  fixNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  const resolved_at = status === 'Résolu' ? new Date().toISOString() : null;

  if (!supabase || id.startsWith('local-')) {
    try {
      const stored = localStorage.getItem('nuvatech_error_logs');
      if (stored) {
        let logs: ErrorLog[] = JSON.parse(stored);
        logs = logs.map(l => l.id === id ? { ...l, status, fix_notes: fixNotes, resolved_at: resolved_at || undefined } : l);
        localStorage.setItem('nuvatech_error_logs', JSON.stringify(logs));
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  try {
    const { error } = await supabase
      .from('error_logs')
      .update({ status, fix_notes: fixNotes, resolved_at })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || err.toString() };
  }
}

/**
 * Delete an error log.
 */
export async function deleteErrorLog(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase || id.startsWith('local-')) {
    try {
      const stored = localStorage.getItem('nuvatech_error_logs');
      if (stored) {
        let logs: ErrorLog[] = JSON.parse(stored);
        logs = logs.filter(l => l.id !== id);
        localStorage.setItem('nuvatech_error_logs', JSON.stringify(logs));
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  try {
    const { error } = await supabase.from('error_logs').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || err.toString() };
  }
}

/**
 * Track user clicks/visits.
 */
export async function trackVisit(): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (typeof window === 'undefined') return { success: true };

  // Check unique visitor via localStorage
  let visitorId = localStorage.getItem('nuvatech_visitor_id');
  let isUnique = false;
  if (!visitorId) {
    visitorId = 'vis-' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('nuvatech_visitor_id', visitorId);
    isUnique = true;
  }

  const trackedSession = sessionStorage.getItem('nuvatech_session_tracked');
  if (trackedSession) return { success: true };
  sessionStorage.setItem('nuvatech_session_tracked', 'true');

  const referrer = typeof document !== 'undefined' ? document.referrer : '';
  const user_agent = typeof navigator !== 'undefined' ? navigator.userAgent : '';

  try {
    const total = Number(localStorage.getItem('nuvatech_local_visits_total') || 0);
    const unique = Number(localStorage.getItem('nuvatech_local_visits_unique') || 0);
    localStorage.setItem('nuvatech_local_visits_total', String(total + 1));
    if (isUnique) {
      localStorage.setItem('nuvatech_local_visits_unique', String(unique + 1));
    }
  } catch (e) {}

  if (!supabase) return { success: true };

  try {
    const { error } = await supabase.from('app_analytics').insert([{
      event_type: 'visit',
      visitor_id: visitorId,
      referrer,
      user_agent
    }]);

    if (error) {
      console.warn('Analytics DB insert error:', error.message);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || err.toString() };
  }
}

/**
 * Fetch analytics data.
 */
export async function fetchAnalyticsData(): Promise<AnalyticsStats | null> {
  const supabase = getSupabase();
  
  const getLocalStats = async () => {
    try {
      const total = Number(localStorage.getItem('nuvatech_local_visits_total') || 12);
      const unique = Number(localStorage.getItem('nuvatech_local_visits_unique') || 6);
      return {
        totalVisits: total,
        uniqueVisitors: unique,
        conversionRate: total > 0 ? Math.round((3 / total) * 100) : 0
      };
    } catch (e) {
      return { totalVisits: 12, uniqueVisitors: 6, conversionRate: 50 };
    }
  };

  if (!supabase) {
    return getLocalStats();
  }

  try {
    const { count: totalCount, error: totalError } = await supabase
      .from('app_analytics')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    const { data: uniqueData, error: uniqueError } = await supabase
      .from('app_analytics')
      .select('visitor_id');

    if (uniqueError) throw uniqueError;

    const uniqueCount = new Set((uniqueData || []).map(r => r.visitor_id)).size;

    const { count: briefsCount, error: briefsError } = await supabase
      .from('client_onboardings')
      .select('*', { count: 'exact', head: true })
      .not('status', 'eq', 'Prospect');

    if (briefsError) throw briefsError;

    const total = totalCount || 0;
    return {
      totalVisits: total,
      uniqueVisitors: uniqueCount || 0,
      conversionRate: total > 0 ? Math.round(((briefsCount || 0) / total) * 100) : 0
    };
  } catch (err) {
    console.warn('Failed to fetch analytics from DB, using fallback:', err);
    return getLocalStats();
  }
}

/**
 * Save onboarding progress as a draft Prospect at Step 1.
 */
export async function saveDraftBrief(
  formData: FormSubmission,
  folderRef: string,
  customPricingSettings?: Partial<PricingSettings>
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: true };

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('client_onboardings')
      .select('id, status')
      .eq('folder_ref', folderRef)
      .maybeSingle();

    if (fetchError) {
      console.warn('Error checking existing brief for draft:', fetchError);
    }

    if (existing && existing.status !== 'Prospect' && existing.status !== 'Brouillon') {
      return { success: true };
    }

    const { min, max } = calculateDevEstimate(formData, customPricingSettings);
    const projectTypes = (Object.keys(formData.servicesSelected) as Array<keyof typeof formData.servicesSelected>).filter(
      (key) => formData.servicesSelected[key]
    );

    const specifications = {
      services_selected: formData.servicesSelected,
      client_info_extended: {
        contact_role: formData.clientInfo.contactRole,
        project_objective: formData.clientInfo.projectObjective,
      },
      website: formData.servicesSelected.website ? formData.details.website : null,
      application: formData.servicesSelected.application ? formData.details.application : null,
      automation: formData.servicesSelected.automation ? formData.details.automation : null,
      section3: {
        budget_tranche: formData.budgetTranche,
        delivery_date: formData.deliveryDate,
        technical_constraints: formData.technicalConstraints,
      },
      attachments: formData.attachments || [],
      links: formData.links || []
    };

    const payload = {
      contact_name: formData.clientInfo.contactName,
      company_name: formData.clientInfo.companyName || null,
      email: formData.clientInfo.email,
      phone: formData.clientInfo.phone,
      industry: formData.clientInfo.sector,
      project_types: projectTypes,
      specifications: specifications,
      complexity_level: 'simple',
      delivery_deadline: 'standard',
      client_target_budget: formData.globalBudget,
      estimated_min_price: min,
      estimated_max_price: max,
      special_instructions: formData.technicalConstraints || null,
      status: 'Prospect',
      folder_ref: folderRef,
      submitted_at: new Date().toISOString()
    };

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from('client_onboardings')
        .update(payload)
        .eq('id', existing.id);

      if (updateError) return { success: false, error: updateError.message };
    } else {
      const { error: insertError } = await supabase
        .from('client_onboardings')
        .insert([payload]);

      if (insertError) return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || err.toString() };
  }
}

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  maintenance_mode: false,
  maintenance_message: "Le site est actuellement en maintenance pour mise à jour. Nous serons de retour très rapidement !",
  custom_css: "",
  custom_js: "",
  welcome_title: "Configurez votre Projet",
  welcome_subtitle: "Décrivez-nous vos besoins en quelques étapes et obtenez une estimation immédiate pour votre projet.",
  support_email: "nuvatechsolutions386@keemail.me",
  max_upload_size: 2
};

/**
 * Fetch general configuration settings.
 */
export async function fetchGeneralSettings(): Promise<GeneralSettings> {
  const supabase = getSupabase();
  if (!supabase) {
    try {
      const stored = localStorage.getItem('nuvatech_general_settings');
      return stored ? { ...DEFAULT_GENERAL_SETTINGS, ...JSON.parse(stored) } : DEFAULT_GENERAL_SETTINGS;
    } catch (e) {
      return DEFAULT_GENERAL_SETTINGS;
    }
  }

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'general_config')
      .maybeSingle();

    if (error) {
      console.warn('Error loading general settings:', error);
      return DEFAULT_GENERAL_SETTINGS;
    }

    return data?.value ? { ...DEFAULT_GENERAL_SETTINGS, ...data.value } : DEFAULT_GENERAL_SETTINGS;
  } catch (err) {
    console.warn('Failed to fetch general settings:', err);
    return DEFAULT_GENERAL_SETTINGS;
  }
}

/**
 * Save general configuration settings.
 */
export async function saveGeneralSettings(settings: GeneralSettings): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  
  try {
    localStorage.setItem('nuvatech_general_settings', JSON.stringify(settings));
  } catch (e) {}

  if (!supabase) return { success: true };

  try {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'general_config', value: settings }, { onConflict: 'key' });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || err.toString() };
  }
}

