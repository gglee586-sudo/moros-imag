import type { MediaFile } from "./moro-db";

function toFile(item: MediaFile): File {
  return new File([item.blob], item.name, { type: item.mime || "application/octet-stream" });
}

function downloadOne(item: MediaFile) {
  const url = URL.createObjectURL(item.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = item.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Partage les fichiers via le menu natif du téléphone (AirDrop, Nearby, e-mail…)
 * et bascule sur un téléchargement quand le partage n'est pas disponible (PC).
 */
export async function shareFiles(items: MediaFile[]): Promise<"shared" | "downloaded" | "cancelled"> {
  if (items.length === 0) return "cancelled";
  const files = items.map(toFile);
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (typeof nav.share === "function" && nav.canShare?.({ files })) {
    try {
      const firstItem = items[0];
      await nav.share({ files, title: items.length === 1 && firstItem ? firstItem.name : "Fichiers Moro.iMac" });
      return "shared";
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return "cancelled";
    }
  }
  for (const item of items) downloadOne(item);
  return "downloaded";
}
