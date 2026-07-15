/**
 * path-guard.ts
 *
 * Resolves a user-supplied relative path against a fixed root and
 * guarantees the result stays within that root. This is the single
 * security boundary every filesystem/terminal operation in the workspace
 * subsystem must pass through — without it, a relative path like
 * `"../../etc/passwd"` or an absolute path would let one workspace read
 * or write another workspace's (or the host's) files.
 */
import path from "node:path";
import { FileSystemError, FileSystemErrorCode } from "./filesystem-error.js";
/**
 * Resolves `relativePath` against `root` and throws `FileSystemError`
 * (code `PATH_ESCAPES_ROOT`) if the resolved path is not `root` itself or
 * a descendant of it. Rejects absolute paths and any traversal sequence
 * that would climb above the root, regardless of how it's encoded.
 */
export function resolveWithinRoot(root, relativePath) {
    const normalizedRoot = path.resolve(root);
    const resolved = path.resolve(normalizedRoot, relativePath);
    const relation = path.relative(normalizedRoot, resolved);
    const escapesRoot = relation === ".." || relation.startsWith(`..${path.sep}`) || path.isAbsolute(relation);
    if (escapesRoot) {
        throw new FileSystemError({
            code: FileSystemErrorCode.PATH_ESCAPES_ROOT,
            message: `Path "${relativePath}" resolves outside of workspace root "${normalizedRoot}"`,
            context: { root: normalizedRoot, path: relativePath },
        });
    }
    return resolved;
}
/** Converts an absolute path known to be within `root` back to a root-relative, forward-slash path. */
export function toRelativePosixPath(root, absolutePath) {
    const normalizedRoot = path.resolve(root);
    const relative = path.relative(normalizedRoot, absolutePath);
    return relative.split(path.sep).join("/");
}
