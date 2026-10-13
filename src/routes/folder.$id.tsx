import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/moro/BottomNav";
import { ImportButton } from "@/components/moro/ImportButton";
import { MediaGrid } from "@/components/moro/MediaGrid";
import { useFiles, useFolders } from "@/lib/moro-hooks";

export const Route = createFileRoute("/folder/$id")({
  head: () => ({
    meta: [
      { title: "Contenu du dossier — Moro.iMac" },
      { name: "description", content: "Parcourez les photos, vidéos et PDF rangés dans ce dossier Moro.iMac." },
      { property: "og:title", content: "Contenu du dossier — Moro.iMac" },
      { property: "og:description", content: "Grille de miniatures, visionneuse intégrée et import direct dans le dossier." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FolderPage,
});

function FolderPage() {
  const { id } = Route.useParams();
  const { data: folders } = useFolders();
  const { data: files } = useFiles();
  const folder = folders.find((f) => f.id === id);
  const items = files.filter((f) => f.folderId === id);


  return (
    <div className="app-shell">
      <header className="flex items-center gap-2 pt-5 pb-4">
        <Button variant="ghost" size="icon" asChild aria-label="Retour">
          <Link to="/">
            <ChevronLeft className="size-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{folder?.name ?? "Dossier"}</h1>
          <p className="text-xs text-muted-foreground">{items.length} fichiers</p>
        </div>
        <ImportButton folderId={id} label="Ajouter" variant="secondary" />
      </header>

      {items.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">Ce dossier est vide pour l'instant.</p>
      ) : (
        <MediaGrid files={items} folders={folders} />
      )}
      <BottomNav />
    </div>
  );
}
