import { pluginManager } from "./plugin-manager.js";
import { Plugin } from "./plugin.js";
import type {
  PluginContext,
} from "./plugin.types.js";

export class PluginLoader {
  async load(
    plugin: Plugin,
    context: PluginContext,
  ) {
    await plugin.onLoad(context);

    pluginManager.register(plugin);

    return plugin;
  }

  async unload(
    id: string,
    context: PluginContext,
  ) {
    const plugin =
      pluginManager.get(id);

    if (!plugin) {
      return false;
    }

    await plugin.onUnload(context);

    pluginManager.remove(id);

    return true;
  }
}

export const pluginLoader =
  new PluginLoader();
