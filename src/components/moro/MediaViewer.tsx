import { useState } from "react";
import {
  Eye,
  EyeOff,
  Info,
  PenLine,
  Share2,
  Star,
  Trash2,
  X,
  FolderInput,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Folder, MediaFile } from "@/lib/moro-db";
import { classify, clearAnnotation, deleteFile, toggleFavorite } from "@/lib/moro-db";
import { formatDate, formatDuration, formatSize } from "@/lib/moro-media";
import { useObjectUrl, useRefreshMoro } from "@/lib/moro-hooks";
import { shareFiles } from "@/lib/moro-share";
import { AnnotationEditor } from "@/components/moro/AnnotationEditor";
import { toast } from "sonner";

export function MediaViewer({
  file,
  folders,
  onClose,
}: {
  file: MediaFile;
  folders: Folder[];
  onClose: () => void;
}) {
  const url = useObjectUrl(file.blob);
  const refresh = useRefreshMoro();
  const [showInfo, setShowInfo] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [editing, setEditing] = useState(false);

  const folderName = folders.find((f) => f.id === file.folderId)?.name ?? "Non classé";
  const hasAnnotation = Boolean(file.annotationText || file.annotationDraw);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between gap-2 border-b border-border px-2 py-2">
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer">
          <X className="size-5" />
        </Button>
        <p className="line-clamp-1 flex-1 text-center text-sm text-muted-foreground">{file.name}</p>
        {hasAnnotation ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={showAnnotations ? "Masquer les annotations" : "Afficher les annotations"}
            onClick={() => setShowAnnotations((v) => !v)}
          >
            {showAnnotations ? <Eye className="size-5 text-accent" /> : <EyeOff className="size-5" />}
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Favori"
          onClick={async () => {
            await toggleFavorite(file.id);
            refresh();
          }}
        >
          <Star className={file.favorite ? "size-5 fill-accent text-accent" : "size-5"} />
        </Button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto bg-black/40">
        {!url ? null : file.kind === "image" ? (
          <div className="relative">
            <img src={url} alt={file.name} className="max-h-full max-w-full object-contain" />
            {showAnnotations && file.annotationDraw ? (
              <img
                src={file.annotationDraw}
                alt=""
                className="pointer-events-none absolute inset-0 size-full object-contain"
              />
            ) : null}
          </div>
        ) : file.kind === "video" ? (
          <video src={url} controls playsInline className="max-h-full max-w-full" />
        ) : (
          <iframe src={url} title={file.name} className="size-full min-h-[60vh] bg-white" />
        )}
      </div>

      {showAnnotations && file.annotationText ? (
        <p className="border-t border-border bg-accent/10 px-4 py-2 text-sm">{file.annotationText}</p>
      ) : null}

      {showInfo ? (
        <div className="space-y-1 border-t border-border bg-card px-4 py-3 text-sm">
          <p className="text-muted-foreground">Dossier : <span className="text-foreground">{folderName}</span></p>
          <p className="text-muted-foreground">Taille : <span className="text-foreground">{formatSize(file.size)}</span></p>
          <p className="text-muted-foreground">Date : <span className="text-foreground">{formatDate(file.date)}</span></p>
          {file.width ? (
            <p className="text-muted-foreground">Dimensions : <span className="text-foreground">{file.width} × {file.height}</span></p>
          ) : null}
          {file.duration ? (
            <p className="text-muted-foreground">Durée : <span className="text-foreground">{formatDuration(file.duration)}</span></p>
          ) : null}
          <p className="text-muted-foreground">Type : <span className="text-foreground">{file.mime || "inconnu"}</span></p>
          {hasAnnotation ? (
            <Button
              variant="ghost"
              size="sm"
              className="px-0"
              onClick={async () => {
                await clearAnnotation(file.id);
                refresh();
                toast.success("Annotation supprimée, photo intacte");
              }}
            >
              Supprimer l'annotation
            </Button>
          ) : null}
        </div>
      ) : null}

      {showMove ? (
        <div className="flex flex-wrap gap-2 border-t border-border bg-card px-4 py-3">
          {folders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Crée d'abord un dossier.</p>
          ) : (
            folders.map((folder) => (
              <Button
                key={folder.id}
                size="sm"
                variant="secondary"
                onClick={async () => {
                  await classify(file.id, folder.id, "move");
                  refresh();
                  setShowMove(false);
                  toast.success(`Déplacé dans ${folder.name}`);
                }}
              >
                {folder.name}
              </Button>
            ))
          )}
        </div>
      ) : null}

      <div className="flex items-center justify-around border-t border-border bg-card px-1 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <Button variant="ghost" size="sm" onClick={() => setShowMove((v) => !v)}>
          <FolderInput className="size-4" /> Déplacer
        </Button>
        {file.kind === "image" ? (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <PenLine className="size-4" /> Annoter
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            const result = await shareFiles([file]);
            if (result === "downloaded") toast.success("Fichier enregistré sur cet appareil");
            if (result === "shared") toast.success("Partage envoyé");
          }}
        >
          <Share2 className="size-4" /> Partager
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowInfo((v) => !v)}>
          <Info className="size-4" /> Infos
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <a href={url} download={file.name} aria-label="Enregistrer">
            <Download className="size-4" />
          </a>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Supprimer"
          onClick={async () => {
            if (!confirm(`Placer « ${file.name} » dans la corbeille ?`)) return;
            await deleteFile(file.id);
            refresh();
            onClose();
            toast.success("Fichier placé dans la corbeille");
          }}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>

      {editing ? <AnnotationEditor file={file} onClose={() => setEditing(false)} /> : null}
    </div>
  );
}
