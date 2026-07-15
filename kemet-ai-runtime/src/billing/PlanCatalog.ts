import { NotFoundError, ValidationError } from '../core/errors.js';
import type { Plan } from './types.js';

export class PlanCatalog {
  private readonly plans = new Map<string, Plan>();

  public constructor(initialPlans: readonly Plan[] = []) {
    for (const plan of initialPlans) this.register(plan);
  }

  public register(plan: Plan): void {
    if (plan.intervalCount <= 0) {
      throw new ValidationError('Plan.intervalCount must be positive', { planId: plan.id });
    }
    this.plans.set(plan.id, plan);
  }

  public get(planId: string): Plan {
    const plan = this.plans.get(planId);
    if (!plan) throw new NotFoundError('Plan', planId);
    return plan;
  }

  public has(planId: string): boolean {
    return this.plans.has(planId);
  }

  public list(): readonly Plan[] {
    return Array.from(this.plans.values());
  }
}
