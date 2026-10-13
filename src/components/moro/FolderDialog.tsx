import { useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { saveFolder, uid, type Folder } from "@/lib/moro-db";
import { FOLDER_ICONS, FOLDER_ICON_KEYS } from "@/lib/moro-icons";
import { useRefreshMoro } from "@/lib/moro-hooks";
import { toast } from "sonner";

const COLORS: string[] = ["#4C8DFF", "#38BDF8", "#22D3A7", "#A78BFA", "#F59E0B", "#F472B6"];
const FIRST = COLORS[0] as string;

async function coverFromFile(file: File): Promise<string | undefined> {
  try {
    const bmp = await createImageBitmap(file);
    const max = 480;
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    return canvas.toDataURL("image/webp", 0.75);
  } catch {
    return undefined;
  }
}

export function FolderDialog({
  open,
  onOpenChange,
  folder,
  position,
  kind = "photos",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder?: Folder | undefined;
  position: number;
  /** Type de dossier créé (les dossiers « documents » restent dans le mode document). */
  kind?: "photos" | "documents";
}) {
  const refresh = useRefreshMoro();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(FIRST);
  const [cover, setCover] = useState<string | undefined>();
  const [icon, setIcon] = useState<string>("folder");

  useEffect(() => {
    if (!open) return;
    setName(folder?.name ?? "");
    setColor(folder?.color ?? FIRST);
    setCover(folder?.cover);
    setIcon(folder?.icon ?? "folder");
  }, [open, folder]);

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Donne un nom au dossier.");
      return;
    }
    await saveFolder({
      id: folder?.id ?? uid(),
      name: name.trim(),
      color,
      cover,
      icon,
      kind: folder?.kind ?? kind,
      position: folder?.position ?? position,
      createdAt: folder?.createdAt ?? Date.now(),
    });
    refresh();
    onOpenChange(false);
    toast.success(folder ? "Dossier mis à jour" : "Dossier créé");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[92vw] rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{folder ? "Modifier le dossier" : "Nouveau dossier"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Nom</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pokémon, Cours, Vacances…"
            />
          </div>

          <div className="space-y-2">
            <Label>Couleur</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Couleur ${c}`}
                  className={`size-8 rounded-full border-2 transition ${color === c ? "border-foreground" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Icône</Label>
            <div className="flex flex-wrap gap-2">
              {FOLDER_ICON_KEYS.map((key) => {
                const Icon = FOLDER_ICONS[key]!;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={`Icône ${key}`}
                    onClick={() => setIcon(key)}
                    className={`flex size-9 items-center justify-center rounded-xl border transition ${
                      icon === key ? "border-primary bg-primary/15" : "border-border bg-surface"
                    }`}
                  >
                    <Icon className="size-4" style={{ color }} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Image de couverture (optionnelle)</Label>
            <div className="flex items-center gap-3">
              <div
                className="size-16 overflow-hidden rounded-xl bg-surface"
                style={cover ? undefined : { backgroundColor: `${color}33` }}
              >
                {cover ? <img src={cover} alt="" className="size-full object-cover" /> : null}
              </div>
              <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
                <ImagePlus className="size-4" /> Choisir
              </Button>
              {cover ? (
                <Button type="button" variant="ghost" onClick={() => setCover(undefined)}>
                  Retirer
                </Button>
              ) : null}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) setCover(await coverFromFile(f));
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={submit} className="w-full">
            {folder ? "Enregistrer" : "Créer le dossier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
