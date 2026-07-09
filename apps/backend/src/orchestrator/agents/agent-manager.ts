import type { AgentConfig } from "../types/agent.js";
import type { Task } from "../types/task.js";

export interface AgentRuntime {
  config: AgentConfig;

  execute(
    task: Task,
  ): Promise<unknown>;
}

export class AgentManager {
  private readonly agents =
    new Map<string, AgentRuntime>();

  register(
    runtime: AgentRuntime,
  ) {
    this.agents.set(
      runtime.config.id,
      runtime,
    );
  }

  unregister(id: string) {
    this.agents.delete(id);
  }

  get(id: string) {
    return this.agents.get(id) ?? null;
  }

  list() {
    return [...this.agents.values()];
  }

  async execute(task: Task) {
    const runtime =
      this.agents.get(task.agent);

    if (!runtime) {
      throw new Error(
        `Agent "${task.agent}" not found`,
      );
    }

    return runtime.execute(task);
  }
}

export const agentManager =
  new AgentManager();
