import { BRAND } from "@/constants/branding";

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-background px-6 py-4">
      <div className="flex items-center justify-center text-sm text-muted-foreground">
        <span>&copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.</span>
      </div>
    </footer>
  );
}
