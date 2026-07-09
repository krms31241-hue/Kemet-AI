export class PluginManager {
    plugins = new Map();
    register(plugin) {
        this.plugins.set(plugin.metadata.id, plugin);
        return plugin;
    }
    get(id) {
        return (this.plugins.get(id) ?? null);
    }
    has(id) {
        return this.plugins.has(id);
    }
    remove(id) {
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
export const pluginManager = new PluginManager();
