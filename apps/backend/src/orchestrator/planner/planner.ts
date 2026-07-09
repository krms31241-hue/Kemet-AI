import type { Task } from "../types/task.js";

import { dagBuilder } from "./dag.js";

export interface ExecutionStage {
  tasks: Task[];
}

export interface ExecutionPlan {
  stages: ExecutionStage[];
}

export class Planner {
  build(tasks: Task[]): ExecutionPlan {
    const graph = dagBuilder.build(tasks);

    const remaining = new Map<string, number>();

    const stages: ExecutionStage[] = [];

    for (const [id, node] of graph.nodes) {
      remaining.set(id, node.dependencies.length);
    }

    while (remaining.size > 0) {
      const ready = [...remaining.entries()]
        .filter(([, count]) => count === 0)
        .map(([id]) => id);

      if (ready.length === 0) {
        throw new Error("Invalid DAG");
      }

      stages.push({
        tasks: ready.map(
          (id) => graph.nodes.get(id)!.task,
        ),
      });

      for (const id of ready) {
        const node = graph.nodes.get(id)!;

        remaining.delete(id);

        for (const dependent of node.dependents) {
          remaining.set(
            dependent,
            remaining.get(dependent)! - 1,
          );
        }
      }
    }

    return {
      stages,
    };
  }
}

export const planner = new Planner();
