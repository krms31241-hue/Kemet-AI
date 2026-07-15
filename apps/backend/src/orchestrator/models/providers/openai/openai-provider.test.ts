/**
 * openai-provider.test.ts
 *
 * Unit tests for `OpenAIProvider`, fully mocked at the `fetch` boundary
 * via the `fetchImpl` injection point already exposed by
 * `HttpClientConfig`/`ProviderConfig` (see http-client.ts). No real API
 * key, no network access, no external dependency — uses Node's built-in
 * `node:test` runner since no test framework is currently installed
 * anywhere in this monorepo.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { NoRetryPolicy, ProviderError } from "../base/index.js";
import { OpenAIProvider } from "./openai-provider.js";
import { OPENAI_DEFAULT_CAPABILITIES } from "./openai.types.js";

interface RecordedCall {
  readonly url: string;
  readonly init: RequestInit;
}

/** Wraps a handler as a `fetch`-compatible stub, recording every call it received. */
function createMockFetch(
  handler: (url: string, init: RequestInit) => Response | Promise<Response>,
) {
  const calls: RecordedCall[] = [];
  const fetchStub = async (
    input: unknown,
    init: RequestInit = {},
  ): Promise<Response> => {
    const url = String(input);
    calls.push({ url, init });
    return handler(url, init);
  };
  return { fetchStub, calls };
}

/** Builds a `ReadableStream<Uint8Array>` from raw string parts, enqueued as separate chunks. */
function createManualStream(
  parts: readonly string[],
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const part of parts) {
        controller.enqueue(encoder.encode(part));
      }
      controller.close();
    },
  });
}

describe("OpenAIProvider constructor", () => {
  test("stores id, name, and capabilities from config", () => {
    const provider = new OpenAIProvider({
      apiKey: "test-key",
      id: "openai-primary",
      name: "OpenAI Primary",
      capabilities: ["chat", "streaming"],
    });

    assert.equal(provider.id, "openai-primary");
    assert.equal(provider.name, "OpenAI Primary");
    assert.deepEqual(provider.capabilities, ["chat", "streaming"]);
  });

  test("falls back to defaults when id/name/capabilities are omitted", () => {
    const provider = new OpenAIProvider({ apiKey: "test-key" });

    assert.equal(provider.id, "openai");
    assert.equal(provider.name, "OpenAI");
    assert.deepEqual(provider.capabilities, OPENAI_DEFAULT_CAPABILITIES);
  });
});

describe("OpenAIProvider.initialize()", () => {
  test("succeeds when the registration id matches the provider id", async () => {
    const provider = new OpenAIProvider({ apiKey: "test-key", id: "openai" });

    await assert.doesNotReject(() =>
      provider.initialize({
        id: "openai",
        name: "OpenAI",
        enabled: true,
        priority: 0,
        timeout: 30_000,
      }),
    );
  });

  test("rejects when the registration id does not match the provider id", async () => {
    const provider = new OpenAIProvider({ apiKey: "test-key", id: "openai" });

    await assert.rejects(
      () =>
        provider.initialize({
          id: "anthropic",
          name: "Anthropic",
          enabled: true,
          priority: 0,
          timeout: 30_000,
        }),
      ProviderError,
    );
  });
});

describe("OpenAIProvider.getCapabilities()", () => {
  test("maps the capability list to BaseProvider boolean flags", () => {
    const provider = new OpenAIProvider({
      apiKey: "test-key",
      capabilities: ["chat", "streaming", "tool-calling", "vision"],
      maxContextTokens: 128_000,
    });

    assert.deepEqual(provider.getCapabilities(), {
      streaming: true,
      toolUse: true,
      vision: true,
      maxContextTokens: 128_000,
    });
  });

  test("reports false for capabilities not present in the list", () => {
    const provider = new OpenAIProvider({
      apiKey: "test-key",
      capabilities: ["chat"],
    });
    const capabilities = provider.getCapabilities();

    assert.equal(capabilities.streaming, false);
    assert.equal(capabilities.toolUse, false);
    assert.equal(capabilities.vision, false);
  });
});

describe("OpenAIProvider.health()", () => {
  test("returns true when the /models endpoint responds successfully", async () => {
    const { fetchStub, calls } = createMockFetch(
      () => new Response("{}", { status: 200 }),
    );
    const provider = new OpenAIProvider({
      apiKey: "test-key",
      fetchImpl: fetchStub,
      retryPolicy: new NoRetryPolicy(),
    });

    const result = await provider.health();

    assert.equal(result, true);
    assert.equal(calls.length, 1);
    assert.match(calls[0]!.url, /\/models$/);
  });

  test("returns false when the upstream request fails", async () => {
    const { fetchStub } = createMockFetch(
      () =>
        new Response('{"error":{"message":"unauthorized"}}', { status: 401 }),
    );
    const provider = new OpenAIProvider({
      apiKey: "bad-key",
      fetchImpl: fetchStub,
      retryPolicy: new NoRetryPolicy(),
    });

    const result = await provider.health();

    assert.equal(result, false);
  });
});

describe("OpenAIProvider.chat()", () => {
  test("sends the correct endpoint, headers, and body, and maps the response to ChatResponse", async () => {
    const { fetchStub, calls } = createMockFetch(() => {
      const responseBody = {
        id: "chatcmpl-123",
        object: "chat.completion",
        created: 1_700_000_000,
        model: "gpt-4o-mini",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Hello there!" },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };
      return new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    const provider = new OpenAIProvider({
      apiKey: "test-key",
      organizationId: "org-abc",
      fetchImpl: fetchStub,
      retryPolicy: new NoRetryPolicy(),
    });

    const response = await provider.chat({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Hello" }],
      temperature: 0.5,
    });

    assert.equal(calls.length, 1);
    assert.match(calls[0]!.url, /\/chat\/completions$/);
    assert.equal(calls[0]!.init.method, "POST");

    const headers = calls[0]!.init.headers as Headers;
    assert.equal(headers.get("authorization"), "Bearer test-key");
    assert.equal(headers.get("openai-organization"), "org-abc");
    assert.equal(headers.get("content-type"), "application/json");

    const sentBody = JSON.parse(calls[0]!.init.body as string) as Record<
      string,
      unknown
    >;
    assert.equal(sentBody.model, "gpt-4o-mini");
    assert.deepEqual(sentBody.messages, [{ role: "user", content: "Hello" }]);
    assert.equal(sentBody.temperature, 0.5);

    assert.equal(response.id, "chatcmpl-123");
    assert.equal(response.model, "gpt-4o-mini");
    assert.deepEqual(response.message, {
      role: "assistant",
      content: "Hello there!",
    });
    assert.deepEqual(response.usage, {
      promptTokens: 10,
      completionTokens: 5,
      totalTokens: 15,
    });
  });
});

describe("OpenAIProvider.chatStream()", () => {
  test("parses SSE chunks into StreamChunk, including one split across two stream reads", async () => {
    const chunk1 = {
      id: "c1",
      object: "chat.completion.chunk",
      created: 1,
      model: "gpt-4o-mini",
      choices: [
        {
          index: 0,
          delta: { role: "assistant", content: "Hel" },
          finish_reason: null,
        },
      ],
    };
    const chunk2 = {
      id: "c1",
      object: "chat.completion.chunk",
      created: 1,
      model: "gpt-4o-mini",
      choices: [{ index: 0, delta: { content: "lo!" }, finish_reason: null }],
    };
    const chunk3 = {
      id: "c1",
      object: "chat.completion.chunk",
      created: 1,
      model: "gpt-4o-mini",
      choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
    };

    const event1 = `data: ${JSON.stringify(chunk1)}\n\n`;
    const event2Full = `data: ${JSON.stringify(chunk2)}\n\n`;
    const splitPoint = Math.floor(event2Full.length / 2);
    const event3 = `data: ${JSON.stringify(chunk3)}\n\n`;
    const doneEvent = "data: [DONE]\n\n";

    const stream = createManualStream([
      event1,
      event2Full.slice(0, splitPoint), // deliberately split mid-event
      event2Full.slice(splitPoint),
      event3,
      doneEvent,
    ]);

    const { fetchStub, calls } = createMockFetch(() => {
      const response = new Response(stream, { status: 200 });
      return response;
    });

    const provider = new OpenAIProvider({
      apiKey: "test-key",
      fetchImpl: fetchStub,
      retryPolicy: new NoRetryPolicy(),
    });

    const collected = [];
    for await (const streamChunk of provider.chatStream({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Hi" }],
    })) {
      collected.push(streamChunk);
    }

    assert.equal(calls.length, 1);
    assert.match(calls[0]!.url, /\/chat\/completions$/);
    const sentBody = JSON.parse(calls[0]!.init.body as string) as Record<
      string,
      unknown
    >;
    assert.equal(sentBody.stream, true);

    assert.equal(collected.length, 4);
    assert.deepEqual(collected[0], { delta: "Hel", done: false });
    assert.deepEqual(collected[1], { delta: "lo!", done: false });
    assert.deepEqual(collected[2], {
      delta: "",
      done: true,
      finishReason: "stop",
    });
    assert.deepEqual(collected[3], { delta: "", done: true });

    const fullText = collected.map((chunk) => chunk.delta).join("");
    assert.equal(fullText, "Hello!");
  });
});
