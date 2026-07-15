import type { EventBus, Unsubscribe } from '../core/events/EventBus.js';
import type { Logger } from '../core/logging/Logger.js';
import type { JobExecutor, ScheduledJob } from '../scheduler/types.js';
import type { WorkflowEngine } from './WorkflowEngine.js';
import type { WorkflowDefinition } from './types.js';

export class TriggerManager<TEventMap extends Record<string, unknown>> {
  private readonly subscriptions: Unsubscribe[] = [];

  public constructor(
    private readonly eventBus: EventBus<TEventMap>,
    private readonly engine: WorkflowEngine,
    private readonly logger: Logger,
  ) {}

  public registerEventTrigger<TEvent extends keyof TEventMap>(
    event: TEvent,
    definition: WorkflowDefinition,
    mapPayloadToVariables: (payload: TEventMap[TEvent]) => Record<string, unknown> = () => ({}),
  ): Unsubscribe {
    const unsubscribe = this.eventBus.on(event, (payload) => {
      const variables = mapPayloadToVariables(payload);
      this.engine.run(definition, variables).catch((error) => {
        this.logger.error('event-triggered workflow run failed to start', {
          workflowId: definition.id,
          event: String(event),
          message: error instanceof Error ? error.message : String(error),
        });
      });
    });
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  public createScheduledExecutor(definition: WorkflowDefinition): JobExecutor {
    return {
      execute: async (job) => {
        const result = await this.engine.run(definition, { ...job.payload });
        if (!result.success) {
          throw new Error(result.error ?? `Workflow "${definition.id}" failed`);
        }
      },
    };
  }

  public dispose(): void {
    for (const unsubscribe of this.subscriptions) unsubscribe();
    this.subscriptions.length = 0;
  }
}
