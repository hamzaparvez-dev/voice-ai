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
  managedModelsLabel: "Built-in AI",
  hidePromotionalLinks: true,
  useExternalChat: false,
};

/** Replace legacy platform names returned by the API with white-label copy. */
export function localizePlatformLabel(text: string): string {
  return text
    .replace(/Default Dograh Model Service Key/gi, `Default ${BRAND.name} Built-in Service Key`)
    .replace(/Dograh Model Service Key/gi, `${BRAND.name} Built-in Service Key`)
    .replace(/\bDograh\b/g, BRAND.name);
}
