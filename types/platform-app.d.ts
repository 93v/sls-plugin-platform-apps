export interface IPlatformApp {
  credential?: string | null;
  name?: string | null;
  platform?: "GCM" | null;
}

export type IPlatformAppsMap = Record<string, IPlatformApp>;
