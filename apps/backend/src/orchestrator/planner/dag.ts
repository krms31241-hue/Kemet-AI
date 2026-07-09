import type { Task } from "../types/task.js";
import type {
  DagGraph,
  DagNode,
} from "./dag.types.js";

export class DagBuilder {
  build(tasks: Task[]): DagGraph {
    const nodes = new Map<string, DagNode>();

    for (const task of tasks) {
      nodes.set(task.id, {
        task,
        dependencies: [...task.dependencies],
        dependents: [],
      });
    }

    for (const node of nodes.values()) {
      for (const dependency of node.dependencies) {
        const parent = nodes.get(dependency);

        if (!parent) {
          throw new Error(
            `Missing dependency "${dependency}"`,
          );
        }

        parent.dependents.push(
          node.task.id,
        );
      }
    }

    this.detectCycles(nodes);

    return { nodes };
  }

  private detectCycles(
    nodes: Map<string, DagNode>,
  ) {
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const dfs = (id: string) => {
      if (visited.has(id)) {
        return;
      }

      if (visiting.has(id)) {
        throw new Error(
          `Cycle detected at "${id}"`,
        );
      }

      visiting.add(id);

      const node = nodes.get(id);

      if (node) {
        for (const dependency of node.dependencies) {
          dfs(dependency);
        }
      }

      visiting.delete(id);
      visited.add(id);
    };

    for (const id of nodes.keys()) {
      dfs(id);
    }
  }
}

export const dagBuilder =
  new DagBuilder();
