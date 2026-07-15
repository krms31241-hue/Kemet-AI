/**
 * local-filesystem.ts
 *
 * `FileSystem` implementation backed by the local disk (`node:fs`),
 * scoped to a single root directory via `resolveWithinRoot`. This is the
 * only place in the workspace subsystem that touches `node:fs` directly;
 * everything else (workspace lifecycle, tools, git) is expected to go
 * through a `FileSystem` instance instead.
 */
import { readFile, writeFile, mkdir as fsMkdir, rm, rename as fsRename, cp, readdir, stat as fsStat, access } from "node:fs/promises";
import path from "node:path";
import { FileSystemError, FileSystemErrorCode, normalizeFileSystemError } from "./filesystem-error.js";
import { resolveWithinRoot, toRelativePosixPath } from "./path-guard.js";
function classifyEntryType(dirent) {
    if (dirent.isDirectory())
        return "directory";
    if (dirent.isSymbolicLink())
        return "symlink";
    if (dirent.isFile())
        return "file";
    return "other";
}
export class LocalFileSystem {
    root;
    constructor(root) {
        this.root = path.resolve(root);
    }
    resolvePath(relativePath) {
        return resolveWithinRoot(this.root, relativePath);
    }
    async exists(relativePath) {
        const absolute = this.resolvePath(relativePath);
        try {
            await access(absolute);
            return true;
        }
        catch {
            return false;
        }
    }
    async stat(relativePath) {
        const absolute = this.resolvePath(relativePath);
        try {
            const stats = await fsStat(absolute);
            return {
                path: toRelativePosixPath(this.root, absolute),
                name: path.basename(absolute),
                type: stats.isDirectory() ? "directory" : stats.isFile() ? "file" : "other",
                sizeBytes: stats.size,
                modifiedAt: stats.mtime,
            };
        }
        catch (error) {
            throw normalizeFileSystemError(error, { root: this.root, path: relativePath });
        }
    }
    async list(relativePath, options = {}) {
        const absolute = this.resolvePath(relativePath);
        const includeHidden = options.includeHidden ?? false;
        const recursive = options.recursive ?? false;
        try {
            return await this.listDirectory(absolute, includeHidden, recursive);
        }
        catch (error) {
            throw normalizeFileSystemError(error, { root: this.root, path: relativePath });
        }
    }
    async listDirectory(absoluteDir, includeHidden, recursive) {
        const dirents = await readdir(absoluteDir, { withFileTypes: true });
        const entries = [];
        for (const dirent of dirents) {
            if (!includeHidden && dirent.name.startsWith(".")) {
                continue;
            }
            const absoluteChild = path.join(absoluteDir, dirent.name);
            const stats = await fsStat(absoluteChild);
            entries.push({
                path: toRelativePosixPath(this.root, absoluteChild),
                name: dirent.name,
                type: classifyEntryType(dirent),
                sizeBytes: stats.size,
                modifiedAt: stats.mtime,
            });
            if (recursive && dirent.isDirectory()) {
                entries.push(...(await this.listDirectory(absoluteChild, includeHidden, recursive)));
            }
        }
        return entries;
    }
    async readText(relativePath, options = {}) {
        const absolute = this.resolvePath(relativePath);
        try {
            return await readFile(absolute, options.encoding ?? "utf8");
        }
        catch (error) {
            throw normalizeFileSystemError(error, { root: this.root, path: relativePath });
        }
    }
    async readBytes(relativePath) {
        const absolute = this.resolvePath(relativePath);
        try {
            return await readFile(absolute);
        }
        catch (error) {
            throw normalizeFileSystemError(error, { root: this.root, path: relativePath });
        }
    }
    async writeText(relativePath, content, options = {}) {
        await this.write(relativePath, content, options);
    }
    async writeBytes(relativePath, content, options = {}) {
        await this.write(relativePath, content, options);
    }
    async write(relativePath, content, options) {
        const absolute = this.resolvePath(relativePath);
        const createParents = options.createParents ?? true;
        try {
            if (options.failIfExists) {
                await writeFile(absolute, content, { flag: "wx" });
                return;
            }
            if (createParents) {
                await fsMkdir(path.dirname(absolute), { recursive: true });
            }
            await writeFile(absolute, content);
        }
        catch (error) {
            throw normalizeFileSystemError(error, { root: this.root, path: relativePath });
        }
    }
    async mkdir(relativePath, options = {}) {
        const absolute = this.resolvePath(relativePath);
        try {
            await fsMkdir(absolute, { recursive: options.recursive ?? true });
        }
        catch (error) {
            throw normalizeFileSystemError(error, { root: this.root, path: relativePath });
        }
    }
    async remove(relativePath, options = {}) {
        if (relativePath === "" || relativePath === ".") {
            throw new FileSystemError({
                code: FileSystemErrorCode.PATH_ESCAPES_ROOT,
                message: "Refusing to remove the workspace root itself",
                context: { root: this.root, path: relativePath },
            });
        }
        const absolute = this.resolvePath(relativePath);
        try {
            await rm(absolute, { recursive: options.recursive ?? false, force: options.force ?? false });
        }
        catch (error) {
            throw normalizeFileSystemError(error, { root: this.root, path: relativePath });
        }
    }
    async rename(fromRelativePath, toRelativePath) {
        const fromAbsolute = this.resolvePath(fromRelativePath);
        const toAbsolute = this.resolvePath(toRelativePath);
        try {
            await fsMkdir(path.dirname(toAbsolute), { recursive: true });
            await fsRename(fromAbsolute, toAbsolute);
        }
        catch (error) {
            throw normalizeFileSystemError(error, { root: this.root, path: `${fromRelativePath} -> ${toRelativePath}` });
        }
    }
    async copy(fromRelativePath, toRelativePath) {
        const fromAbsolute = this.resolvePath(fromRelativePath);
        const toAbsolute = this.resolvePath(toRelativePath);
        try {
            await fsMkdir(path.dirname(toAbsolute), { recursive: true });
            await cp(fromAbsolute, toAbsolute, { recursive: true });
        }
        catch (error) {
            throw normalizeFileSystemError(error, { root: this.root, path: `${fromRelativePath} -> ${toRelativePath}` });
        }
    }
}
