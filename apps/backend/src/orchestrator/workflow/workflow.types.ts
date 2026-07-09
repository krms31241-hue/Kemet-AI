export type WorkflowStatus =
  | "idle"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface WorkflowVariable {
  name: string;
  value: unknown;
}

export interface WorkflowMetadata {
  id: string;
  name: string;
  description?: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowDefinition {
  metadata: WorkflowMetadata;
  variables: WorkflowVariable[];
}
