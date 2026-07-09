import { mkdir, readFile, writeFile, } from "node:fs/promises";
import path from "node:path";
export class FileSystemTool {
    definition = {
        id: "filesystem",
        name: "File System",
        description: "Read, write and create directories",
    };
    async execute(input, _context) {
        const request = input;
        const target = path.resolve(request.target);
        switch (request.action) {
            case "read":
                return readFile(target, "utf8");
            case "write":
                await writeFile(target, request.content ?? "", "utf8");
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
                throw new Error(`Unsupported filesystem action: ${request.action}`);
        }
    }
}
export const fileSystemTool = new FileSystemTool();
