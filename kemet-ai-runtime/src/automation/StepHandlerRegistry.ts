import { ConflictError, NotFoundError } from '../core/errors.js';
import type { StepHandler } from './types.js';

export class StepHandlerRegistry {
  private readonly handlers = new Map<string, StepHandler>();

  public register(name: string, handler: StepHandler): void {
    if (this.handlers.has(name)) {
      throw new ConflictError(`Step handler "${name}" is already registered`);
    }
    this.handlers.set(name, handler);
  }

  public replace(name: string, handler: StepHandler): void {
    this.handlers.set(name, handler);
  }

  public get(name: string): StepHandler {
    const handler = this.handlers.get(name);
    if (!handler) throw new NotFoundError('StepHandler', name);
    return handler;
  }

  public has(name: string): boolean {
    return this.handlers.has(name);
  }
}
