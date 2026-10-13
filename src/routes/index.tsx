import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { folderIcon } from "@/lib/moro-icons";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/moro/BottomNav";
import { PageHeader } from "@/components/moro/PageHeader";
import { FolderDialog } from "@/components/moro/FolderDialog";
import { ImportButton } from "@/components/moro/ImportButton";
import { deleteFolder, type Folder } from "@/lib/moro-db";
import { useFiles, useFolders, useRefreshMoro } from "@/lib/moro-hooks";
import { docTypeOf } from "@/lib/moro-media";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Moro.iMac — Organisez photos, vidéos et PDF" },
      {
        name: "description",
        content:
          "Moro.iMac range vos photos, vidéos et PDF en dossiers visuels : import, tri rapide un fichier à la fois, favoris et tout reste sur votre téléphone.",
      },
      { property: "og:title", content: "Moro.iMac — Organisez photos, vidéos et PDF" },
      {
        property: "og:description",
        content: "Import, tri rapide, dossiers visuels. Local, sans compte et sans abonnement.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: folders } = useFolders();
  const { data: files } = useFiles();
  const refresh = useRefreshMoro();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Folder | undefined>();

  const photoFolders = folders.filter((folder) => (folder.kind ?? "photos") === "photos");
  const unsortedPhotos = files.filter((file) => file.folderId === null && docTypeOf(file.mime, file.name) === null).length;
  const unsortedDocuments = files.filter((file) => file.folderId === null && docTypeOf(file.mime, file.name) !== null).length;
  const countFor = (id: string) => files.filter((f) => f.folderId === id).length;

  return (
    <div className="app-shell">
      <PageHeader
        title="Moro.iMac"
        subtitle="Mes dossiers"
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" asChild>
              <Link to="/sort-docs">
                <FileText className="size-4" /> Trier docs
              </Link>
            </Button>
            <ImportButton label="Importer" />
          </div>
        }
      />

      {unsortedPhotos > 0 ? (
          <Link to="/sort" className="mb-3 flex items-center justify-between rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3">
          <span>
            <span className="block text-sm font-medium">Photos à trier</span>
            <span className="block text-xs text-muted-foreground">
              {unsortedPhotos} photo{unsortedPhotos > 1 ? "s" : ""} ou vidéo{unsortedPhotos > 1 ? "s" : ""} à classer
            </span>
          </span>
          <span className="text-sm font-medium text-primary">Reprendre</span>
        </Link>
      ) : null}

      {unsortedDocuments > 0 ? (
        <Link to="/sort-docs" className="doc-theme mb-5 flex items-center justify-between rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3">
          <span>
            <span className="block text-sm font-medium">Documents à trier</span>
            <span className="block text-xs text-muted-foreground">
              {unsortedDocuments} document{unsortedDocuments > 1 ? "s" : ""} à classer
            </span>
          </span>
          <span className="text-sm font-medium text-primary">Ouvrir</span>
        </Link>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        {photoFolders.map((folder) => {
          const Icon = folderIcon(folder.icon);
          return (
          <div key={folder.id} className="group relative overflow-hidden rounded-2xl bg-card shadow-card">
            <Link to="/folder/$id" params={{ id: folder.id }} className="block">
              <div
                className="relative flex aspect-[4/3] items-center justify-center"
                style={{ backgroundColor: `${folder.color}26` }}
              >
                {folder.cover ? (
                  <>
                    <img src={folder.cover} alt="" className="size-full object-cover" />
                    <span className="absolute bottom-1.5 left-1.5 rounded-full bg-background/75 p-1.5 backdrop-blur">
                      <Icon className="size-3.5" style={{ color: folder.color }} />
                    </span>
                  </>
                ) : (
                  <Icon className="size-9" style={{ color: folder.color }} />
                )}
              </div>
              <div className="px-3 py-2">
                <p className="line-clamp-1 text-sm font-medium">{folder.name}</p>
                <p className="text-xs text-muted-foreground">{countFor(folder.id)} fichiers</p>
              </div>
            </Link>
            <div className="absolute top-1.5 right-1.5 flex gap-1">
              <button
                type="button"
                aria-label="Modifier"
                className="rounded-full bg-background/70 p-1.5 backdrop-blur"
                onClick={() => {
                  setEditing(folder);
                  setDialogOpen(true);
                }}
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label="Supprimer"
                className="rounded-full bg-background/70 p-1.5 backdrop-blur"
                onClick={async () => {
                  const n = countFor(folder.id);
                  if (!confirm(`Supprimer « ${folder.name} » ? Les ${n} fichiers seront remis à trier.`)) return;
                  await deleteFolder(folder.id, false);
                  refresh();
                  toast.success("Dossier supprimé, fichiers conservés");
                }}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
          );
        })}

        <button
          type="button"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
          className="flex aspect-[4/3.55] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface/40 text-muted-foreground transition active:scale-95"
        >
          <Plus className="size-7" />
          <span className="text-sm">Nouveau dossier</span>
        </button>
      </div>

      {photoFolders.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Crée un premier dossier, puis importe tes fichiers pour commencer le tri.
        </p>
      ) : null}

      <div className="mt-6 flex flex-col items-center gap-1">
        <Button variant="ghost" asChild>
          <Link to="/all">Voir tous les fichiers ({files.length})</Link>
        </Button>
        <Button variant="ghost" asChild className="doc-theme text-primary">
          <Link to="/docs">
            <FileText className="size-4" /> Bibliothèque documents
          </Link>
        </Button>
      </div>

      <FolderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        folder={editing}
        position={photoFolders.length}
        kind="photos"
      />
      <BottomNav />
    </div>
  );
}
