/**
 * permission-manager.ts
 *
 * Tracks which `PluginPermission`s each loaded plugin has been granted
 * (normally derived from its `PluginManifest.permissions`), and answers
 * permission checks for the tool execution pipeline. Deliberately
 * separate from `PluginManager` (which tracks plugin *instances*, not
 * their grants) so permission state survives independently and can be
 * revoked without touching the plugin registry.
 */

import type { PluginManifest } from "../manifest/plugin-manifest.js";
import type { PluginPermission } from "../manifest/plugin-permissions.js";
import { ToolError, ToolErrorCode } from "../../tools/pipeline/tool-error.js";

export class PermissionManager {
  private readonly grants = new Map<string, Set<PluginPermission>>();

  /** Grants the given permissions to a plugin id, additive to any existing grants. */
  public grant(pluginId: string, permissions: readonly PluginPermission[]): void {
    const existing = this.grants.get(pluginId) ?? new Set<PluginPermission>();
    for (const permission of permissions) {
      existing.add(permission);
    }
    this.grants.set(pluginId, existing);
  }

  /** Convenience: grants exactly the permissions declared in a plugin's manifest. */
  public grantFromManifest(manifest: PluginManifest): void {
    this.grant(manifest.id, manifest.permissions);
  }

  /** Revokes a single permission from a plugin, leaving its other grants intact. */
  public revokePermission(pluginId: string, permission: PluginPermission): void {
    this.grants.get(pluginId)?.delete(permission);
  }

  /** Revokes every permission granted to a plugin (e.g. on unload). */
  public revoke(pluginId: string): void {
    this.grants.delete(pluginId);
  }

  public hasPermission(pluginId: string, permission: PluginPermission): boolean {
    return this.grants.get(pluginId)?.has(permission) ?? false;
  }

  public hasAllPermissions(pluginId: string, permissions: readonly PluginPermission[]): boolean {
    return permissions.every((permission) => this.hasPermission(pluginId, permission));
  }

  public getGranted(pluginId: string): PluginPermission[] {
    return [...(this.grants.get(pluginId) ?? [])];
  }

  /** Throws a `ToolError` with code `PERMISSION_DENIED` if the plugin lacks the permission. */
  public assertPermission(pluginId: string, permission: PluginPermission): void {
    if (!this.hasPermission(pluginId, permission)) {
      throw new ToolError({
        code: ToolErrorCode.PERMISSION_DENIED,
        message: `Plugin "${pluginId}" does not have permission "${permission}"`,
        retryable: false,
        context: { pluginId, permission },
      });
    }
  }

  public clear(): void {
    this.grants.clear();
  }
}

export const permissionManager = new PermissionManager();

