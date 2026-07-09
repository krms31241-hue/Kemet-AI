import type { Task } from "../types/task.js";

export interface DagNode {
  task: Task;

  dependencies: string[];

  dependents: string[];
}

export interface DagGraph {
  nodes: Map<string, DagNode>;
}
