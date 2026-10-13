import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, FileText, Pencil, Plus, Trash2 } from "lucide-react";
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

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Bibliothèque documents — Moro.iMac" },
      {
        name: "description",
        content:
          "Le mode document de Moro.iMac : une bibliothèque réservée aux PDF, Word, Excel, PowerPoint et EPUB, avec ses propres dossiers.",
      },
      { property: "og:title", content: "Bibliothèque documents — Moro.iMac" },
      {
        property: "og:description",
        content: "Vos documents dans leurs propres dossiers, séparés des photos et vidéos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DocumentsLibraryPage,
});

function DocumentsLibraryPage() {
  const { data: folders } = useFolders();
  const { data: files } = useFiles();
  const refresh = useRefreshMoro();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Folder | undefined>();

  const docFolders = folders.filter((folder) => folder.kind === "documents");
  const documents = files.filter((file) => docTypeOf(file.mime, file.name) !== null);
  const unsorted = documents.filter((file) => file.folderId === null).length;
  const countFor = (id: string) => files.filter((f) => f.folderId === id).length;

  return (
    <div className="doc-theme min-h-dvh">
      <div className="app-shell">
        <PageHeader
          title="Bibliothèque documents"
          subtitle={`${documents.length} document${documents.length > 1 ? "s" : ""}`}
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

        <Button variant="ghost" size="sm" asChild className="mb-3">
          <Link to="/">
            <ArrowLeft className="size-4" /> Retour au mode photos
          </Link>
        </Button>

        {unsorted > 0 ? (
          <Link
            to="/sort-docs"
            className="mb-5 flex items-center justify-between rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3"
          >
            <span>
              <span className="block text-sm font-medium">Documents à trier</span>
              <span className="block text-xs text-muted-foreground">
                {unsorted} document{unsorted > 1 ? "s" : ""} à classer
              </span>
            </span>
            <span className="text-sm font-medium text-primary">Ouvrir</span>
          </Link>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          {docFolders.map((folder) => {
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
            <span className="text-sm">Nouveau dossier documents</span>
          </button>
        </div>

        {docFolders.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Crée un premier dossier documents, puis importe tes PDF, Word, Excel, PowerPoint ou EPUB.
          </p>
        ) : null}

        <FolderDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          folder={editing}
          position={docFolders.length}
          kind="documents"
        />
        <BottomNav />
      </div>
    </div>
  );
}
