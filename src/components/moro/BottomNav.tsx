import { Link } from "@tanstack/react-router";
import { Folder, Layers, Star, Search, Settings } from "lucide-react";

const items = [
  { to: "/", label: "Dossiers", icon: Folder },
  { to: "/sort", label: "À trier", icon: Layers },
  { to: "/favorites", label: "Favoris", icon: Star },
  { to: "/search", label: "Recherche", icon: Search },
  { to: "/settings", label: "Réglages", icon: Settings },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-sidebar/95 backdrop-blur">
      <div className="mx-auto flex max-w-[30rem] items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground transition-colors"
            activeProps={{ className: "text-primary" }}
          >
            <Icon className="size-5" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
