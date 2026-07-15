import type { WorkflowRunResult, WorkflowStepOutcome } from './types.js';

export interface AutomationEventMap {
  'workflow.started': { workflowId: string; runId: string };
  'workflow.step.completed': { workflowId: string; runId: string; outcome: WorkflowStepOutcome };
  'workflow.completed': { result: WorkflowRunResult };
  'workflow.failed': { result: WorkflowRunResult };
  [key: string]: unknown;
}
