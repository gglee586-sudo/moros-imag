import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckSquare, ChevronLeft, RotateCcw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/moro/BottomNav";
import { MediaTile } from "@/components/moro/MediaTile";
import { emptyTrash, permanentlyDeleteFile, restoreFile } from "@/lib/moro-db";
import { useRefreshMoro, useTrash } from "@/lib/moro-hooks";
import { toast } from "sonner";

export const Route = createFileRoute("/trash")({
  head: () => ({
    meta: [
      { title: "Corbeille — Moro.iMac" },
      { name: "description", content: "Restaurez ou supprimez définitivement les fichiers placés dans la corbeille locale." },
      { property: "og:title", content: "Corbeille — Moro.iMac" },
      { property: "og:description", content: "Gérez les photos et documents supprimés dans Moro.iMac." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrashPage,
});

function TrashPage() {
  const { data: trash } = useTrash();
  const refresh = useRefreshMoro();
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const finishSelection = () => {
    setSelected([]);
    setSelectMode(false);
  };

  const restoreSelected = async () => {
    for (const id of selected) await restoreFile(id);
    refresh();
    finishSelection();
    toast.success("Fichiers restaurés");
  };

  const deleteSelected = async () => {
    if (!confirm(`Supprimer définitivement ${selected.length} fichier${selected.length > 1 ? "s" : ""} ? Cette action est irréversible.`)) return;
    for (const id of selected) await permanentlyDeleteFile(id);
    refresh();
    finishSelection();
    toast.success("Fichiers supprimés définitivement");
  };

  return (
    <div className="app-shell">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 pt-5 pb-4">
        <Button variant="ghost" size="icon" asChild aria-label="Retour aux réglages">
          <Link to="/settings"><ChevronLeft className="size-5" /></Link>
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">Corbeille</h1>
          <p className="text-xs text-muted-foreground">{trash.length} élément{trash.length > 1 ? "s" : ""}</p>
        </div>
        {trash.length > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={async () => {
              if (!confirm("Vider définitivement toute la corbeille ? Cette action est irréversible.")) return;
              await emptyTrash();
              refresh();
              finishSelection();
              toast.success("Corbeille vidée");
            }}
          >
            Vider
          </Button>
        ) : <span />}
      </header>

      {trash.length === 0 ? (
        <div className="mt-16 text-center">
          <Trash2 className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">La corbeille est vide.</p>
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {selectMode ? `${selected.length} sélectionné${selected.length > 1 ? "s" : ""}` : "Touchez Sélectionner pour agir"}
            </p>
            <Button variant="ghost" size="sm" onClick={() => selectMode ? finishSelection() : setSelectMode(true)}>
              {selectMode ? <X className="size-4" /> : <CheckSquare className="size-4" />}
              {selectMode ? "Terminer" : "Sélectionner"}
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {trash.map((file) => (
              <MediaTile
                key={file.id}
                file={file}
                onOpen={() => {
                  setSelectMode(true);
                  toggle(file.id);
                }}
                selectable={selectMode}
                selected={selected.includes(file.id)}
                onToggleSelect={() => toggle(file.id)}
              />
            ))}
          </div>
        </>
      )}

      {selected.length > 0 ? (
        <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 mx-auto grid w-[min(28rem,92vw)] grid-cols-2 gap-2 rounded-xl border border-border bg-card p-2 shadow-card">
          <Button variant="secondary" onClick={() => void restoreSelected()}>
            <RotateCcw className="size-4" /> Restaurer
          </Button>
          <Button variant="ghost" className="text-destructive" onClick={() => void deleteSelected()}>
            <Trash2 className="size-4" /> Supprimer
          </Button>
        </div>
      ) : null}

      <BottomNav />
    </div>
  );
}