/**
 * streaming.types.ts
 *
 * The base `Provider` interface (see `providers/provider.ts`) is
 * intentionally request/response only. Providers that can stream tokens
 * additionally implement `StreamingCapableProvider`, discovered at runtime
 * via {@link isStreamingCapable} rather than a static type assertion, so
 * routing can safely fall back to non-streaming providers.
 */
/**
 * Runtime type guard. A provider is treated as streaming-capable only if
 * it both advertises the `"streaming"` capability AND exposes a
 * `chatStream` method, guarding against providers that declare the
 * capability but haven't implemented it yet.
 */
export function isStreamingCapable(provider) {
    return (provider.capabilities.includes("streaming") &&
        typeof provider.chatStream === "function");
}
