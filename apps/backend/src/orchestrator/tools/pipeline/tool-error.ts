/**
 * tool-error.ts
 *
 * Normalized error type for the tool execution pipeline and plugin
 * loading pipeline. Mirrors the shape/philosophy of `ProviderError` in
 * `models/providers/base/provider-error.ts` (single funnel, stable JSON
 * shape, retryability flag) but is intentionally independent of it: a
 * filesystem tool timing out is not a "provider" concern, and coupling
 * the two domains would create an awkward cross-import between unrelated
 * subsystems. New code, does not modify any existing stable file.
 */

export enum ToolErrorCode {
  NOT_FOUND = "NOT_FOUND",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  TIMEOUT = "TIMEOUT",
  VALIDATION = "VALIDATION",
  EXECUTION_FAILED = "EXECUTION_FAILED",
  ALREADY_LOADED = "ALREADY_LOADED",
  UNKNOWN = "UNKNOWN",
}

export interface ToolErrorContext {
  readonly toolId?: string;
  readonly pluginId?: string;
  readonly [key: string]: unknown;
}

export interface ToolErrorOptions {
  readonly code: ToolErrorCode;
  readonly message: string;
  readonly retryable: boolean;
  readonly context?: ToolErrorContext;
  readonly cause?: unknown;
}

export class ToolError extends Error {
  public readonly code: ToolErrorCode;
  public readonly retryable: boolean;
  public readonly context: ToolErrorContext;
  public override readonly cause?: unknown;
  public readonly timestamp: string;

  constructor(options: ToolErrorOptions) {
    super(options.message);
    this.name = "ToolError";
    this.code = options.code;
    this.retryable = options.retryable;
    this.context = options.context ?? {};
    this.cause = options.cause;
    this.timestamp = new Date().toISOString();

    Object.setPrototypeOf(this, ToolError.prototype);
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  public static isToolError(value: unknown): value is ToolError {
    return value instanceof ToolError;
  }
}

/** Normalizes any thrown value from a tool/plugin operation into a `ToolError`. */
export function normalizeToolError(error: unknown, context?: ToolErrorContext): ToolError {
  if (ToolError.isToolError(error)) {
    if (!context) {
      return error;
    }
    return new ToolError({
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      cause: error.cause,
      context: { ...error.context, ...context },
    });
  }

  if (error instanceof Error) {
    return new ToolError({
      code: ToolErrorCode.EXECUTION_FAILED,
      message: error.message,
      retryable: false,
      context,
      cause: error,
    });
  }

  return new ToolError({
    code: ToolErrorCode.UNKNOWN,
    message: typeof error === "string" ? error : "An unknown tool error occurred",
    retryable: false,
    context,
    cause: error,
  });
}

