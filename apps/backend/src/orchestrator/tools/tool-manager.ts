export interface ToolContext {
  projectId: string;

  workspace: string;
}

export interface Tool<Input = unknown, Output = unknown> {
  readonly name: string;

  execute(
    input: Input,
    context: ToolContext,
  ): Promise<Output>;
}

export class ToolManager {
  private readonly tools =
    new Map<string, Tool>();

  register(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  unregister(name: string) {
    this.tools.delete(name);
  }

  get(name: string) {
    return this.tools.get(name) ?? null;
  }

  list() {
    return [...this.tools.values()];
  }

  async execute<Input, Output>(
    name: string,
    input: Input,
    context: ToolContext,
  ) {
    const tool =
      this.tools.get(name);

    if (!tool) {
      throw new Error(
        `Tool "${name}" not found`,
      );
    }

    return tool.execute(
      input,
      context,
    ) as Promise<Output>;
  }
}

export const toolManager =
  new ToolManager();
