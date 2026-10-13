import { createFileRoute } from "@tanstack/react-router";
import { SortWorkspace } from "@/components/moro/SortWorkspace";

export const Route = createFileRoute("/sort-docs")({
  head: () => ({
    meta: [
      { title: "Tri des documents — Moro.iMac" },
      { name: "description", content: "Classez séparément vos PDF, documents Word, feuilles Excel, présentations PowerPoint et livres EPUB." },
      { property: "og:title", content: "Tri des documents — Moro.iMac" },
      { property: "og:description", content: "Un trieur dédié aux documents avec aperçu rapide et réglages indépendants." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SortDocumentsPage,
});

function SortDocumentsPage() {
  return <SortWorkspace kind="documents" />;
}