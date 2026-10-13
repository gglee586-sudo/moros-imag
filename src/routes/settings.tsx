import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BottomNav } from "@/components/moro/BottomNav";
import { PageHeader } from "@/components/moro/PageHeader";
import { exportBackup, importBackup, resetAll, saveSettings } from "@/lib/moro-db";
import { useFiles, useFolders, useRefreshMoro, useSettings, useTrash } from "@/lib/moro-hooks";
import { formatSize } from "@/lib/moro-media";
import { shareFiles } from "@/lib/moro-share";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Réglages — Moro.iMac" },
      { name: "description", content: "Mode déplacer ou copier, gestes, thème clair ou sombre, sauvegarde et réinitialisation de Moro.iMac." },
      { property: "og:title", content: "Réglages — Moro.iMac" },
      { property: "og:description", content: "Personnalisez le tri, l'apparence et la sauvegarde de vos données locales." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: settings } = useSettings();
  const { data: files } = useFiles();
  const { data: folders } = useFolders();
  const { data: trash } = useTrash();
  const refresh = useRefreshMoro();
  const importRef = useRef<HTMLInputElement>(null);
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);

  const update = async (patch: Partial<typeof settings>) => {
    await saveSettings({ ...settings, ...patch });
    refresh();
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="app-shell">
      <PageHeader title="Réglages" subtitle="Tout reste sur cet appareil" />

      <section className="space-y-4 rounded-2xl bg-card p-4 shadow-card">
        <h2 className="text-sm font-medium text-muted-foreground">Tri Photos</h2>
        <div className="flex items-center justify-between">
          <Label htmlFor="mode">Copier au lieu de déplacer</Label>
          <Switch
            id="mode"
            checked={settings.mode === "copy"}
            onCheckedChange={(v) => void update({ mode: v ? "copy" : "move" })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="gestures">Gestes tactiles</Label>
          <Switch id="gestures" checked={settings.gestures} onCheckedChange={(v) => void update({ gestures: v })} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="shortcuts">Raccourcis clavier (1–9, espace, retour)</Label>
          <Switch id="shortcuts" checked={settings.shortcuts} onCheckedChange={(v) => void update({ shortcuts: v })} />
        </div>
      </section>

      <section className="doc-theme mt-4 space-y-4 rounded-2xl border border-primary/25 bg-card p-4 shadow-card">
        <h2 className="text-sm font-medium text-primary">Tri Documents</h2>
        <div className="flex items-center justify-between">
          <Label htmlFor="document-mode">Copier au lieu de déplacer</Label>
          <Switch
            id="document-mode"
            checked={settings.documentMode === "copy"}
            onCheckedChange={(value) => void update({ documentMode: value ? "copy" : "move" })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="document-gestures">Gestes tactiles</Label>
          <Switch id="document-gestures" checked={settings.documentGestures} onCheckedChange={(value) => void update({ documentGestures: value })} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="document-shortcuts">Raccourcis clavier</Label>
          <Switch id="document-shortcuts" checked={settings.documentShortcuts} onCheckedChange={(value) => void update({ documentShortcuts: value })} />
        </div>
      </section>

      <section className="mt-4 space-y-4 rounded-2xl bg-card p-4 shadow-card">
        <h2 className="text-sm font-medium text-muted-foreground">Apparence</h2>
        <div className="flex items-center justify-between">
          <Label htmlFor="theme">Thème clair</Label>
          <Switch
            id="theme"
            checked={light}
            onCheckedChange={(v) => {
              setLight(v);
              document.documentElement.classList.toggle("light", v);
              localStorage.setItem("moro-theme", v ? "light" : "dark");
            }}
          />
        </div>
      </section>

      <section className="mt-4 rounded-2xl bg-card p-4 shadow-card">
        <Button variant="ghost" className="h-auto w-full justify-start px-0" asChild>
          <Link to="/trash">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
              <Trash2 className="size-5" />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-sm font-medium">Corbeille</span>
              <span className="block text-xs text-muted-foreground">
                {trash.length} élément{trash.length > 1 ? "s" : ""} à restaurer ou supprimer
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        </Button>
      </section>

      <section className="mt-4 space-y-3 rounded-2xl bg-card p-4 shadow-card">
        <h2 className="text-sm font-medium text-muted-foreground">Partage</h2>
        <p className="text-sm">
          Envoyez vos fichiers vers un téléphone ou un ordinateur avec le menu de partage de l'appareil.
        </p>
        <Button
          variant="secondary"
          disabled={files.length === 0}
          onClick={async () => {
            const result = await shareFiles(files);
            if (result === "shared") toast.success("Partage envoyé");
            if (result === "downloaded") toast.success("Fichiers enregistrés sur cet appareil");
          }}
        >
          <Share2 className="size-4" />
          Partager tous les fichiers
        </Button>
        <p className="text-xs text-muted-foreground">
          Sur téléphone, le menu de partage s'ouvre. Sur ordinateur, les fichiers sont téléchargés.
        </p>
      </section>

      <section className="mt-4 space-y-3 rounded-2xl bg-card p-4 shadow-card">
        <h2 className="text-sm font-medium text-muted-foreground">Données</h2>
        <p className="text-sm">
          {folders.length} dossiers · {files.length} fichiers · {formatSize(totalSize)}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              const blob = await exportBackup();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "moro-imac-sauvegarde.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Exporter la configuration
          </Button>
          <Button variant="secondary" onClick={() => importRef.current?.click()}>
            Restaurer
          </Button>
          <Button
            variant="ghost"
            className="text-destructive"
            onClick={async () => {
              if (!confirm("Tout effacer : dossiers, fichiers importés et réglages ?")) return;
              await resetAll();
              refresh();
              toast.success("Moro.iMac réinitialisé");
            }}
          >
            Réinitialiser
          </Button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                await importBackup(await file.text());
                refresh();
                toast.success("Configuration restaurée");
              } catch {
                toast.error("Fichier de sauvegarde illisible");
              }
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Aucune donnée n'est envoyée sur Internet : tout est stocké dans le navigateur de ce téléphone.
        </p>
      </section>

      <BottomNav />
    </div>
  );
}
