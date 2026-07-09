import type { PluginCapability } from "./plugin-capabilities.js";
import type { PluginPermission } from "./plugin-permissions.js";

export interface PluginManifest {
  id: string;
  name: string;
  displayName: string;
  version: string;

  description?: string;

  author?: string;

  license?: string;

  homepage?: string;

  repository?: string;

  icon?: string;

  category?: string;

  entry: string;

  capabilities: PluginCapability[];

  permissions: PluginPermission[];

  dependencies: Record<string, string>;

  optionalDependencies: Record<string, string>;

  keywords: string[];

  activationEvents: string[];

  configuration: Record<string, unknown>;

  contributes: Record<string, unknown>;
}
