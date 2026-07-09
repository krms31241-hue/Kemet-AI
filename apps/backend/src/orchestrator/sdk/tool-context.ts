export interface ToolContext {
  workflowId: string;

  taskId: string;

  agentId: string;

  projectId?: string;

  workspace: string;

  variables: Record<string, unknown>;

  metadata: Record<string, unknown>;
}
