export type TaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface TaskContext {
  projectId: string;

  sessionId: string;

  workspace: string;

  variables: Record<string, unknown>;
}

export interface TaskResult {
  success: boolean;

  output?: unknown;

  error?: string;

  duration: number;
}

export interface Task {
  id: string;

  name: string;

  description?: string;

  agent: string;

  input: unknown;

  status: TaskStatus;

  context: TaskContext;

  dependencies: string[];

  result?: TaskResult;

  createdAt: Date;

  startedAt?: Date;

  finishedAt?: Date;
}
