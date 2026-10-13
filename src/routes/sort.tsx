import { createFileRoute } from "@tanstack/react-router";
import { SortWorkspace } from "@/components/moro/SortWorkspace";

export const Route = createFileRoute("/sort")({
  head: () => ({
    meta: [
      { title: "Tri rapide — Moro.iMac" },
      {
        name: "description",
        content:
          "Voyez une photo ou vidéo, choisissez son dossier, puis passez à la suivante avec le tri rapide de Moro.iMac.",
      },
      { property: "og:title", content: "Tri rapide — Moro.iMac" },
      { property: "og:description", content: "Classez vos photos et vidéos une par une, avec annulation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SortPage,
});

function SortPage() {
  return <SortWorkspace kind="photos" />;
}
