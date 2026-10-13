import { useEffect, useRef, useState } from "react";
import { Eraser, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MediaFile } from "@/lib/moro-db";
import { saveAnnotation } from "@/lib/moro-db";
import { useObjectUrl, useRefreshMoro } from "@/lib/moro-hooks";
import { toast } from "sonner";

const PEN_COLORS: string[] = ["#FF4D4F", "#4C8DFF", "#22D3A7", "#FACC15", "#FFFFFF"];

export function AnnotationEditor({ file, onClose }: { file: MediaFile; onClose: () => void }) {
  const url = useObjectUrl(file.blob);
  const refresh = useRefreshMoro();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const snapshots = useRef<string[]>([]);
  const [color, setColor] = useState<string>(PEN_COLORS[0] as string);
  const [width, setWidth] = useState(6);
  const [text, setText] = useState(file.annotationText ?? "");

  // Prépare le calque transparent aux dimensions de la photo.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = file.width && file.width > 0 ? file.width : 1080;
    const h = file.height && file.height > 0 ? file.height : 1080;
    const scale = Math.min(1, 1400 / Math.max(w, h));
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const existing = file.annotationDraw;
    if (!existing) return;
    const img = new Image();
    img.onload = () => canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = existing;
  }, [file.id, file.width, file.height, file.annotationDraw]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    snapshots.current = [...snapshots.current.slice(-9), canvas.toDataURL()];
    canvas.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = point(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const end = () => {
    drawing.current = false;
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const last = snapshots.current.pop();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!last) return;
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = last;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    snapshots.current.push(canvas.toDataURL());
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const isBlank = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return true;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) return false;
    return true;
  };

  const save = async () => {
    const canvas = canvasRef.current;
    const draw = canvas && !isBlank() ? canvas.toDataURL("image/png") : undefined;
    await saveAnnotation(file.id, { text: text.trim() || undefined, draw });
    refresh();
    toast.success("Annotation enregistrée (la photo d'origine reste intacte)");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-2 py-2">
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer">
          <X className="size-5" />
        </Button>
        <p className="text-sm text-muted-foreground">Annoter</p>
        <Button size="sm" onClick={save}>
          Enregistrer
        </Button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden bg-black/50 p-2">
        <div className="relative max-h-full">
          {url ? <img src={url} alt={file.name} className="max-h-[52vh] max-w-full object-contain" /> : null}
          <canvas
            ref={canvasRef}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
            className="absolute inset-0 size-full touch-none"
          />
        </div>
      </div>

      <div className="space-y-3 border-t border-border bg-card px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          {PEN_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Couleur ${c}`}
              onClick={() => setColor(c)}
              className={`size-7 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="range"
            min={2}
            max={24}
            value={width}
            aria-label="Épaisseur du trait"
            onChange={(e) => setWidth(Number(e.target.value))}
            className="ml-2 flex-1"
          />
          <Button variant="ghost" size="icon" onClick={undo} aria-label="Annuler le trait">
            <Undo2 className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={clear} aria-label="Effacer le dessin">
            <Eraser className="size-4" />
          </Button>
        </div>

        <div className="space-y-1">
          <Label htmlFor="annotation-text">Note</Label>
          <Input
            id="annotation-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Texte de l'annotation…"
          />
        </div>
      </div>
    </div>
  );
}
