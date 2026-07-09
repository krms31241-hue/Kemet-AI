import { pluginManager } from "./plugin-manager.js";
export class PluginLoader {
    async load(plugin, context) {
        await plugin.onLoad(context);
        pluginManager.register(plugin);
        return plugin;
    }
    async unload(id, context) {
        const plugin = pluginManager.get(id);
        if (!plugin) {
            return false;
        }
        await plugin.onUnload(context);
        pluginManager.remove(id);
        return true;
    }
}
export const pluginLoader = new PluginLoader();
