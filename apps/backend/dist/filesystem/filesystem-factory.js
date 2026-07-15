/**
 * filesystem-factory.ts
 *
 * Small convenience factory so callers depend on the `FileSystem`
 * interface rather than constructing `LocalFileSystem` directly —
 * keeps the door open for a future non-local implementation (e.g. a
 * remote/sandboxed workspace backend) without changing call sites.
 */
import { LocalFileSystem } from "./local-filesystem.js";
export function createLocalFileSystem(root) {
    return new LocalFileSystem(root);
}
