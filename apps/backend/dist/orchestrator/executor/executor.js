export class Executor {
    async execute(stages, runner) {
        const results = [];
        for (const stage of stages) {
            await Promise.all(stage.tasks.map(async (task) => {
                task.status = "running";
                task.startedAt = new Date();
                try {
                    const output = await runner(task);
                    task.status = "completed";
                    task.finishedAt = new Date();
                    task.result = {
                        success: true,
                        output,
                        duration: task.finishedAt.getTime() -
                            task.startedAt.getTime(),
                    };
                }
                catch (error) {
                    task.status = "failed";
                    task.finishedAt = new Date();
                    task.result = {
                        success: false,
                        error: error instanceof Error
                            ? error.message
                            : "Unknown error",
                        duration: task.finishedAt.getTime() -
                            task.startedAt.getTime(),
                    };
                }
                results.push(task);
            }));
        }
        return results;
    }
}
export const executor = new Executor();
