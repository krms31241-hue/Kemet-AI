/**
 * terminal.types.ts
 *
 * Types for executing shell commands as child processes. This module is
 * a low-level primitive: it operates on an already-resolved absolute
 * `cwd` and does not itself understand "workspaces" — path containment
 * (keeping a command's cwd inside a workspace root) is the responsibility
 * of the caller (the future `workspace` subsystem), reusing
 * `filesystem`'s `resolveWithinRoot` for that check.
 */
export {};
