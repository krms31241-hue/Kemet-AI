export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
}

export interface PluginCapability {
  name: string;
}

export interface PluginContext {
  workspace: string;
  data: Record<string, unknown>;
}
