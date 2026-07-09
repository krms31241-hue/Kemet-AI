export interface ToolResult<T = unknown> {
  success: boolean;

  output?: T;

  error?: string;

  duration: number;

  metadata?: Record<string, unknown>;
}
