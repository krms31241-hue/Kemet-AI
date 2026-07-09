export type PluginPermission =
  | "fs.read"
  | "fs.write"
  | "terminal.exec"
  | "network.http"
  | "network.socket"
  | "git"
  | "docker"
  | "browser"
  | "database"
  | "env.read"
  | "env.write"
  | "process.spawn";
