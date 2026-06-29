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

/** DOM id for inline embed widgets (white-label). */
export const EMBED_INLINE_CONTAINER_ID = "genuinestack-inline-container";

/** Global object exposed by the embed script on customer sites. */
export const EMBED_WIDGET_GLOBAL = "GenuineStackWidget";

/** Replace legacy platform names returned by the API with white-label copy. */
export function localizePlatformLabel(text: string): string {
  return text
    .replace(/Default Dograh Model Service Key/gi, `Default ${BRAND.name} Built-in Service Key`)
    .replace(/Dograh Model Service Key/gi, `${BRAND.name} Built-in Service Key`)
    .replace(/\bDograh\b/gi, BRAND.name)
    .replace(/\bdograh\b/g, BRAND.name.toLowerCase());
}

/** Map internal provider ids to user-facing labels. */
export function localizeProviderName(provider: string | undefined): string {
  if (!provider) return "";
  if (provider.toLowerCase() === "dograh") {
    return BRAND.managedModelsLabel;
  }
  return localizePlatformLabel(provider);
}

/** Sanitize embed snippets returned by the API for white-label display. */
export function localizeEmbedScript(script: string): string {
  return script
    .replace(/dograh-widget\.js/g, "genuinestack-widget.js")
    .replace(/['"]dograh-widget['"]/g, "'genuinestack-widget'")
    .replace(/DograhWidget/g, EMBED_WIDGET_GLOBAL)
    .replace(/dograh-inline-container/g, EMBED_INLINE_CONTAINER_ID)
    .replace(/data-dograh-context/g, "data-genuinestack-context")
    .replace(/https:\/\/api\.dograh\.com/g, "https://voice.genuinestack.com");
}
