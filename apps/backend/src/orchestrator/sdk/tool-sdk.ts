import type { ToolContext } from "./tool-context.js";
import type { ToolResult } from "./tool-result.js";

export abstract class BaseTool<
  TInput = unknown,
  TOutput = unknown,
> {
  abstract readonly id: string;

  abstract readonly name: string;

  abstract readonly description: string;

  async run(
    input: TInput,
    context: ToolContext,
  ): Promise<ToolResult<TOutput>> {
    const started = Date.now();

    try {
      const output =
        await this.execute(
          input,
          context,
        );

      return {
        success: true,
        output,
        duration:
          Date.now() - started,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
        duration:
          Date.now() - started,
      };
    }
  }

  protected abstract execute(
    input: TInput,
    context: ToolContext,
  ): Promise<TOutput>;
}
