import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/moro/BottomNav";
import { PageHeader } from "@/components/moro/PageHeader";
import { ImportButton } from "@/components/moro/ImportButton";
import { MediaGrid } from "@/components/moro/MediaGrid";
import { useFiles, useFolders } from "@/lib/moro-hooks";

export const Route = createFileRoute("/all")({
  head: () => ({
    meta: [
      { title: "Tous les fichiers — Moro.iMac" },
      { name: "description", content: "Toute votre bibliothèque Moro.iMac : photos, vidéos et PDF, classés ou non." },
      { property: "og:title", content: "Tous les fichiers — Moro.iMac" },
      { property: "og:description", content: "Retrouvez chaque fichier importé dans Moro.iMac en une grille." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AllFilesPage,
});

function AllFilesPage() {
  const { data: files } = useFiles();
  const { data: folders } = useFolders();
  return (
    <div className="app-shell">
      <PageHeader title="Tous les fichiers" subtitle={`${files.length} éléments`} action={<ImportButton variant="secondary" />} />
      {files.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">Aucun fichier importé pour le moment.</p>
      ) : (
        <MediaGrid files={files} folders={folders} />
      )}
      <BottomNav />
    </div>
  );
}
