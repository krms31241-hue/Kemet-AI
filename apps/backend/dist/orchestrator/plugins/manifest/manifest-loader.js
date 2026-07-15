/**
 * manifest-loader.ts
 *
 * Reads a `plugin.manifest.json`-style file from disk, parses it, and
 * validates it via {@link validateManifest}. Kept separate from the
 * validator so callers that already have a parsed object in hand (e.g.
 * from a marketplace API response) can validate without touching the
 * filesystem.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ToolError, ToolErrorCode } from "../../tools/pipeline/tool-error.js";
import { validateManifest } from "./manifest-validator.js";
export async function loadManifestFromFile(manifestPath) {
    const resolved = path.resolve(manifestPath);
    let raw;
    try {
        raw = await readFile(resolved, "utf8");
    }
    catch (error) {
        throw new ToolError({
            code: ToolErrorCode.NOT_FOUND,
            message: `Could not read plugin manifest at "${resolved}": ${error instanceof Error ? error.message : String(error)}`,
            retryable: false,
            cause: error,
        });
    }
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (error) {
        throw new ToolError({
            code: ToolErrorCode.VALIDATION,
            message: `Failed to parse plugin manifest JSON at "${resolved}": ${error instanceof Error ? error.message : String(error)}`,
            retryable: false,
            cause: error,
        });
    }
    return validateManifest(parsed);
}
export function loadManifestFromObject(candidate) {
    return validateManifest(candidate);
}
