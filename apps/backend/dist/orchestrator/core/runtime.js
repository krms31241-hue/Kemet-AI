import { planner } from "../planner/index.js";
import { executor } from "../executor/index.js";
import { agentManager } from "../agents/index.js";
import { eventBus } from "../events/index.js";
export class OrchestratorRuntime {
    async run(tasks) {
        await eventBus.emit("workflow.started", { tasks });
        const plan = planner.build(tasks);
        const result = await executor.execute(plan.stages, async (task) => {
            await eventBus.emit("task.started", task);
            try {
                const output = await agentManager.execute(task);
                await eventBus.emit("task.completed", {
                    task,
                    output,
                });
                return output;
            }
            catch (error) {
                await eventBus.emit("task.failed", {
                    task,
                    error,
                });
                throw error;
            }
        });
        await eventBus.emit("workflow.completed", result);
        return result;
    }
}
export const runtime = new OrchestratorRuntime();
