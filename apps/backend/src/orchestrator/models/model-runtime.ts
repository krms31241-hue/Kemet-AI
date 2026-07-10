/**
 * model-runtime.ts
 *
 * Thin re-export barrel. The runtime orchestration implementation lives in
 * `./runtime/`; this file exists only to keep the flat top-level import
 * path (`orchestrator/models/model-runtime.js`) working for any existing
 * or future code that imports it directly instead of through `./index.js`.
 */

export * from "./runtime/index.js";

