"use client";

import { BookOpen, Bot, HelpCircle, MessageCircle, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { BRAND } from "@/constants/branding";
import { cn } from "@/lib/utils";

const HELP_LINKS = [
  {
    title: "Voice Agents",
    description: "Create and manage bilingual admissions agents",
    href: "/workflow",
    icon: Bot,
  },
  {
    title: "Knowledge Base",
    description: "Upload school FAQs, curriculum, and fee documents",
    href: "/files",
    icon: BookOpen,
  },
  {
    title: "Model Configuration",
    description: "Set up LLM, STT, and TTS for English and Japanese",
    href: "/model-configurations",
    icon: Settings,
  },
  {
    title: "Deployment Guide",
    description: "Hostinger setup and ICMG demo checklist",
    href: "https://github.com/hamzaparvez-dev/voice-ai/blob/main/deployment/hostinger-setup.md",
    external: true,
    icon: HelpCircle,
  },
] as const;

export default function GenuineStackSupportWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isWorkflowPage = /^\/workflow\/[^/]+(?:\/.*)?$/.test(pathname);
  if (isWorkflowPage) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
      {open && (
        <div className="w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl">
          <div className="border-b border-border/60 bg-zinc-950 px-5 py-4 text-zinc-50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                  Support
                </p>
                <h2 className="mt-1 text-lg font-semibold">
                  Welcome to {BRAND.name}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {BRAND.shortTagline}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-zinc-300 hover:bg-white/10 hover:text-white"
                onClick={() => setOpen(false)}
                aria-label="Close support panel"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3 px-4 py-4">
            <p className="text-sm font-medium text-foreground">Quick help</p>
            <div className="space-y-2">
              {HELP_LINKS.map((item) => {
                const Icon = item.icon;
                const content = (
                  <>
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </>
                );

                if ("external" in item && item.external) {
                  return (
                    <a
                      key={item.title}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 rounded-xl border border-border/60 px-3 py-3 transition-colors hover:bg-muted/40"
                      onClick={() => setOpen(false)}
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="flex items-start gap-3 rounded-xl border border-border/60 px-3 py-3 transition-colors hover:bg-muted/40"
                    onClick={() => setOpen(false)}
                  >
                    {content}
                  </Link>
                );
              })}
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-3">
              <p className="text-sm font-medium">Need human support?</p>
              <p className="mt-1 text-xs text-muted-foreground">
                For TBIS demo and ICMG deployment help, contact your GenuineStack administrator.
              </p>
            </div>
          </div>

          <div className="border-t border-border/60 px-4 py-3 text-center text-[11px] text-muted-foreground">
            Powered by {BRAND.name}
          </div>
        </div>
      )}

      <Button
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg",
          open && "rotate-0",
        )}
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close support" : "Open support"}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </Button>
    </div>
  );
}
