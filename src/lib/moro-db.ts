// Base de données locale de Moro.iMac (IndexedDB). 100 % sur l'appareil.

export type MediaKind = "image" | "video" | "pdf" | "other";

export type FolderKind = "photos" | "documents";

export type Folder = {
  id: string;
  name: string;
  color: string;
  /** Dossiers « documents » : proposés uniquement dans le trieur de documents. */
  kind?: FolderKind | undefined;
  cover?: string | undefined; // dataURL miniature de couverture (cache indépendant du fichier)
  icon?: string | undefined;
  position: number;
  hidden?: boolean | undefined;
  createdAt: number;
};

export type MediaFile = {
  id: string;
  name: string;
  mime: string;
  kind: MediaKind;
  size: number;
  date: number;
  width?: number | undefined;
  height?: number | undefined;
  duration?: number | undefined;
  folderId: string | null;
  favorite: boolean;
  review: boolean;
  note?: string | undefined;
  /** Annotation texte, stockée à part de la photo d'origine. */
  annotationText?: string | undefined;
  /** Calque de dessin (PNG transparent en dataURL), stocké à part de la photo d'origine. */
  annotationDraw?: string | undefined;
  /** Date de mise à la corbeille. Absente quand le fichier est actif. */
  trashedAt?: number | undefined;
  /** Dossier à retrouver lors d'une restauration. */
  trashedFromFolderId?: string | null | undefined;
  tags: string[];
  thumb?: string | undefined;
  blob: Blob;
};

export type HistoryAction = {
  id: string;
  fileId: string;
  type: "move" | "copy" | "review" | "favorite" | "skip";
  prevFolderId: string | null;
  newFolderId: string | null;
  copyId?: string | undefined;
  createdAt: number;
};

export type Settings = {
  mode: "move" | "copy";
  gestures: boolean;
  grid: "grid" | "list";
  shortcuts: boolean;
  documentMode: "move" | "copy";
  documentGestures: boolean;
  documentShortcuts: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  mode: "move",
  gestures: true,
  grid: "grid",
  shortcuts: true,
  documentMode: "move",
  documentGestures: true,
  documentShortcuts: true,
};

const DB_NAME = "moro-imac";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("folders")) db.createObjectStore("folders", { keyPath: "id" });
      if (!db.objectStoreNames.contains("files")) {
        const s = db.createObjectStore("files", { keyPath: "id" });
        s.createIndex("folderId", "folderId");
      }
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(store: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = run(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/* ---------- Dossiers ---------- */

export async function listFolders(): Promise<Folder[]> {
  const all = (await tx<Folder[]>("folders", "readonly", (s) => s.getAll() as IDBRequest<Folder[]>)) ?? [];
  return all.sort((a, b) => a.position - b.position);
}

export async function saveFolder(folder: Folder): Promise<void> {
  await tx("folders", "readwrite", (s) => s.put(folder) as IDBRequest<IDBValidKey>);
}

export async function deleteFolder(id: string, alsoFiles: boolean): Promise<void> {
  const files = await listFiles();
  for (const f of files.filter((x) => x.folderId === id)) {
    if (alsoFiles) await deleteFile(f.id);
    else await putFile({ ...f, folderId: null });
  }
  await tx("folders", "readwrite", (s) => s.delete(id) as unknown as IDBRequest<undefined>);
}

/* ---------- Fichiers ---------- */

export async function listFiles(): Promise<MediaFile[]> {
  const all = (await tx<MediaFile[]>("files", "readonly", (s) => s.getAll() as IDBRequest<MediaFile[]>)) ?? [];
  return all.filter((file) => !file.trashedAt).sort((a, b) => b.date - a.date);
}

export async function listTrash(): Promise<MediaFile[]> {
  const all = (await tx<MediaFile[]>("files", "readonly", (s) => s.getAll() as IDBRequest<MediaFile[]>)) ?? [];
  return all.filter((file) => Boolean(file.trashedAt)).sort((a, b) => (b.trashedAt ?? 0) - (a.trashedAt ?? 0));
}

export async function getFile(id: string): Promise<MediaFile | undefined> {
  return tx<MediaFile | undefined>("files", "readonly", (s) => s.get(id) as IDBRequest<MediaFile | undefined>);
}

export async function putFile(file: MediaFile): Promise<void> {
  await tx("files", "readwrite", (s) => s.put(file) as IDBRequest<IDBValidKey>);
}

export async function deleteFile(id: string): Promise<void> {
  const file = await getFile(id);
  if (!file) return;
  await putFile({
    ...file,
    trashedAt: Date.now(),
    trashedFromFolderId: file.folderId,
  });
}

export async function permanentlyDeleteFile(id: string): Promise<void> {
  await tx("files", "readwrite", (s) => s.delete(id) as unknown as IDBRequest<undefined>);
}

export async function restoreFile(id: string): Promise<void> {
  const file = await getFile(id);
  if (!file) return;
  const folders = await listFolders();
  const originalFolderExists = file.trashedFromFolderId
    ? folders.some((folder) => folder.id === file.trashedFromFolderId)
    : false;
  await putFile({
    ...file,
    folderId: originalFolderExists ? (file.trashedFromFolderId ?? null) : null,
    trashedAt: undefined,
    trashedFromFolderId: undefined,
  });
}

export async function emptyTrash(): Promise<void> {
  const trash = await listTrash();
  for (const file of trash) await permanentlyDeleteFile(file.id);
}

/* ---------- Réglages / historique ---------- */

async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const v = await tx<T | undefined>("meta", "readonly", (s) => s.get(key) as IDBRequest<T | undefined>);
  return v ?? fallback;
}

async function setMeta<T>(key: string, value: T): Promise<void> {
  await tx("meta", "readwrite", (s) => s.put(value, key) as IDBRequest<IDBValidKey>);
}

export const getSettings = async () => ({
  ...DEFAULT_SETTINGS,
  ...(await getMeta<Partial<Settings>>("settings", DEFAULT_SETTINGS)),
});
export const saveSettings = (s: Settings) => setMeta("settings", s);
export const getHistory = () => getMeta<HistoryAction[]>("history", []);

async function pushHistory(a: HistoryAction) {
  const h = await getHistory();
  await setMeta("history", [a, ...h].slice(0, 50));
}

/* ---------- Actions de tri ---------- */

export async function classify(fileId: string, folderId: string, mode: "move" | "copy"): Promise<void> {
  const file = await getFile(fileId);
  if (!file) throw new Error("Fichier introuvable");
  if (mode === "copy") {
    const copyId = uid();
    await putFile({ ...file, id: copyId, folderId });
    await pushHistory({
      id: uid(), fileId, type: "copy", prevFolderId: file.folderId, newFolderId: folderId, copyId,
      createdAt: Date.now(),
    });
  } else {
    await putFile({ ...file, folderId });
    await pushHistory({
      id: uid(), fileId, type: "move", prevFolderId: file.folderId, newFolderId: folderId,
      createdAt: Date.now(),
    });
  }
}

export async function markReview(fileId: string): Promise<void> {
  const file = await getFile(fileId);
  if (!file) return;
  await putFile({ ...file, review: true });
  await pushHistory({
    id: uid(), fileId, type: "review", prevFolderId: file.folderId, newFolderId: file.folderId,
    createdAt: Date.now(),
  });
}

export async function saveAnnotation(
  fileId: string,
  data: { text?: string | undefined; draw?: string | undefined },
): Promise<void> {
  const file = await getFile(fileId);
  if (!file) return;
  await putFile({ ...file, annotationText: data.text, annotationDraw: data.draw });
}

export async function clearAnnotation(fileId: string): Promise<void> {
  const file = await getFile(fileId);
  if (!file) return;
  await putFile({ ...file, annotationText: undefined, annotationDraw: undefined });
}

export async function toggleFavorite(fileId: string): Promise<void> {
  const file = await getFile(fileId);
  if (!file) return;
  await putFile({ ...file, favorite: !file.favorite });
}

export async function undoLast(): Promise<string | null> {
  const history = await getHistory();
  const last = history[0];
  if (!last) return null;
  if (last.type === "copy" && last.copyId) {
    await permanentlyDeleteFile(last.copyId);
  } else {
    const file = await getFile(last.fileId);
    if (file) {
      if (last.type === "review") await putFile({ ...file, review: false });
      else await putFile({ ...file, folderId: last.prevFolderId });
    }
  }
  await setMeta("history", history.slice(1));
  return last.fileId;
}

/* ---------- Export / import de la configuration ---------- */

export async function exportBackup(): Promise<Blob> {
  const [folders, files, settings, history] = await Promise.all([
    listFolders(), listFiles(), getSettings(), getHistory(),
  ]);
  const payload = {
    version: 1,
    folders,
    settings,
    history,
    files: files.map(({ blob: _blob, ...rest }) => rest),
  };
  return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
}

export async function importBackup(json: string): Promise<void> {
  const data = JSON.parse(json) as {
    folders?: Folder[];
    settings?: Settings;
    files?: Array<Omit<MediaFile, "blob">>;
  };
  for (const f of data.folders ?? []) await saveFolder(f);
  if (data.settings) await saveSettings(data.settings);
  for (const meta of data.files ?? []) {
    const existing = await getFile(meta.id);
    if (existing) await putFile({ ...existing, ...meta, blob: existing.blob });
  }
}

export async function resetAll(): Promise<void> {
  const db = await openDb();
  db.close();
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}
