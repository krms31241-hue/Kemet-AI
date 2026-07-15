/**
 * plugin-load-pipeline.ts
 *
 * End-to-end plugin loading: read + validate a manifest, dynamically
 * import its entry module, resolve a `Plugin` instance from it, grant the
 * permissions it declares, then hand off to the existing (stable)
 * `pluginLoader` / `pluginManager` for the actual `onLoad` lifecycle and
 * registration. Composes stable pieces rather than reimplementing them.
 */
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Plugin } from "../plugin.js";
import { pluginLoader } from "../plugin-loader.js";
import { pluginManager } from "../plugin-manager.js";
import { loadManifestFromFile } from "../manifest/manifest-loader.js";
import { permissionManager } from "../permissions/permission-manager.js";
import { ToolError, ToolErrorCode, normalizeToolError } from "../../tools/pipeline/tool-error.js";
export class PluginLoadPipeline {
    permissions;
    constructor(permissions = permissionManager) {
        this.permissions = permissions;
    }
    /** Loads a plugin given the path to its `manifest.json`. The entry path in the manifest is resolved relative to the manifest's directory. */
    async loadFromManifestFile(manifestPath, context) {
        const manifest = await loadManifestFromFile(manifestPath);
        return this.loadFromManifest(manifest, path.dirname(path.resolve(manifestPath)), context);
    }
    /** Loads a plugin from an already-parsed manifest, resolving its entry relative to `baseDir`. */
    async loadFromManifest(manifest, baseDir, context) {
        if (pluginManager.has(manifest.id)) {
            throw new ToolError({
                code: ToolErrorCode.ALREADY_LOADED,
                message: `Plugin "${manifest.id}" is already loaded`,
                retryable: false,
                context: { pluginId: manifest.id },
            });
        }
        const plugin = await this.importPluginInstance(manifest, baseDir);
        this.permissions.grantFromManifest(manifest);
        try {
            await pluginLoader.load(plugin, context);
        }
        catch (rawError) {
            this.permissions.revoke(manifest.id);
            throw normalizeToolError(rawError, { pluginId: manifest.id });
        }
        return { plugin, manifest };
    }
    /** Unloads a plugin and revokes every permission it had been granted. */
    async unload(pluginId, context) {
        const unloaded = await pluginLoader.unload(pluginId, context);
        if (unloaded) {
            this.permissions.revoke(pluginId);
        }
        return unloaded;
    }
    async importPluginInstance(manifest, baseDir) {
        const entryPath = path.isAbsolute(manifest.entry) ? manifest.entry : path.resolve(baseDir, manifest.entry);
        const entryUrl = pathToFileURL(entryPath).href;
        let moduleExports;
        try {
            moduleExports = (await import(entryUrl));
        }
        catch (error) {
            throw new ToolError({
                code: ToolErrorCode.EXECUTION_FAILED,
                message: `Failed to import plugin entry "${entryPath}" for "${manifest.id}": ${error instanceof Error ? error.message : String(error)}`,
                retryable: false,
                context: { pluginId: manifest.id },
                cause: error,
            });
        }
        return this.resolvePluginInstance(moduleExports, manifest);
    }
    resolvePluginInstance(moduleExports, manifest) {
        const exported = moduleExports.default ?? moduleExports.plugin ?? moduleExports[manifest.id];
        const instance = typeof exported === "function" ? new exported() : exported;
        if (!(instance instanceof Plugin)) {
            throw new ToolError({
                code: ToolErrorCode.VALIDATION,
                message: `Plugin entry for "${manifest.id}" does not export a valid Plugin instance, or a class extending Plugin, as its default export`,
                retryable: false,
                context: { pluginId: manifest.id },
            });
        }
        return instance;
    }
}
export const pluginLoadPipeline = new PluginLoadPipeline();
