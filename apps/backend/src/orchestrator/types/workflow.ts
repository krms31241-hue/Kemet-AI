export interface WorkflowNode {
  id: string;

  type: string;

  title: string;

  configuration: Record<string, unknown>;
}

export interface WorkflowEdge {
  source: string;

  target: string;
}

export interface WorkflowDefinition {
  id: string;

  projectId: string;

  name: string;

  nodes: WorkflowNode[];

  edges: WorkflowEdge[];
}
