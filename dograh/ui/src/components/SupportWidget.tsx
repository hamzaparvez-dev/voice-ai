"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { BRAND } from "@/constants/branding";

import GenuineStackSupportWidget from "./GenuineStackSupportWidget";

declare global {
  interface Window {
    chatwootSDK?: {
      run: (config: {
        websiteToken: string;
        baseUrl: string;
      }) => void;
    };
    chatwootSettings?: {
      position?: "left" | "right";
      type?: "standard" | "expanded_bubble";
      launcherTitle?: string;
    };
  }
}

const CHATWOOT_BASE_URL = process.env.NEXT_PUBLIC_CHATWOOT_URL;
const CHATWOOT_WEBSITE_TOKEN = process.env.NEXT_PUBLIC_CHATWOOT_TOKEN;

function ChatwootExternalWidget() {
  const pathname = usePathname();

  useEffect(() => {
    const isWorkflowPage = /^\/workflow\/[^/]+(?:\/.*)?$/.test(pathname);

    if (isWorkflowPage) {
      document.getElementById("cw-widget-holder")?.remove();
      document.getElementById("cw-bubble-holder")?.remove();
      document.getElementById("cw-widget-styles")?.remove();
      document
        .querySelector(`script[src="${CHATWOOT_BASE_URL}/packs/js/sdk.js"]`)
        ?.remove();
      delete window.chatwootSettings;
      return;
    }

    if (!CHATWOOT_BASE_URL || !CHATWOOT_WEBSITE_TOKEN) {
      return;
    }

    if (window.chatwootSettings) {
      return;
    }

    window.chatwootSettings = {
      position: "right",
      type: "standard",
      launcherTitle: `Chat with ${BRAND.name}`,
    };

    const existingScript = document.querySelector(
      `script[src="${CHATWOOT_BASE_URL}/packs/js/sdk.js"]`,
    );

    if (existingScript) {
      if (window.chatwootSDK) {
        window.chatwootSDK.run({
          websiteToken: CHATWOOT_WEBSITE_TOKEN,
          baseUrl: CHATWOOT_BASE_URL,
        });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = `${CHATWOOT_BASE_URL}/packs/js/sdk.js`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.chatwootSDK) {
        window.chatwootSDK.run({
          websiteToken: CHATWOOT_WEBSITE_TOKEN,
          baseUrl: CHATWOOT_BASE_URL,
        });
      }
    };

    document.body.appendChild(script);
  }, [pathname]);

  return null;
}

export default function SupportWidget() {
  const useExternalChat =
    BRAND.useExternalChat === true
    && Boolean(CHATWOOT_BASE_URL)
    && Boolean(CHATWOOT_WEBSITE_TOKEN);

  if (useExternalChat) {
    return <ChatwootExternalWidget />;
  }

  return <GenuineStackSupportWidget />;
}
