export interface ToolDefinition {
  id: string;
  name: string;
  description?: string;
}

export interface ToolExecutionContext {
  workflowId?: string;
  agentId?: string;
}

export interface Tool {
  definition: ToolDefinition;

  execute(
    input: unknown,
    context: ToolExecutionContext,
  ): Promise<unknown>;
}
