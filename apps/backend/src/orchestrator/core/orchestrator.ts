import crypto from "node:crypto";

import type { Task } from "../types/task.js";
import type { AgentConfig } from "../types/agent.js";

export class Orchestrator {
  private readonly tasks = new Map<string, Task>();

  private readonly agents = new Map<string, AgentConfig>();

  registerAgent(agent: AgentConfig) {
    this.agents.set(agent.id, agent);
  }

  unregisterAgent(id: string) {
    this.agents.delete(id);
  }

  getAgent(id: string) {
    return this.agents.get(id) ?? null;
  }

  getAgents() {
    return [...this.agents.values()];
  }

  createTask(
    task: Omit<
      Task,
      | "id"
      | "status"
      | "createdAt"
    >,
  ) {
    const entity: Task = {
      ...task,
      id: crypto.randomUUID(),
      status: "pending",
      createdAt: new Date(),
    };

    this.tasks.set(entity.id, entity);

    return entity;
  }

  getTask(id: string) {
    return this.tasks.get(id) ?? null;
  }

  getTasks() {
    return [...this.tasks.values()];
  }

  updateTask(task: Task) {
    this.tasks.set(task.id, task);

    return task;
  }

  removeTask(id: string) {
    return this.tasks.delete(id);
  }

  clear() {
    this.tasks.clear();
  }
}

export const orchestrator =
  new Orchestrator();
