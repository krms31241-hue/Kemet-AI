import type {
  PluginCapability,
  PluginContext,
  PluginMetadata,
} from "./plugin.types.js";

export abstract class Plugin {
  abstract readonly metadata: PluginMetadata;

  readonly capabilities: PluginCapability[] = [];

  async onLoad(
    _context: PluginContext,
  ): Promise<void> {}

  async onUnload(
    _context: PluginContext,
  ): Promise<void> {}
}
