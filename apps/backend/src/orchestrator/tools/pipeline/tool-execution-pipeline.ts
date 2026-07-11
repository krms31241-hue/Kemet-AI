/**
 * tool-execution-pipeline.ts
 *
 * Production execution seam for tools registered in the (stable)
 * `ToolRegistry`. Adds three things the raw registry deliberately does
 * not own: permission enforcement (via `PermissionManager`), timeout
 * enforcement, and normalized error handling — without modifying
 * `ToolRegistry`, `Tool`, or `ToolExecutionContext` themselves.
 */

import { toolRegistry, type ToolRegistry } from "../../tool-registry/tool-registry.js";
import type { ToolExecutionContext } from "../../tool-registry/tool.types.js";
import { permissionManager, type PermissionManager } from "../../plugins/permissions/permission-manager.js";
import type { PluginPermission } from "../../plugins/manifest/plugin-permissions.js";
import { normalizeToolError, ToolError, ToolErrorCode } from "./tool-error.js";

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Execution context accepted by the pipeline. A structural superset of
 * `ToolExecutionContext`: everywhere a `ToolExecutionContext` is expected
 * this is still assignable, but callers can additionally identify which
 * plugin (if any) is invoking the tool so permissions can be checked.
 */
export interface PipelineExecutionContext extends ToolExecutionContext {
  readonly pluginId?: string;
}

export interface ToolExecutionOptions {
  readonly timeoutMs?: number;
}

export class ToolExecutionPipeline {
  private readonly registry: ToolRegistry;
  private readonly permissions: PermissionManager;
  private readonly defaultTimeoutMs: number;
  private readonly requiredPermissions = new Map<string, PluginPermission[]>();

  constructor(
    registry: ToolRegistry = toolRegistry,
    permissions: PermissionManager = permissionManager,
    defaultTimeoutMs: number = DEFAULT_TIMEOUT_MS,
  ) {
    this.registry = registry;
    this.permissions = permissions;
    this.defaultTimeoutMs = defaultTimeoutMs;
  }

  /** Declares that invoking `toolId` requires the caller to hold every permission listed. */
  public requirePermissions(toolId: string, permissions: readonly PluginPermission[]): void {
    this.requiredPermissions.set(toolId, [...permissions]);
  }

  public getRequiredPermissions(toolId: string): readonly PluginPermission[] {
    return this.requiredPermissions.get(toolId) ?? [];
  }

  /**
   * Executes a registered tool by id. Checks permissions (if any are
   * configured for the tool), enforces a timeout, and normalizes any
   * failure into a `ToolError` before rethrowing.
   */
  public async execute<Output = unknown>(
    toolId: string,
    input: unknown,
    context: PipelineExecutionContext,
    options: ToolExecutionOptions = {},
  ): Promise<Output> {
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
      return output as Output;
    } catch (rawError) {
      throw normalizeToolError(rawError, { toolId, pluginId: context.pluginId });
    }
  }

  private assertPermissions(toolId: string, context: PipelineExecutionContext): void {
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

    const missing = required.filter((permission) => !this.permissions.hasPermission(context.pluginId!, permission));

    if (missing.length > 0) {
      throw new ToolError({
        code: ToolErrorCode.PERMISSION_DENIED,
        message: `Plugin "${context.pluginId}" is missing permission(s) [${missing.join(", ")}] required by tool "${toolId}"`,
        retryable: false,
        context: { toolId, pluginId: context.pluginId, missingPermissions: missing },
      });
    }
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number, toolId: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new ToolError({
            code: ToolErrorCode.TIMEOUT,
            message: `Tool "${toolId}" timed out after ${timeoutMs}ms`,
            retryable: true,
            context: { toolId },
          }),
        );
      }, timeoutMs);

      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error: unknown) => {
          clearTimeout(timer);
          reject(error);
        },
      );
    });
  }
}

export const toolExecutionPipeline = new ToolExecutionPipeline();

