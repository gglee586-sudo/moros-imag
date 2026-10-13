import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/moro/BottomNav";
import { PageHeader } from "@/components/moro/PageHeader";
import { MediaTile } from "@/components/moro/MediaTile";
import { MediaViewer } from "@/components/moro/MediaViewer";
import { useFiles, useFolders } from "@/lib/moro-hooks";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Recherche — Moro.iMac" },
      { name: "description", content: "Recherchez un fichier par nom, extension, type ou dossier dans votre bibliothèque Moro.iMac." },
      { property: "og:title", content: "Recherche — Moro.iMac" },
      { property: "og:description", content: "Trouvez n'importe quel fichier en quelques lettres." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { data: files } = useFiles();
  const { data: folders } = useFolders();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const active = files.find((f) => f.id === openId);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return files.filter((f) => {
      const folderName = folders.find((x) => x.id === f.folderId)?.name.toLowerCase() ?? "";
      return (
        f.name.toLowerCase().includes(term) ||
        f.kind.includes(term) ||
        folderName.includes(term) ||
        f.tags.some((t) => t.toLowerCase().includes(term))
      );
    });
  }, [q, files, folders]);

  return (
    <div className="app-shell">
      <PageHeader title="Recherche" subtitle="Nom, type, dossier ou tag" />
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="vacances, IMG_1234, .pdf…" />

      <p className="mt-4 mb-2 text-sm text-muted-foreground">
        {q.trim() ? `${results.length} résultat${results.length > 1 ? "s" : ""}` : "Tape quelque chose pour chercher."}
      </p>

      <div className="grid grid-cols-3 gap-2">
        {results.map((file) => (
          <MediaTile key={file.id} file={file} onOpen={() => setOpenId(file.id)} />
        ))}
      </div>

      {active ? <MediaViewer file={active} folders={folders} onClose={() => setOpenId(null)} /> : null}
      <BottomNav />
    </div>
  );
}
