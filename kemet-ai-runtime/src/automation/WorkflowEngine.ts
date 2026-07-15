import { generateId } from '../core/ids.js';
import { ValidationError } from '../core/errors.js';
import type { EventBus } from '../core/events/EventBus.js';
import type { Logger } from '../core/logging/Logger.js';
import type { StepHandlerRegistry } from './StepHandlerRegistry.js';
import type {
  WorkflowDefinition,
  WorkflowRunContext,
  WorkflowRunResult,
  WorkflowStepDefinition,
  WorkflowStepOutcome,
} from './types.js';
import type { AutomationEventMap } from './events.js';

const MAX_STEPS_PER_RUN = 1000;

export class WorkflowEngine {
  public constructor(
    private readonly handlers: StepHandlerRegistry,
    private readonly events: EventBus<AutomationEventMap>,
    private readonly logger: Logger,
  ) {}

  public async run(
    definition: WorkflowDefinition,
    initialVariables: Record<string, unknown> = {},
  ): Promise<WorkflowRunResult> {
    const runId = generateId('run');
    const startedAt = new Date();
    const context: WorkflowRunContext = {
      workflowId: definition.id,
      runId,
      variables: { ...initialVariables },
      stepResults: {},
    };

    this.events.emit('workflow.started', { workflowId: definition.id, runId });

    const outcomes: WorkflowStepOutcome[] = [];
    let currentStepId: string | undefined = definition.startStepId;
    let stepsExecuted = 0;

    try {
      while (currentStepId) {
        stepsExecuted += 1;
        if (stepsExecuted > MAX_STEPS_PER_RUN) {
          throw new ValidationError(`Workflow "${definition.id}" exceeded ${MAX_STEPS_PER_RUN} steps; likely a cycle`, {
            runId,
          });
        }

        const step = definition.steps[currentStepId];
        if (!step) {
          throw new ValidationError(`Workflow "${definition.id}" references unknown step "${currentStepId}"`, { runId });
        }

        const outcome = await this.runStep(step, context);
        outcomes.push(outcome);
        context.stepResults[step.id] = outcome.output;
        this.events.emit('workflow.step.completed', { workflowId: definition.id, runId, outcome });

        currentStepId = this.resolveNext(step, context);
      }

      const finishedAt = new Date();
      const result: WorkflowRunResult = {
        workflowId: definition.id,
        runId,
        success: true,
        steps: outcomes,
        startedAt,
        finishedAt,
      };
      this.events.emit('workflow.completed', { result });
      return result;
    } catch (error) {
      const finishedAt = new Date();
      const message = error instanceof Error ? error.message : String(error);
      const result: WorkflowRunResult = {
        workflowId: definition.id,
        runId,
        success: false,
        steps: outcomes,
        error: message,
        startedAt,
        finishedAt,
      };
      this.logger.error('workflow run failed', { workflowId: definition.id, runId, message });
      this.events.emit('workflow.failed', { result });
      return result;
    }
  }

  private async runStep(step: WorkflowStepDefinition, context: WorkflowRunContext): Promise<WorkflowStepOutcome> {
    const handler = this.handlers.get(step.handler);
    const input = step.buildInput ? step.buildInput(context) : {};
    const startedAt = new Date();
    const output = await handler(context, input);
    const finishedAt = new Date();
    return { stepId: step.id, output, startedAt, finishedAt };
  }

  private resolveNext(step: WorkflowStepDefinition, context: WorkflowRunContext): string | undefined {
    if (!step.next) return undefined;
    if (typeof step.next === 'string') return step.next;
    const branch = step.next.find((candidate) => candidate.when(context));
    return branch?.next;
  }
}
