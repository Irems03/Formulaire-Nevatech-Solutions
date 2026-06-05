/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ClientInfo {
  companyName: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  sector: string;
  projectObjective: string;
}

export type ServiceType = 'website' | 'application' | 'automation';

export interface WebsiteDetails {
  siteType: 'vitrine' | 'ecommerce' | 'portfolio' | 'landing';
  pageSize: 'small' | 'medium' | 'large';
  designType: 'custom' | 'template';
  features: string[]; // e.g., ['contact', 'multilang', 'payment', 'seo', 'blog']
  messagePrincipal: string;
  charteGraphicReady: 'yes' | 'partial' | 'no';
  indispensablePages: string;
  benchmarkSites: string;
}

export interface ApplicationDetails {
  platforms: string[]; // e.g., ['web', 'ios', 'android']
  needsAuth: boolean;
  needsDatabase: boolean;
  integrations: string[]; // e.g., ['stripe', 'maps', 'calendar', 'custom-api']
  complexity: 'simple' | 'medium' | 'complex';
  timeline: 'asap' | 'standard' | 'flexible';
  mainProblem: string;
  userRoles: string;
  mvpFeatures: string;
  dataSource: string;
}

export interface AutomationDetails {
  targetSystems: string[]; // e.g., ['crm', 'stripe', 'slack', 'sheets', 'emails']
  automationType: string[]; // e.g., ['leads', 'chatbot', 'reporting', 'sync']
  hasAi: boolean;
  aiDescription: string;
  volumeEstimate: number; // monthly automated tasks
  manualProcess: string;
  currentTools: string;
  hasAiIntegration: 'yes' | 'no' | 'study';
}

export interface AttachmentFile {
  name: string;
  size: number;
  type: string;
  dataUrl: string; // Base64 data url
}

export interface FormSubmission {
  clientInfo: ClientInfo;
  servicesSelected: Record<ServiceType, boolean>;
  details: {
    website?: WebsiteDetails;
    application?: ApplicationDetails;
    automation?: AutomationDetails;
  };
  globalBudget: number; // in Euros
  budgetTranche: 'less_1000' | 'between_1000_3000' | 'more_3000';
  deliveryDate: string;
  technicalConstraints: string;
  additionalNotes: string;
  attachments?: AttachmentFile[];
  links?: string[];
}

export interface ValidationErrors {
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  sector?: string;
  services?: string;
  websiteSiteType?: string;
  applicationPlatforms?: string;
  automationSystems?: string;
  aiDescription?: string;
}

// Initial state helpers
export const INITIAL_CLIENT_INFO: ClientInfo = {
  companyName: '',
  contactName: '',
  contactRole: '',
  email: '',
  phone: '',
  sector: '',
  projectObjective: '',
};

export const INITIAL_WEBSITE_DETAILS: WebsiteDetails = {
  siteType: 'vitrine',
  pageSize: 'small',
  designType: 'custom',
  features: [],
  messagePrincipal: '',
  charteGraphicReady: 'no',
  indispensablePages: '',
  benchmarkSites: '',
};

export const INITIAL_APPLICATION_DETAILS: ApplicationDetails = {
  platforms: [],
  needsAuth: false,
  needsDatabase: false,
  integrations: [],
  complexity: 'medium',
  timeline: 'standard',
  mainProblem: '',
  userRoles: '',
  mvpFeatures: '',
  dataSource: '',
};

export const INITIAL_AUTOMATION_DETAILS: AutomationDetails = {
  targetSystems: [],
  automationType: [],
  hasAi: false,
  aiDescription: '',
  volumeEstimate: 1000,
  manualProcess: '',
  currentTools: '',
  hasAiIntegration: 'no',
};

export const INITIAL_FORM_STATE: FormSubmission = {
  clientInfo: INITIAL_CLIENT_INFO,
  servicesSelected: {
    website: false,
    application: false,
    automation: false,
  },
  details: {
    website: INITIAL_WEBSITE_DETAILS,
    application: INITIAL_APPLICATION_DETAILS,
    automation: INITIAL_AUTOMATION_DETAILS,
  },
  globalBudget: 5000,
  budgetTranche: 'between_1000_3000',
  deliveryDate: '',
  technicalConstraints: '',
  additionalNotes: '',
  attachments: [],
  links: [],
};

// Simple helper validation functions
export function validateClientInfo(info: ClientInfo, lang: 'fr' | 'en' = 'fr'): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!info.contactName.trim()) {
    errors.contactName = lang === 'en' ? "Contact name is required." : "Le nom du contact est requis.";
  } else if (info.contactName.trim().length < 2) {
    errors.contactName = lang === 'en' ? "Name must be at least 2 characters long." : "Le nom doit comporter au moins 2 caractères.";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!info.email.trim()) {
    errors.email = lang === 'en' ? "Email address is required." : "L'adresse email est requise.";
  } else if (!emailRegex.test(info.email)) {
    errors.email = lang === 'en' ? "Email address is invalid." : "L'adresse email n'est pas valide.";
  }

  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$|^[0-9+() \-]{8,20}$/;
  if (!info.phone.trim()) {
    errors.phone = lang === 'en' ? "Phone number is required." : "Le numéro de téléphone est requis.";
  } else if (!phoneRegex.test(info.phone)) {
    errors.phone = lang === 'en' ? "Phone format is unrecognized." : "Le format du téléphone n'est pas reconnu.";
  }

  if (!info.sector.trim()) {
    errors.sector = lang === 'en' ? "Please select your company's industry sector." : "Veuillez sélectionner le secteur d'activité de votre entreprise.";
  }

  if (!info.contactRole.trim()) {
    errors.contactRole = lang === 'en' ? "Contact role is required." : "Le rôle du contact est requis.";
  }

  if (!info.projectObjective.trim()) {
    errors.projectObjective = lang === 'en' ? "Main project objective is required." : "L'objectif principal du projet est requis.";
  }

  return errors;
}

export interface PricingSettings {
  website_vitrine_min: number;
  website_vitrine_max: number;
  website_ecommerce_min: number;
  website_ecommerce_max: number;
  website_portfolio_min: number;
  website_portfolio_max: number;
  website_landing_min: number;
  website_landing_max: number;
  website_pagesize_medium_min: number;
  website_pagesize_medium_max: number;
  website_pagesize_large_min: number;
  website_pagesize_large_max: number;
  website_design_custom_min: number;
  website_design_custom_max: number;
  website_feature_unit_min: number;
  website_feature_unit_max: number;
  app_platform_unit_min: number;
  app_platform_unit_max: number;
  app_needs_auth_min: number;
  app_needs_auth_max: number;
  app_needs_database_min: number;
  app_needs_database_max: number;
  app_integration_unit_min: number;
  app_integration_unit_max: number;
  app_complexity_medium_min: number;
  app_complexity_medium_max: number;
  app_complexity_complex_min: number;
  app_complexity_complex_max: number;
  automation_system_unit_min: number;
  automation_system_unit_max: number;
  automation_type_unit_min: number;
  automation_type_unit_max: number;
  automation_ai_booster_min: number;
  automation_ai_booster_max: number;
  automation_volume_booster_min: number;
  automation_volume_booster_max: number;
}

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  website_vitrine_min: 1500,
  website_vitrine_max: 3000,
  website_ecommerce_min: 4000,
  website_ecommerce_max: 8000,
  website_portfolio_min: 1200,
  website_portfolio_max: 2500,
  website_landing_min: 800,
  website_landing_max: 1500,
  website_pagesize_medium_min: 800,
  website_pagesize_medium_max: 1500,
  website_pagesize_large_min: 2000,
  website_pagesize_large_max: 4000,
  website_design_custom_min: 1000,
  website_design_custom_max: 2500,
  website_feature_unit_min: 300,
  website_feature_unit_max: 600,
  app_platform_unit_min: 3000,
  app_platform_unit_max: 6500,
  app_needs_auth_min: 800,
  app_needs_auth_max: 1600,
  app_needs_database_min: 1200,
  app_needs_database_max: 3000,
  app_integration_unit_min: 700,
  app_integration_unit_max: 1500,
  app_complexity_medium_min: 2000,
  app_complexity_medium_max: 4500,
  app_complexity_complex_min: 5000,
  app_complexity_complex_max: 12000,
  automation_system_unit_min: 600,
  automation_system_unit_max: 1400,
  automation_type_unit_min: 800,
  automation_type_unit_max: 2000,
  automation_ai_booster_min: 1500,
  automation_ai_booster_max: 4000,
  automation_volume_booster_min: 500,
  automation_volume_booster_max: 1200,
};

export const DEFAULT_SECTORS = [
  'Technologie & SaaS',
  'E-commerce & Retail',
  'Santé & Bien-être',
  'Finance & Immobilier',
  'Éducation & Formation',
  'Artisanat & Services Locaux',
  'Autre secteur',
];

// Interactive cost simulation based on variables
export function calculateDevEstimate(state: FormSubmission, customSettings?: Partial<PricingSettings>): { min: number; max: number } {
  const s = { ...DEFAULT_PRICING_SETTINGS, ...customSettings };

  let min = 0;
  let max = 0;

  let servicesCount = 0;

  if (state.servicesSelected.website) {
    servicesCount++;
    const web = state.details.website || INITIAL_WEBSITE_DETAILS;
    // Base cost by type
    if (web.siteType === 'vitrine') {
      min += s.website_vitrine_min;
      max += s.website_vitrine_max;
    } else if (web.siteType === 'ecommerce') {
      min += s.website_ecommerce_min;
      max += s.website_ecommerce_max;
    } else if (web.siteType === 'portfolio') {
      min += s.website_portfolio_min;
      max += s.website_portfolio_max;
    } else {
      min += s.website_landing_min;
      max += s.website_landing_max;
    }

    // Page count
    if (web.pageSize === 'medium') {
      min += s.website_pagesize_medium_min;
      max += s.website_pagesize_medium_max;
    } else if (web.pageSize === 'large') {
      min += s.website_pagesize_large_min;
      max += s.website_pagesize_large_max;
    }

    // Design level
    if (web.designType === 'custom') {
      min += s.website_design_custom_min;
      max += s.website_design_custom_max;
    }

    // Features
    min += web.features.length * s.website_feature_unit_min;
    max += web.features.length * s.website_feature_unit_max;
  }

  if (state.servicesSelected.application) {
    servicesCount++;
    const app = state.details.application || INITIAL_APPLICATION_DETAILS;
    // Multiplatform modifier
    const platformCount = app.platforms.length;
    min += platformCount * s.app_platform_unit_min;
    max += platformCount * s.app_platform_unit_max;

    // Database & Auth
    if (app.needsAuth) {
      min += s.app_needs_auth_min;
      max += s.app_needs_auth_max;
    }
    if (app.needsDatabase) {
      min += s.app_needs_database_min;
      max += s.app_needs_database_max;
    }

    // Integrations
    min += app.integrations.length * s.app_integration_unit_min;
    max += app.integrations.length * s.app_integration_unit_max;

    // Complexity modifier
    if (app.complexity === 'medium') {
      min += s.app_complexity_medium_min;
      max += s.app_complexity_medium_max;
    } else if (app.complexity === 'complex') {
      min += s.app_complexity_complex_min;
      max += s.app_complexity_complex_max;
    }
  }

  if (state.servicesSelected.automation) {
    servicesCount++;
    const aut = state.details.automation || INITIAL_AUTOMATION_DETAILS;
    // Base automation systems
    min += aut.targetSystems.length * s.automation_system_unit_min;
    max += aut.targetSystems.length * s.automation_system_unit_max;

    // Automation features
    min += aut.automationType.length * s.automation_type_unit_min;
    max += aut.automationType.length * s.automation_type_unit_max;

    // AI booster
    if (aut.hasAi) {
      min += s.automation_ai_booster_min;
      max += s.automation_ai_booster_max;
    }

    // Volume estimate
    if (aut.volumeEstimate > 5000) {
      min += s.automation_volume_booster_min;
      max += s.automation_volume_booster_max;
    }
  }

  // Multi-service discount
  if (servicesCount > 1) {
    const discount = servicesCount === 2 ? 0.10 : 0.15; // 10% or 15% discount
    min = Math.round(min * (1 - discount));
    max = Math.round(max * (1 - discount));
  }

  // Ensure minimum threshold if no options selected but service ticked
  if (min === 0 && servicesCount > 0) {
    min = 1000;
    max = 2000;
  }

  return { min, max };
}

export interface ErrorLog {
  id: string;
  message: string;
  stack?: string;
  component?: string;
  url?: string;
  user_agent?: string;
  status: 'Nouveau' | 'En cours' | 'Résolu';
  fix_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export interface AnalyticsStats {
  totalVisits: number;
  uniqueVisitors: number;
  conversionRate: number;
}

export interface GeneralSettings {
  maintenance_mode: boolean;
  maintenance_message: string;
  custom_css: string;
  custom_js: string;
  welcome_title: string;
  welcome_subtitle: string;
  support_email: string;
  max_upload_size: number;
}

