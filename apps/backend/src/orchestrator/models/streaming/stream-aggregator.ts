/**
 * stream-aggregator.ts
 *
 * Consumes a `StreamChunk` async iterable from a streaming-capable
 * provider, forwarding each chunk to an optional listener (typically
 * wired to `ModelEventBus` or a websocket/SSE transport) while assembling
 * the final `ChatResponse` once the stream completes.
 */

import { randomUUID } from "node:crypto";

import type { ChatResponse } from "../providers/provider.types.js";
import type { AggregatedStreamResult, StreamChunk, StreamChunkListener } from "./streaming.types.js";

export class StreamAggregator {
  /**
   * Drains the given stream to completion, invoking `onChunk` for every
   * chunk as it arrives, and returns the fully assembled response.
   *
   * @param model - model identifier to stamp on the assembled response.
   * @param stream - the provider's async chunk iterable.
   * @param onChunk - optional callback invoked synchronously for each chunk, in order.
   */
  public async aggregate(
    model: string,
    stream: AsyncIterable<StreamChunk>,
    onChunk?: StreamChunkListener,
  ): Promise<AggregatedStreamResult> {
    let content = "";
    let chunkCount = 0;

    for await (const chunk of stream) {
      content += chunk.delta;
      chunkCount += 1;
      if (onChunk) {
        await onChunk(chunk);
      }
    }

    const response: ChatResponse = {
      id: randomUUID(),
      model,
      message: {
        role: "assistant",
        content,
      },
    };

    return { response, chunkCount };
  }
}

export const streamAggregator = new StreamAggregator();

