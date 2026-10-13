import { uid, type MediaFile, type MediaKind } from "./moro-db";

export function kindOf(mime: string, name: string): MediaKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].includes(ext)) return "image";
  if (mime.startsWith("video/") || ["mp4", "mov", "mkv", "webm"].includes(ext)) return "video";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  return "other";
}

export const ACCEPTED =
  "image/*,video/*,application/pdf,.heic,.heif,.mkv,.doc,.docx,.odt,.rtf,.xls,.xlsx,.ods,.csv,.ppt,.pptx,.odp,.epub";

export type DocType = "pdf" | "word" | "excel" | "powerpoint" | "epub";

/** Types de documents gérés par le trieur dédié (aperçu réduit, pas d'affichage complet). */
export function docTypeOf(mime: string, name: string): DocType | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (["doc", "docx", "odt", "rtf"].includes(ext) || mime.includes("word")) return "word";
  if (["xls", "xlsx", "ods", "csv"].includes(ext) || mime.includes("sheet") || mime.includes("excel")) return "excel";
  if (["ppt", "pptx", "odp"].includes(ext) || mime.includes("presentation")) return "powerpoint";
  if (ext === "epub" || mime.includes("epub")) return "epub";
  return null;
}

function drawToDataUrl(source: CanvasImageSource, w: number, h: number): string | undefined {
  const max = 360;
  const scale = Math.min(1, max / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  try {
    return canvas.toDataURL("image/webp", 0.72);
  } catch {
    return undefined;
  }
}

async function imageThumb(file: File) {
  try {
    const bmp = await createImageBitmap(file);
    const thumb = drawToDataUrl(bmp, bmp.width, bmp.height);
    const size = { width: bmp.width, height: bmp.height };
    bmp.close();
    return { thumb, ...size };
  } catch {
    return {};
  }
}

async function videoThumb(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = url;
    await new Promise((resolve, reject) => {
      video.onloadeddata = resolve;
      video.onerror = reject;
      setTimeout(reject, 6000);
    });
    const duration = Number.isFinite(video.duration) ? video.duration : undefined;
    await new Promise((resolve) => {
      video.onseeked = resolve;
      video.currentTime = Math.min(1, (duration ?? 2) / 2);
      setTimeout(resolve, 3000);
    });
    return {
      thumb: drawToDataUrl(video, video.videoWidth || 320, video.videoHeight || 180),
      width: video.videoWidth,
      height: video.videoHeight,
      duration,
    };
  } catch {
    return {};
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function buildRecord(file: File, folderId: string | null): Promise<MediaFile> {
  const kind = kindOf(file.type, file.name);
  const extra = kind === "image" ? await imageThumb(file) : kind === "video" ? await videoThumb(file) : {};
  return {
    id: uid(),
    name: file.name,
    mime: file.type || "application/octet-stream",
    kind,
    size: file.size,
    date: file.lastModified || Date.now(),
    folderId,
    favorite: false,
    review: false,
    tags: [],
    blob: file,
    ...extra,
  };
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} Go`;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("fr-CA", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDuration(sec?: number): string | undefined {
  if (!sec || !Number.isFinite(sec)) return undefined;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
