import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, getSettings, listFiles, listFolders, listTrash, getHistory } from "./moro-db";

export function useFolders() {
  return useQuery({ queryKey: ["folders"], queryFn: listFolders, initialData: [] });
}

export function useFiles() {
  return useQuery({ queryKey: ["files"], queryFn: listFiles, initialData: [] });
}

export function useTrash() {
  return useQuery({ queryKey: ["trash"], queryFn: listTrash, initialData: [] });
}

export function useSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: getSettings, initialData: DEFAULT_SETTINGS });
}

export function useHistory() {
  return useQuery({ queryKey: ["history"], queryFn: getHistory, initialData: [] });
}

export function useRefreshMoro() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["folders"] });
    void qc.invalidateQueries({ queryKey: ["files"] });
    void qc.invalidateQueries({ queryKey: ["trash"] });
    void qc.invalidateQueries({ queryKey: ["settings"] });
    void qc.invalidateQueries({ queryKey: ["history"] });
  };
}

export function useObjectUrl(blob?: Blob) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) {
      setUrl(undefined);
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}
