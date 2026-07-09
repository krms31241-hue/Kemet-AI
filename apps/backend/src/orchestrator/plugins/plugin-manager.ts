import { Plugin } from "./plugin.js";

export class PluginManager {
  private readonly plugins =
    new Map<string, Plugin>();

  register(plugin: Plugin) {
    this.plugins.set(
      plugin.metadata.id,
      plugin,
    );

    return plugin;
  }

  get(id: string) {
    return (
      this.plugins.get(id) ?? null
    );
  }

  has(id: string) {
    return this.plugins.has(id);
  }

  remove(id: string) {
    return this.plugins.delete(id);
  }

  clear() {
    this.plugins.clear();
  }

  list() {
    return [
      ...this.plugins.values(),
    ];
  }

  count() {
    return this.plugins.size;
  }
}

export const pluginManager =
  new PluginManager();
