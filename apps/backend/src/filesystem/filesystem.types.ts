/**
 * filesystem.types.ts
 *
 * Types for the workspace filesystem abstraction. Every operation in this
 * module is scoped to a root directory (a workspace root) — there is no
 * API surface that accepts an arbitrary absolute path, by design, so a
 * single `FileSystem` instance can never read or write outside the
 * workspace it was constructed for.
 */

export type FileEntryType = "file" | "directory" | "symlink" | "other";

export interface FileEntry {
  /** Path relative to the filesystem's root, using forward slashes regardless of OS. */
  readonly path: string;
  readonly name: string;
  readonly type: FileEntryType;
  readonly sizeBytes: number;
  readonly modifiedAt: Date;
}

export interface ListOptions {
  /** Recursively list nested directories. Default false. */
  readonly recursive?: boolean;
  /** Include dotfiles/dot-directories. Default false. */
  readonly includeHidden?: boolean;
}

export interface ReadTextOptions {
  readonly encoding?: BufferEncoding;
}

export interface WriteOptions {
  /** Create parent directories if they don't exist. Default true. */
  readonly createParents?: boolean;
  /** Fail instead of overwriting if the target already exists. Default false. */
  readonly failIfExists?: boolean;
}

export interface MkdirOptions {
  readonly recursive?: boolean;
}

export interface RemoveOptions {
  readonly recursive?: boolean;
  /** Do not throw if the target does not exist. Default false. */
  readonly force?: boolean;
}

/**
 * Root-scoped filesystem abstraction. All paths passed to these methods
 * are relative to whatever root the implementation was constructed with;
 * implementations are responsible for rejecting any path that would
 * resolve outside that root (see `path-guard.ts`).
 */
export interface FileSystem {
  readonly root: string;

  exists(relativePath: string): Promise<boolean>;
  stat(relativePath: string): Promise<FileEntry>;
  list(relativePath: string, options?: ListOptions): Promise<FileEntry[]>;

  readText(relativePath: string, options?: ReadTextOptions): Promise<string>;
  readBytes(relativePath: string): Promise<Buffer>;

  writeText(relativePath: string, content: string, options?: WriteOptions): Promise<void>;
  writeBytes(relativePath: string, content: Uint8Array, options?: WriteOptions): Promise<void>;

  mkdir(relativePath: string, options?: MkdirOptions): Promise<void>;
  remove(relativePath: string, options?: RemoveOptions): Promise<void>;
  rename(fromRelativePath: string, toRelativePath: string): Promise<void>;
  copy(fromRelativePath: string, toRelativePath: string): Promise<void>;

  /** Resolves a relative path to its absolute path on disk, without touching the filesystem. */
  resolvePath(relativePath: string): string;
}

