/**
 * tool-adapter.ts
 *
 * `sdk/tool-sdk.ts`'s `BaseTool` (rich context: workflowId, taskId,
 * agentId, workspace, variables, metadata) and `tool-registry`'s `Tool`
 * (minimal context: workflowId?, agentId?) are two independent, stable
 * abstractions that were never wired together. This adapter lets a
 * `BaseTool` be registered into a `ToolRegistry` without either stable
 * interface changing: it synthesizes the fields the SDK context needs but
 * the registry context doesn't carry.
 */

import { randomUUID } from "node:crypto";

import { BaseTool } from "./tool-sdk.js";
import type { ToolContext as SdkToolContext } from "./tool-context.js";
import { toolRegistry, type ToolRegistry } from "../tool-registry/tool-registry.js";
import type { Tool, ToolExecutionContext } from "../tool-registry/tool.types.js";
import { ToolError, ToolErrorCode } from "../tools/pipeline/tool-error.js";

export interface SdkToolAdapterOptions {
  /** Overrides the registry-facing tool id. Defaults to `tool.id`. */
  readonly id?: string;
  readonly name?: string;
  readonly description?: string;
  /** Workspace path supplied to the SDK context, since `ToolExecutionContext` has no workspace field. */
  readonly defaultWorkspace: string;
  /** Optional hook to fill in `variables`/`metadata`/`projectId` on the synthesized SDK context. */
  readonly contextEnricher?: (
    context: ToolExecutionContext,
  ) => Partial<Pick<SdkToolContext, "projectId" | "variables" | "metadata">>;
}

/** Wraps a `BaseTool` as a registry-compatible `Tool`, without registering it anywhere. */
export function adaptSdkTool(tool: BaseTool, options: SdkToolAdapterOptions): Tool {
  return {
    definition: {
      id: options.id ?? tool.id,
      name: options.name ?? tool.name,
      description: options.description ?? tool.description,
    },

    async execute(input: unknown, context: ToolExecutionContext): Promise<unknown> {
      const enrichment = options.contextEnricher?.(context) ?? {};

      const sdkContext: SdkToolContext = {
        workflowId: context.workflowId ?? randomUUID(),
        taskId: randomUUID(),
        agentId: context.agentId ?? "unknown",
        workspace: options.defaultWorkspace,
        variables: {},
        metadata: {},
        ...enrichment,
      };

      const result = await tool.run(input, sdkContext);

      if (!result.success) {
        throw new ToolError({
          code: ToolErrorCode.EXECUTION_FAILED,
          message: result.error ?? `Tool "${tool.id}" failed without an error message`,
          retryable: false,
          context: { toolId: tool.id, durationMs: result.duration },
        });
      }

      return result.output;
    },
  };
}

/** Adapts and registers a `BaseTool` into a `ToolRegistry` (defaults to the shared singleton) in one call. */
export function registerSdkTool(tool: BaseTool, options: SdkToolAdapterOptions, registry: ToolRegistry = toolRegistry): Tool {
  const adapted = adaptSdkTool(tool, options);
  registry.register(adapted);
  return adapted;
}

