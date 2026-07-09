export class WorkflowRegistry {
    workflows = new Map();
    register(workflow) {
        this.workflows.set(workflow.id, workflow);
        return workflow;
    }
    get(id) {
        return (this.workflows.get(id) ?? null);
    }
    has(id) {
        return this.workflows.has(id);
    }
    remove(id) {
        return this.workflows.delete(id);
    }
    clear() {
        this.workflows.clear();
    }
    list() {
        return [
            ...this.workflows.values(),
        ];
    }
    count() {
        return this.workflows.size;
    }
}
export const workflowRegistry = new WorkflowRegistry();
