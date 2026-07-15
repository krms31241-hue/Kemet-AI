/**
 * filesystem.types.ts
 *
 * Types for the workspace filesystem abstraction. Every operation in this
 * module is scoped to a root directory (a workspace root) — there is no
 * API surface that accepts an arbitrary absolute path, by design, so a
 * single `FileSystem` instance can never read or write outside the
 * workspace it was constructed for.
 */
export {};
