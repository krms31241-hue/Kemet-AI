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
import { ToolError, ToolErrorCode } from "../../tools/pipeline/tool-error.js";
export class PermissionManager {
    grants = new Map();
    /** Grants the given permissions to a plugin id, additive to any existing grants. */
    grant(pluginId, permissions) {
        const existing = this.grants.get(pluginId) ?? new Set();
        for (const permission of permissions) {
            existing.add(permission);
        }
        this.grants.set(pluginId, existing);
    }
    /** Convenience: grants exactly the permissions declared in a plugin's manifest. */
    grantFromManifest(manifest) {
        this.grant(manifest.id, manifest.permissions);
    }
    /** Revokes a single permission from a plugin, leaving its other grants intact. */
    revokePermission(pluginId, permission) {
        this.grants.get(pluginId)?.delete(permission);
    }
    /** Revokes every permission granted to a plugin (e.g. on unload). */
    revoke(pluginId) {
        this.grants.delete(pluginId);
    }
    hasPermission(pluginId, permission) {
        return this.grants.get(pluginId)?.has(permission) ?? false;
    }
    hasAllPermissions(pluginId, permissions) {
        return permissions.every((permission) => this.hasPermission(pluginId, permission));
    }
    getGranted(pluginId) {
        return [...(this.grants.get(pluginId) ?? [])];
    }
    /** Throws a `ToolError` with code `PERMISSION_DENIED` if the plugin lacks the permission. */
    assertPermission(pluginId, permission) {
        if (!this.hasPermission(pluginId, permission)) {
            throw new ToolError({
                code: ToolErrorCode.PERMISSION_DENIED,
                message: `Plugin "${pluginId}" does not have permission "${permission}"`,
                retryable: false,
                context: { pluginId, permission },
            });
        }
    }
    clear() {
        this.grants.clear();
    }
}
export const permissionManager = new PermissionManager();
