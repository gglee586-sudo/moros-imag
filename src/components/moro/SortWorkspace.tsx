import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftRight, Clock, SkipForward, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/moro/BottomNav";
import { DocPreview } from "@/components/moro/DocPreview";
import { ImportButton } from "@/components/moro/ImportButton";
import { PageHeader } from "@/components/moro/PageHeader";
import { classify, deleteFile, markReview, saveSettings, undoLast } from "@/lib/moro-db";
import { docTypeOf } from "@/lib/moro-media";
import { useFiles, useFolders, useObjectUrl, useRefreshMoro, useSettings } from "@/lib/moro-hooks";
import { toast } from "sonner";

type SortKind = "photos" | "documents";

export function SortWorkspace({ kind }: { kind: SortKind }) {
  const { data: files } = useFiles();
  const { data: folders } = useFolders();
  const { data: settings } = useSettings();
  const refresh = useRefreshMoro();
  const [index, setIndex] = useState(0);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const isDocuments = kind === "documents";
  const modeFolders = useMemo(
    () => folders.filter((folder) => (folder.kind ?? "photos") === kind),
    [folders, kind],
  );

  const queue = useMemo(
    () =>
      files.filter((file) => {
        if (file.folderId !== null) return false;
        const isDocument = docTypeOf(file.mime, file.name) !== null;
        return isDocuments ? isDocument : !isDocument;
      }),
    [files, isDocuments],
  );
  const total = queue.length;
  const current = queue[Math.min(index, Math.max(total - 1, 0))];
  const url = useObjectUrl(current?.blob);
  const mode = isDocuments ? settings.documentMode : settings.mode;
  const gestures = isDocuments ? settings.documentGestures : settings.gestures;
  const shortcuts = isDocuments ? settings.documentShortcuts : settings.shortcuts;

  useEffect(() => {
    if (index > 0 && index >= total) setIndex(Math.max(total - 1, 0));
  }, [index, total]);

  const act = async (fn: () => Promise<unknown>, message: string) => {
    try {
      await fn();
      refresh();
      toast.success(message);
    } catch {
      toast.error("Impossible de traiter ce fichier. Il n'est peut-être plus accessible.");
    }
  };

  const toFolder = (folderId: string, name: string) => {
    if (!current) return;
    void act(() => classify(current.id, folderId, mode), `${mode === "copy" ? "Copié" : "Déplacé"} dans ${name}`);
  };

  useEffect(() => {
    if (!shortcuts) return;
    const onKey = (event: KeyboardEvent) => {
      if (!current) return;
      if (event.key === " ") {
        event.preventDefault();
        setIndex((value) => value + 1);
      } else if (event.key === "Backspace") {
        event.preventDefault();
        void act(undoLast, "Action annulée");
      } else if (/^[1-9]$/.test(event.key)) {
        const folder = modeFolders[Number(event.key) - 1];
        if (folder) toFolder(folder.id, folder.name);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const toggleMode = async () => {
    const nextMode = mode === "move" ? "copy" : "move";
    await saveSettings(
      isDocuments ? { ...settings, documentMode: nextMode } : { ...settings, mode: nextMode },
    );
    refresh();
  };

  return (
    <div className={isDocuments ? "doc-theme min-h-dvh" : undefined}>
      <div className="app-shell">
        <PageHeader
          title={isDocuments ? "Tri des documents" : "Tri rapide"}
          subtitle={total > 0 ? `${Math.min(index + 1, total)} / ${total} ${isDocuments ? "documents" : "photos et vidéos"} restants` : "Rien à trier"}
          action={
            <Button variant="secondary" size="sm" onClick={() => void toggleMode()}>
              <ArrowLeftRight className="size-4" />
              {mode === "move" ? "Déplacer" : "Copier"}
            </Button>
          }
        />

        {!current ? (
          <div className="rounded-2xl bg-card p-6 text-center shadow-card">
            <p className="text-sm text-muted-foreground">
              {isDocuments ? "Aucun document à trier." : "Toutes les photos et vidéos sont classées."}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <ImportButton label="Importer des fichiers" />
              <Button variant="ghost" asChild><Link to="/">Mes dossiers</Link></Button>
            </div>
          </div>
        ) : (
          <div>
            <div
              className="relative flex h-[56dvh] min-h-[22rem] max-h-[42rem] items-center justify-center overflow-hidden rounded-xl bg-card shadow-card"
              onTouchStart={(event) => {
                const touch = event.touches[0];
                swipe.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
              }}
              onTouchEnd={(event) => {
                if (!gestures || !swipe.current) return;
                const touch = event.changedTouches[0];
                if (!touch) return;
                const dx = touch.clientX - swipe.current.x;
                const dy = touch.clientY - swipe.current.y;
                swipe.current = null;
                if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
                  if (dx < 0) setIndex((value) => value + 1);
                  else void act(() => markReview(current.id), "Mis dans « À revoir »");
                }
              }}
            >
              {isDocuments ? (
                <DocPreview file={current} />
              ) : url && current.kind === "image" ? (
                <img src={url} alt={current.name} className="size-full object-contain" />
              ) : url && current.kind === "video" ? (
                <video src={url} controls playsInline className="size-full object-contain" />
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  <p className="text-sm">Aperçu indisponible</p>
                  <p className="mt-1 text-xs">{current.name}</p>
                </div>
              )}
            </div>
            <p className="mt-2 text-center text-sm text-muted-foreground">{current.name}</p>

            <div className="mt-3 grid grid-cols-4 gap-1">
              <Button className="h-auto min-w-0 flex-col gap-1 px-1 py-2 text-xs" variant="secondary" onClick={() => setIndex((value) => value + 1)}><SkipForward /><span>Passer</span></Button>
              <Button className="h-auto min-w-0 flex-col gap-1 px-1 py-2 text-xs" variant="secondary" onClick={() => void act(() => markReview(current.id), "Mis dans « À revoir »")}><Clock /><span>À revoir</span></Button>
              <Button className="h-auto min-w-0 flex-col gap-1 px-1 py-2 text-xs" variant="ghost" onClick={() => void act(undoLast, "Action annulée")}><Undo2 /><span>Annuler</span></Button>
              <Button
                className="h-auto min-w-0 flex-col gap-1 px-1 py-2 text-xs text-destructive"
                variant="ghost"
                onClick={async () => {
                  if (!confirm(`Placer « ${current.name} » dans la corbeille ?`)) return;
                  await act(() => deleteFile(current.id), "Fichier placé dans la corbeille");
                }}
              ><Trash2 /><span>Supprimer</span></Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {modeFolders.length === 0 ? (
                <p className="w-full text-center text-sm text-muted-foreground">
                  {isDocuments
                    ? "Crée un dossier documents depuis la bibliothèque documents pour commencer à classer."
                    : "Crée un dossier depuis l'accueil pour commencer à classer."}
                </p>
              ) : modeFolders.map((folder, folderIndex) => (
                <Button
                  key={folder.id}
                  type="button"
                  variant="secondary"
                  onClick={() => toFolder(folder.id, folder.name)}
                  className="h-auto flex-1 basis-[30%] flex-col px-3 py-3 text-sm"
                >
                  <span>{folder.name}</span>
                  {folderIndex < 9 && shortcuts ? <span className="text-[10px] text-muted-foreground">touche {folderIndex + 1}</span> : null}
                </Button>
              ))}
            </div>
          </div>
        )}

        <BottomNav />
      </div>
    </div>
  );
}