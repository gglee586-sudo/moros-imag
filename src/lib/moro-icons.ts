import {
  Folder,
  Image,
  Video,
  FileText,
  Heart,
  Star,
  Briefcase,
  GraduationCap,
  Plane,
  Music,
  Camera,
  Gamepad2,
  Home,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

export const FOLDER_ICONS: Record<string, LucideIcon> = {
  folder: Folder,
  image: Image,
  video: Video,
  file: FileText,
  heart: Heart,
  star: Star,
  work: Briefcase,
  school: GraduationCap,
  travel: Plane,
  music: Music,
  camera: Camera,
  game: Gamepad2,
  home: Home,
  shop: ShoppingBag,
};

export const FOLDER_ICON_KEYS = Object.keys(FOLDER_ICONS);

export function folderIcon(name?: string): LucideIcon {
  return FOLDER_ICONS[name ?? "folder"] ?? Folder;
}
