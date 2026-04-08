export type ModuleCategory = "free-core" | "sales-suite" | "ai-agents";

export type MarketplaceModule = {
  moduleId: string;
  name: string;
  description: string;
  category: ModuleCategory;
  priceMonthly: number | null;
  pricePerUse: number | null;
  freeLabel?: string;
};

export const CORE_MODULES: MarketplaceModule[] = [
  {
    moduleId: "crm",
    name: "CRM",
    description: "Leads, deals, contacts, pipeline, sequences, scoring.",
    category: "free-core",
    priceMonthly: null,
    freeLabel: "Free",
  },
  {
    moduleId: "finance",
    name: "Finance",
    description: "Invoices, accounts, bank feeds, payment tracking.",
    category: "free-core",
    priceMonthly: null,
    freeLabel: "Free",
  },
  {
    moduleId: "hr",
    name: "HR",
    description: "Employees, attendance, leave, payroll.",
    category: "free-core",
    priceMonthly: null,
    freeLabel: "Free",
  },
  {
    moduleId: "whatsapp",
    name: "WhatsApp",
    description: "Sessions, templates, two-way messaging.",
    category: "free-core",
    priceMonthly: null,
    freeLabel: "Free",
  },
];

export const SALES_SUITE_MODULES: MarketplaceModule[] = [
  {
    moduleId: "sequences",
    name: "Sequences",
    description: "Email & WhatsApp drip campaigns, enroll leads.",
    category: "sales-suite",
    priceMonthly: 9,
    pricePerUse: null,
  },
  {
    moduleId: "sales-dialer",
    name: "Sales Dialer",
    description: "Click-to-call, call logging, voicemail drop.",
    category: "sales-suite",
    priceMonthly: 19,
    pricePerUse: null,
  },
  {
    moduleId: "enrichment",
    name: "Data Enrichment",
    description: "Company & contact data enrichment APIs.",
    category: "sales-suite",
    priceMonthly: 14,
    pricePerUse: 0.05,
  },
];
