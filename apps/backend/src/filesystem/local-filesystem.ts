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

import type {
  FileEntry,
  FileEntryType,
  FileSystem,
  ListOptions,
  MkdirOptions,
  ReadTextOptions,
  RemoveOptions,
  WriteOptions,
} from "./filesystem.types.js";
import { FileSystemError, FileSystemErrorCode, normalizeFileSystemError } from "./filesystem-error.js";
import { resolveWithinRoot, toRelativePosixPath } from "./path-guard.js";

function classifyEntryType(dirent: { isDirectory(): boolean; isSymbolicLink(): boolean; isFile(): boolean }): FileEntryType {
  if (dirent.isDirectory()) return "directory";
  if (dirent.isSymbolicLink()) return "symlink";
  if (dirent.isFile()) return "file";
  return "other";
}

export class LocalFileSystem implements FileSystem {
  public readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  public resolvePath(relativePath: string): string {
    return resolveWithinRoot(this.root, relativePath);
  }

  public async exists(relativePath: string): Promise<boolean> {
    const absolute = this.resolvePath(relativePath);
    try {
      await access(absolute);
      return true;
    } catch {
      return false;
    }
  }

  public async stat(relativePath: string): Promise<FileEntry> {
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
    } catch (error) {
      throw normalizeFileSystemError(error, { root: this.root, path: relativePath });
    }
  }

  public async list(relativePath: string, options: ListOptions = {}): Promise<FileEntry[]> {
    const absolute = this.resolvePath(relativePath);
    const includeHidden = options.includeHidden ?? false;
    const recursive = options.recursive ?? false;

    try {
      return await this.listDirectory(absolute, includeHidden, recursive);
    } catch (error) {
      throw normalizeFileSystemError(error, { root: this.root, path: relativePath });
    }
  }

  private async listDirectory(absoluteDir: string, includeHidden: boolean, recursive: boolean): Promise<FileEntry[]> {
    const dirents = await readdir(absoluteDir, { withFileTypes: true });
    const entries: FileEntry[] = [];

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

  public async readText(relativePath: string, options: ReadTextOptions = {}): Promise<string> {
    const absolute = this.resolvePath(relativePath);
    try {
      return await readFile(absolute, options.encoding ?? "utf8");
    } catch (error) {
      throw normalizeFileSystemError(error, { root: this.root, path: relativePath });
    }
  }

  public async readBytes(relativePath: string): Promise<Buffer> {
    const absolute = this.resolvePath(relativePath);
    try {
      return await readFile(absolute);
    } catch (error) {
      throw normalizeFileSystemError(error, { root: this.root, path: relativePath });
    }
  }

  public async writeText(relativePath: string, content: string, options: WriteOptions = {}): Promise<void> {
    await this.write(relativePath, content, options);
  }

  public async writeBytes(relativePath: string, content: Uint8Array, options: WriteOptions = {}): Promise<void> {
    await this.write(relativePath, content, options);
  }

  private async write(relativePath: string, content: string | Uint8Array, options: WriteOptions): Promise<void> {
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
    } catch (error) {
      throw normalizeFileSystemError(error, { root: this.root, path: relativePath });
    }
  }

  public async mkdir(relativePath: string, options: MkdirOptions = {}): Promise<void> {
    const absolute = this.resolvePath(relativePath);
    try {
      await fsMkdir(absolute, { recursive: options.recursive ?? true });
    } catch (error) {
      throw normalizeFileSystemError(error, { root: this.root, path: relativePath });
    }
  }

  public async remove(relativePath: string, options: RemoveOptions = {}): Promise<void> {
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
    } catch (error) {
      throw normalizeFileSystemError(error, { root: this.root, path: relativePath });
    }
  }

  public async rename(fromRelativePath: string, toRelativePath: string): Promise<void> {
    const fromAbsolute = this.resolvePath(fromRelativePath);
    const toAbsolute = this.resolvePath(toRelativePath);
    try {
      await fsMkdir(path.dirname(toAbsolute), { recursive: true });
      await fsRename(fromAbsolute, toAbsolute);
    } catch (error) {
      throw normalizeFileSystemError(error, { root: this.root, path: `${fromRelativePath} -> ${toRelativePath}` });
    }
  }

  public async copy(fromRelativePath: string, toRelativePath: string): Promise<void> {
    const fromAbsolute = this.resolvePath(fromRelativePath);
    const toAbsolute = this.resolvePath(toRelativePath);
    try {
      await fsMkdir(path.dirname(toAbsolute), { recursive: true });
      await cp(fromAbsolute, toAbsolute, { recursive: true });
    } catch (error) {
      throw normalizeFileSystemError(error, { root: this.root, path: `${fromRelativePath} -> ${toRelativePath}` });
    }
  }
}

