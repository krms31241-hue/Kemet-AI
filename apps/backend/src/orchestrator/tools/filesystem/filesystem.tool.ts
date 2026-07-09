import {
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";

import path from "node:path";

import type {
  Tool,
  ToolExecutionContext,
} from "../../tool-registry/index.js";

export interface FileSystemInput {
  action:
    | "read"
    | "write"
    | "mkdir";

  target: string;

  content?: string;
}

export class FileSystemTool
  implements Tool
{
  definition = {
    id: "filesystem",
    name: "File System",
    description:
      "Read, write and create directories",
  };

  async execute(
    input: unknown,
    _context: ToolExecutionContext,
  ): Promise<unknown> {
    const request =
      input as FileSystemInput;

    const target =
      path.resolve(request.target);

    switch (request.action) {
      case "read":
        return readFile(
          target,
          "utf8",
        );

      case "write":
        await writeFile(
          target,
          request.content ?? "",
          "utf8",
        );

        return {
          success: true,
        };

      case "mkdir":
        await mkdir(target, {
          recursive: true,
        });

        return {
          success: true,
        };

      default:
        throw new Error(
          `Unsupported filesystem action: ${request.action}`,
        );
    }
  }
}

export const fileSystemTool =
  new FileSystemTool();
