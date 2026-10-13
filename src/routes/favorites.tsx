import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BottomNav } from "@/components/moro/BottomNav";
import { PageHeader } from "@/components/moro/PageHeader";
import { MediaTile } from "@/components/moro/MediaTile";
import { MediaViewer } from "@/components/moro/MediaViewer";
import { useFiles, useFolders } from "@/lib/moro-hooks";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Favoris et à revoir — Moro.iMac" },
      { name: "description", content: "Vos fichiers marqués en favori et ceux mis de côté pour plus tard dans Moro.iMac." },
      { property: "og:title", content: "Favoris et à revoir — Moro.iMac" },
      { property: "og:description", content: "Retrouvez d'un geste vos fichiers préférés et ceux à revoir." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { data: files } = useFiles();
  const { data: folders } = useFolders();
  const [openId, setOpenId] = useState<string | null>(null);
  const active = files.find((f) => f.id === openId);

  const favorites = files.filter((f) => f.favorite);
  const review = files.filter((f) => f.review);

  return (
    <div className="app-shell">
      <PageHeader title="Favoris" subtitle="Et les fichiers à revoir" />

      <h2 className="mb-2 text-sm font-medium text-muted-foreground">★ Favoris ({favorites.length})</h2>
      {favorites.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun favori. Ouvre un fichier et touche l'étoile.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {favorites.map((file) => (
            <MediaTile key={file.id} file={file} onOpen={() => setOpenId(file.id)} />
          ))}
        </div>
      )}

      <h2 className="mt-8 mb-2 text-sm font-medium text-muted-foreground">À revoir ({review.length})</h2>
      {review.length === 0 ? (
        <p className="text-sm text-muted-foreground">Rien en attente.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {review.map((file) => (
            <MediaTile key={file.id} file={file} onOpen={() => setOpenId(file.id)} />
          ))}
        </div>
      )}

      {active ? <MediaViewer file={active} folders={folders} onClose={() => setOpenId(null)} /> : null}
      <BottomNav />
    </div>
  );
}
