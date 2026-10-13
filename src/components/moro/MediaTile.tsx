import { Check, FileText, PenLine, Play, Star } from "lucide-react";
import type { MediaFile } from "@/lib/moro-db";
import { formatDuration } from "@/lib/moro-media";

export function MediaTile({
  file,
  onOpen,
  selectable = false,
  selected = false,
  onToggleSelect,
}: {
  file: MediaFile;
  onOpen: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={selectable && onToggleSelect ? onToggleSelect : onOpen}
      className={`relative aspect-square overflow-hidden rounded-xl bg-surface transition-transform active:scale-95 ${
        selected ? "ring-2 ring-primary" : ""
      }`}
    >
      {file.thumb ? (
        <img src={file.thumb} alt={file.name} loading="lazy" className="size-full object-cover" />
      ) : (
        <span className="flex size-full flex-col items-center justify-center gap-1 p-2 text-muted-foreground">
          <FileText className="size-6" />
          <span className="line-clamp-2 text-[10px] leading-tight">{file.name}</span>
        </span>
      )}
      {file.kind === "video" ? (
        <span className="absolute bottom-1 left-1 flex items-center gap-1 rounded-md bg-background/75 px-1.5 py-0.5 text-[10px]">
          <Play className="size-3" />
          {formatDuration(file.duration) ?? "Vidéo"}
        </span>
      ) : null}
      {file.kind === "pdf" ? (
        <span className="absolute bottom-1 left-1 rounded-md bg-background/75 px-1.5 py-0.5 text-[10px]">PDF</span>
      ) : null}
      {file.annotationText || file.annotationDraw ? (
        <PenLine className="absolute bottom-1 right-1 size-3.5 text-accent" />
      ) : null}
      {file.favorite ? <Star className="absolute top-1 right-1 size-4 fill-accent text-accent" /> : null}
      {selectable ? (
        <span
          className={`absolute top-1 left-1 flex size-5 items-center justify-center rounded-full border ${
            selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background/70"
          }`}
        >
          {selected ? <Check className="size-3.5" /> : null}
        </span>
      ) : null}
    </button>
  );
}
