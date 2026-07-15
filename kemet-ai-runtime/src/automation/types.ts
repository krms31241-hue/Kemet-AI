export interface WorkflowRunContext {
  readonly workflowId: string;
  readonly runId: string;
  readonly variables: Record<string, unknown>;
  readonly stepResults: Record<string, unknown>;
}

export type StepHandler = (context: WorkflowRunContext, input: Record<string, unknown>) => Promise<unknown>;

export interface WorkflowBranch {
  readonly when: (context: WorkflowRunContext) => boolean;
  readonly next: string;
}

export interface WorkflowStepDefinition {
  readonly id: string;
  readonly handler: string;
  readonly buildInput?: (context: WorkflowRunContext) => Record<string, unknown>;
  readonly next?: string | readonly WorkflowBranch[];
}

export type TriggerType = 'event' | 'schedule' | 'manual';

export interface WorkflowDefinition {
  readonly id: string;
  readonly name: string;
  readonly triggerType: TriggerType;
  readonly startStepId: string;
  readonly steps: Readonly<Record<string, WorkflowStepDefinition>>;
}

export interface WorkflowStepOutcome {
  readonly stepId: string;
  readonly output: unknown;
  readonly startedAt: Date;
  readonly finishedAt: Date;
}

export interface WorkflowRunResult {
  readonly workflowId: string;
  readonly runId: string;
  readonly success: boolean;
  readonly steps: readonly WorkflowStepOutcome[];
  readonly error?: string;
  readonly startedAt: Date;
  readonly finishedAt: Date;
}
