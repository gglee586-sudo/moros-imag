import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { putFile } from "@/lib/moro-db";
import { ACCEPTED, buildRecord } from "@/lib/moro-media";
import { useRefreshMoro } from "@/lib/moro-hooks";
import { toast } from "sonner";

export function ImportButton({
  folderId = null,
  label = "Importer",
  variant = "default",
}: {
  folderId?: string | null;
  label?: string;
  variant?: "default" | "secondary" | "ghost";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const refresh = useRefreshMoro();
  const [busy, setBusy] = useState(false);

  return (
    <>
      <Button variant={variant} disabled={busy} onClick={() => inputRef.current?.click()}>
        <Upload className="size-4" /> {busy ? "Import…" : label}
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED}
        className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length === 0) return;
          setBusy(true);
          let ok = 0;
          for (const file of files) {
            try {
              await putFile(await buildRecord(file, folderId));
              ok += 1;
            } catch {
              toast.error(`Impossible d'importer ${file.name}`);
            }
          }
          setBusy(false);
          refresh();
          toast.success(`${ok} fichier${ok > 1 ? "s" : ""} importé${ok > 1 ? "s" : ""}`);
        }}
      />
    </>
  );
}
