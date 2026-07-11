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
import type { PluginContext } from "../plugin.types.js";
import type { PluginManifest } from "../manifest/plugin-manifest.js";
import { loadManifestFromFile } from "../manifest/manifest-loader.js";
import { permissionManager, type PermissionManager } from "../permissions/permission-manager.js";
import { ToolError, ToolErrorCode, normalizeToolError } from "../../tools/pipeline/tool-error.js";

export interface LoadedPlugin {
  readonly plugin: Plugin;
  readonly manifest: PluginManifest;
}

type PluginModuleExports = Record<string, unknown>;
type PluginConstructor = new () => Plugin;

export class PluginLoadPipeline {
  private readonly permissions: PermissionManager;

  constructor(permissions: PermissionManager = permissionManager) {
    this.permissions = permissions;
  }

  /** Loads a plugin given the path to its `manifest.json`. The entry path in the manifest is resolved relative to the manifest's directory. */
  public async loadFromManifestFile(manifestPath: string, context: PluginContext): Promise<LoadedPlugin> {
    const manifest = await loadManifestFromFile(manifestPath);
    return this.loadFromManifest(manifest, path.dirname(path.resolve(manifestPath)), context);
  }

  /** Loads a plugin from an already-parsed manifest, resolving its entry relative to `baseDir`. */
  public async loadFromManifest(manifest: PluginManifest, baseDir: string, context: PluginContext): Promise<LoadedPlugin> {
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
    } catch (rawError) {
      this.permissions.revoke(manifest.id);
      throw normalizeToolError(rawError, { pluginId: manifest.id });
    }

    return { plugin, manifest };
  }

  /** Unloads a plugin and revokes every permission it had been granted. */
  public async unload(pluginId: string, context: PluginContext): Promise<boolean> {
    const unloaded = await pluginLoader.unload(pluginId, context);
    if (unloaded) {
      this.permissions.revoke(pluginId);
    }
    return unloaded;
  }

  private async importPluginInstance(manifest: PluginManifest, baseDir: string): Promise<Plugin> {
    const entryPath = path.isAbsolute(manifest.entry) ? manifest.entry : path.resolve(baseDir, manifest.entry);
    const entryUrl = pathToFileURL(entryPath).href;

    let moduleExports: PluginModuleExports;
    try {
      moduleExports = (await import(entryUrl)) as PluginModuleExports;
    } catch (error) {
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

  private resolvePluginInstance(moduleExports: PluginModuleExports, manifest: PluginManifest): Plugin {
    const exported = moduleExports.default ?? moduleExports.plugin ?? moduleExports[manifest.id];

    const instance: unknown = typeof exported === "function" ? new (exported as PluginConstructor)() : exported;

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

