import { useState } from "react";
import { CheckSquare, Share2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaTile } from "@/components/moro/MediaTile";
import { MediaViewer } from "@/components/moro/MediaViewer";
import type { Folder, MediaFile } from "@/lib/moro-db";
import { deleteFile } from "@/lib/moro-db";
import { docTypeOf } from "@/lib/moro-media";
import { useRefreshMoro } from "@/lib/moro-hooks";
import { shareFiles } from "@/lib/moro-share";
import { toast } from "sonner";

export function MediaGrid({ files, folders }: { files: MediaFile[]; folders: Folder[] }) {
  const refresh = useRefreshMoro();
  const [openId, setOpenId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const active = files.find((f) => f.id === openId);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const chosen = files.filter((f) => selected.includes(f.id));

  const exitSelect = () => {
    setSelectMode(false);
    setSelected([]);
  };

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {selectMode ? `${selected.length} sélectionné${selected.length > 1 ? "s" : ""}` : `${files.length} éléments`}
        </p>
        {selectMode ? (
          <Button variant="ghost" size="sm" onClick={exitSelect}>
            <X className="size-4" /> Terminer
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setSelectMode(true)} disabled={files.length === 0}>
            <CheckSquare className="size-4" /> Sélectionner
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {files.map((file) => (
          <MediaTile
            key={file.id}
            file={file}
            onOpen={() => setOpenId(file.id)}
            selectable={selectMode}
            selected={selected.includes(file.id)}
            onToggleSelect={() => toggle(file.id)}
          />
        ))}
      </div>

      {selectMode && selected.length > 0 ? (
        <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 mx-auto flex w-[min(28rem,92vw)] items-center justify-around rounded-2xl border border-border bg-card px-3 py-2 shadow-card">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              const result = await shareFiles(chosen);
              if (result === "downloaded") toast.success("Fichiers enregistrés sur cet appareil");
              if (result === "shared") toast.success("Partage envoyé");
            }}
          >
            <Share2 className="size-4" /> Partager
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              if (!confirm(`Placer ${selected.length} fichier(s) dans la corbeille ?`)) return;
              for (const id of selected) await deleteFile(id);
              refresh();
              exitSelect();
              toast.success("Fichiers placés dans la corbeille");
            }}
          >
            <Trash2 className="size-4 text-destructive" /> Supprimer
          </Button>
        </div>
      ) : null}

      {active ? (
        <MediaViewer
          file={active}
          folders={folders.filter(
            (folder) =>
              (folder.kind ?? "photos") ===
              (docTypeOf(active.mime, active.name) ? "documents" : "photos"),
          )}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </>
  );
}
