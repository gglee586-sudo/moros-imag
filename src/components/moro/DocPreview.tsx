import { useEffect, useRef, useState } from "react";
import { BookOpen, FileSpreadsheet, FileText, Presentation } from "lucide-react";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { MediaFile } from "@/lib/moro-db";
import { docTypeOf, formatSize, type DocType } from "@/lib/moro-media";
import { useObjectUrl } from "@/lib/moro-hooks";

const DOC_META: Record<Exclude<DocType, "pdf">, { label: string; Icon: typeof FileText }> = {
  word: { label: "Word", Icon: FileText },
  excel: { label: "Excel", Icon: FileSpreadsheet },
  powerpoint: { label: "PowerPoint", Icon: Presentation },
  epub: { label: "EPUB", Icon: BookOpen },
};

/** Aperçu « survol » d'un document : 1re page pour les PDF, couverture stylisée pour les autres formats. */
export function DocPreview({ file }: { file: MediaFile }) {
  const url = useObjectUrl(file.blob);
  const type = docTypeOf(file.mime, file.name);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pageCount, setPageCount] = useState<number>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!url || type !== "pdf") return;
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        const data = new Uint8Array(await file.blob.arrayBuffer());
        const doc = await pdfjs.getDocument({ data }).promise;
        setPageCount(doc.numPages);
        const page = await doc.getPage(1);
        const canvas = canvasRef.current;
        const box = canvas?.parentElement;
        if (!canvas || !box) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("canvas indisponible");
        const base = page.getViewport({ scale: 1 });
        const rect = box.getBoundingClientRect();
        const scale = Math.min(rect.width / base.width, rect.height / base.height) || 1;
        const viewport = page.getViewport({ scale });
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, type, file]);

  if (type && type !== "pdf") {
    const meta = DOC_META[type];
    const Icon = meta.Icon;
    return (
      <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="rounded-3xl bg-primary/15 p-5">
          <Icon className="size-12 text-primary" />
        </div>
        <span className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {meta.label}
        </span>
        <p className="line-clamp-2 text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatSize(file.size)} — aperçu réduit, ouvre le fichier pour tout voir
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex size-full items-center justify-center overflow-hidden p-3">
      {url ? <canvas ref={canvasRef} className="max-h-full max-w-full rounded-lg bg-white shadow-card" /> : null}
      {failed ? (
        <div className="p-6 text-center text-muted-foreground">
          <p className="text-sm">Aperçu indisponible pour ce PDF</p>
          <p className="mt-1 text-xs">{file.name}</p>
        </div>
      ) : null}
      {pageCount ? (
        <span className="absolute right-2.5 bottom-2.5 rounded-full bg-background/75 px-2.5 py-1 text-[11px] text-muted-foreground backdrop-blur">
          Page 1 / {pageCount}
        </span>
      ) : null}
    </div>
  );
}
