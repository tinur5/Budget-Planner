// Re-export types used throughout the app
export type UserRole = "ADMIN" | "PARTNER";
export type PotType = "GENERAL" | "SAVINGS" | "BUSINESS" | "PERSONAL" | "SHARED" | "AHV";
export type IncomeType = "SALARY" | "BUSINESS" | "SIDE" | "OTHER";
export type RuleType = "PERCENTAGE" | "FIXED" | "REMAINDER" | "THRESHOLD";
export type SuggestionStatus = "PENDING" | "DONE" | "SKIPPED";

export const POT_TYPE_LABELS: Record<PotType, string> = {
  GENERAL: "Allgemein",
  SAVINGS: "Sparkonto",
  BUSINESS: "Business",
  PERSONAL: "Persönlich",
  SHARED: "Gemeinsam",
  AHV: "AHV / Rücklagen",
};

export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  SALARY: "Lohn",
  BUSINESS: "Business",
  SIDE: "Nebeneinkommen",
  OTHER: "Sonstiges",
};

export const RULE_TYPE_LABELS: Record<RuleType, string> = {
  PERCENTAGE: "Prozentsatz",
  FIXED: "Fixbetrag",
  REMAINDER: "Restbetrag",
  THRESHOLD: "Schwellenwert",
};

export const EXPENSE_CATEGORIES = [
  "Haushalt",
  "Lebensmittel",
  "Transport",
  "Gesundheit",
  "Bildung",
  "Freizeit",
  "Kleider & Mode",
  "Beauty & Körperpflege",
  "Restaurant & Essen",
  "Business",
  "Geschäftsessen",
  "Eventmaterial",
  "Rücklagen",
  "Sparen",
  "Versicherung",
  "Steuern",
  "Wohnen",
  "Sonstiges",
];

export const POT_ICONS = [
  "wallet",
  "briefcase",
  "home",
  "heart",
  "star",
  "shield",
  "target",
  "trending-up",
  "piggy-bank",
  "credit-card",
  "building",
  "car",
];

export const POT_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#84cc16", // lime
];
