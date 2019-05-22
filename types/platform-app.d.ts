export interface IPlatformApp {
  name?: string | null;
  platform?: "GCM" | null;
  credential?: string | null;
}

export interface IPlatformAppsMap {
  [key: string]: IPlatformApp;
}
