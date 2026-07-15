/**
 * tool-execution-pipeline.ts
 *
 * Production execution seam for tools registered in the (stable)
 * `ToolRegistry`. Adds three things the raw registry deliberately does
 * not own: permission enforcement (via `PermissionManager`), timeout
 * enforcement, and normalized error handling — without modifying
 * `ToolRegistry`, `Tool`, or `ToolExecutionContext` themselves.
 */
import { toolRegistry } from "../../tool-registry/tool-registry.js";
import { permissionManager } from "../../plugins/permissions/permission-manager.js";
import { normalizeToolError, ToolError, ToolErrorCode } from "./tool-error.js";
const DEFAULT_TIMEOUT_MS = 30_000;
export class ToolExecutionPipeline {
    registry;
    permissions;
    defaultTimeoutMs;
    requiredPermissions = new Map();
    constructor(registry = toolRegistry, permissions = permissionManager, defaultTimeoutMs = DEFAULT_TIMEOUT_MS) {
        this.registry = registry;
        this.permissions = permissions;
        this.defaultTimeoutMs = defaultTimeoutMs;
    }
    /** Declares that invoking `toolId` requires the caller to hold every permission listed. */
    requirePermissions(toolId, permissions) {
        this.requiredPermissions.set(toolId, [...permissions]);
    }
    getRequiredPermissions(toolId) {
        return this.requiredPermissions.get(toolId) ?? [];
    }
    /**
     * Executes a registered tool by id. Checks permissions (if any are
     * configured for the tool), enforces a timeout, and normalizes any
     * failure into a `ToolError` before rethrowing.
     */
    async execute(toolId, input, context, options = {}) {
        const tool = this.registry.get(toolId);
        if (!tool) {
            throw new ToolError({
                code: ToolErrorCode.NOT_FOUND,
                message: `Tool "${toolId}" is not registered`,
                retryable: false,
                context: { toolId },
            });
        }
        this.assertPermissions(toolId, context);
        const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
        try {
            const output = await this.withTimeout(tool.execute(input, context), timeoutMs, toolId);
            return output;
        }
        catch (rawError) {
            throw normalizeToolError(rawError, { toolId, pluginId: context.pluginId });
        }
    }
    assertPermissions(toolId, context) {
        const required = this.getRequiredPermissions(toolId);
        if (required.length === 0) {
            return;
        }
        if (!context.pluginId) {
            throw new ToolError({
                code: ToolErrorCode.PERMISSION_DENIED,
                message: `Tool "${toolId}" requires permissions but no pluginId was provided to check against`,
                retryable: false,
                context: { toolId, requiredPermissions: required },
            });
        }
        const missing = required.filter((permission) => !this.permissions.hasPermission(context.pluginId, permission));
        if (missing.length > 0) {
            throw new ToolError({
                code: ToolErrorCode.PERMISSION_DENIED,
                message: `Plugin "${context.pluginId}" is missing permission(s) [${missing.join(", ")}] required by tool "${toolId}"`,
                retryable: false,
                context: { toolId, pluginId: context.pluginId, missingPermissions: missing },
            });
        }
    }
    withTimeout(promise, timeoutMs, toolId) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new ToolError({
                    code: ToolErrorCode.TIMEOUT,
                    message: `Tool "${toolId}" timed out after ${timeoutMs}ms`,
                    retryable: true,
                    context: { toolId },
                }));
            }, timeoutMs);
            promise.then((value) => {
                clearTimeout(timer);
                resolve(value);
            }, (error) => {
                clearTimeout(timer);
                reject(error);
            });
        });
    }
}
export const toolExecutionPipeline = new ToolExecutionPipeline();
