export type BrandConfig = {
  readonly name: string;
  readonly tagline: string;
  readonly shortTagline: string;
  readonly description: string;
  readonly managedModelsLabel: string;
  readonly hidePromotionalLinks: boolean;
  readonly useExternalChat: boolean;
};

export const BRAND: BrandConfig = {
  name: "GenuineStack",
  tagline: "Production AI voice agents for enterprise customer experience.",
  shortTagline: "Self-hosted bilingual voice AI for Japanese enterprises.",
  description: "GenuineStack Japan — AI voice agent platform with full data residency.",
  managedModelsLabel: "Managed AI",
  hidePromotionalLinks: true,
  useExternalChat: false,
};
