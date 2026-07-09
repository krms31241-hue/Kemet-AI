import type {
  WorkflowDefinition,
} from "./workflow.types.js";

export class Workflow {
  constructor(
    public readonly definition: WorkflowDefinition,
  ) {}

  get id() {
    return this.definition.metadata.id;
  }

  get name() {
    return this.definition.metadata.name;
  }

  get version() {
    return this.definition.metadata.version;
  }
}
