/**
 * model-router.ts
 *
 * Thin re-export barrel. The routing implementation lives in `./router/`;
 * this file exists only to keep the flat top-level import path
 * (`orchestrator/models/model-router.js`) working for any existing or
 * future code that imports it directly instead of through `./index.js`.
 */

export * from "./router/index.js";

