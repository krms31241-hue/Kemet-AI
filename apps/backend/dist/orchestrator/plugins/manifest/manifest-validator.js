/**
 * manifest-validator.ts
 *
 * Runtime structural validation for `PluginManifest`. Implemented without
 * an external schema library so the plugin loading path has no new
 * runtime dependency; the literal value lists below are guarded by a
 * compile-time exhaustiveness check (`satisfies`-style trick) so if
 * `PluginCapability` or `PluginPermission` ever gain a new member without
 * this file being updated, `tsc` fails the build rather than silently
 * accepting a manifest with unrecognized values.
 */
import { ToolError, ToolErrorCode } from "../../tools/pipeline/tool-error.js";
const CAPABILITY_VALUES = [
    "filesystem",
    "terminal",
    "git",
    "docker",
    "browser",
    "database",
    "network",
    "ai",
    "media",
    "document",
    "deployment",
    "security",
    "testing",
    "workflow",
    "memory",
    "search",
];
const PERMISSION_VALUES = [
    "fs.read",
    "fs.write",
    "terminal.exec",
    "network.http",
    "network.socket",
    "git",
    "docker",
    "browser",
    "database",
    "env.read",
    "env.write",
    "process.spawn",
];
const _capabilitiesCovered = true;
const _permissionsCovered = true;
void _capabilitiesCovered;
void _permissionsCovered;
const CAPABILITY_SET = new Set(CAPABILITY_VALUES);
const PERMISSION_SET = new Set(PERMISSION_VALUES);
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isStringArray(value) {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
}
function isStringRecord(value) {
    return isRecord(value) && Object.values(value).every((item) => typeof item === "string");
}
class ManifestIssueCollector {
    issues = [];
    require(condition, message) {
        if (!condition) {
            this.issues.push(message);
        }
    }
    hasIssues() {
        return this.issues.length > 0;
    }
    messages() {
        return this.issues;
    }
}
/**
 * Validates an unknown value as a `PluginManifest`. Throws a `ToolError`
 * (code `VALIDATION`) with every problem found (not just the first) if
 * the candidate is invalid; returns a properly-typed manifest otherwise.
 */
export function validateManifest(candidate) {
    const issues = new ManifestIssueCollector();
    if (!isRecord(candidate)) {
        throw new ToolError({
            code: ToolErrorCode.VALIDATION,
            message: "Plugin manifest must be a JSON object",
            retryable: false,
        });
    }
    const requiredString = (key) => {
        issues.require(typeof candidate[key] === "string" && candidate[key].length > 0, `"${key}" must be a non-empty string`);
    };
    requiredString("id");
    requiredString("name");
    requiredString("displayName");
    requiredString("version");
    requiredString("entry");
    for (const optionalKey of ["description", "author", "license", "homepage", "repository", "icon", "category"]) {
        const value = candidate[optionalKey];
        issues.require(value === undefined || typeof value === "string", `"${optionalKey}" must be a string when present`);
    }
    if (isStringArray(candidate.capabilities)) {
        for (const capability of candidate.capabilities) {
            issues.require(CAPABILITY_SET.has(capability), `"capabilities" contains unknown value "${capability}"`);
        }
    }
    else {
        issues.require(false, `"capabilities" must be an array of strings`);
    }
    if (isStringArray(candidate.permissions)) {
        for (const permission of candidate.permissions) {
            issues.require(PERMISSION_SET.has(permission), `"permissions" contains unknown value "${permission}"`);
        }
    }
    else {
        issues.require(false, `"permissions" must be an array of strings`);
    }
    issues.require(isStringRecord(candidate.dependencies), `"dependencies" must be an object of string values`);
    issues.require(isStringRecord(candidate.optionalDependencies), `"optionalDependencies" must be an object of string values`);
    issues.require(isStringArray(candidate.keywords), `"keywords" must be an array of strings`);
    issues.require(isStringArray(candidate.activationEvents), `"activationEvents" must be an array of strings`);
    issues.require(isRecord(candidate.configuration), `"configuration" must be an object`);
    issues.require(isRecord(candidate.contributes), `"contributes" must be an object`);
    if (issues.hasIssues()) {
        throw new ToolError({
            code: ToolErrorCode.VALIDATION,
            message: `Invalid plugin manifest: ${issues.messages().join("; ")}`,
            retryable: false,
            context: { issues: issues.messages() },
        });
    }
    return candidate;
}
