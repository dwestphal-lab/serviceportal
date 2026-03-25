import type { ComponentType } from "react";
import { manifest as tanssDashboard } from "@/modules/tanss-dashboard/manifest";
import { manifest as auswertungen } from "@/modules/auswertungen/manifest";

export interface ModuleManifest {
  id: string;
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  children?: Array<{ name: string; href: string }>;
}

export const MODULE_NAVIGATION: ModuleManifest[] = [
  tanssDashboard,
  auswertungen,
];
