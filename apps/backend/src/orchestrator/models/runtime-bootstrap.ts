import { providerRegistry } from "./providers/provider-registry.js";
import { providerFactory } from "./providers/provider-factory.js";
import {
  OpenAIProvider,
  OPENAI_DEFAULT_ID,
  OPENAI_DEFAULT_MODEL,
  OPENAI_DEFAULT_CAPABILITIES,
} from "./providers/openai/index.js";
import { modelRegistry } from "./model-registry.js";

/**
 * Bootstraps the AI runtime.
 *
 * Safe to call multiple times.
 */
let bootstrapped = false;

export function bootstrapModelRuntime(): void {
  if (bootstrapped) {
    return;
  }

  providerRegistry.register(
    providerFactory.create(
      new OpenAIProvider({
        id: OPENAI_DEFAULT_ID,
        apiKey: process.env.OPENAI_API_KEY,
      }),
    ),
  );

  modelRegistry.register({
    id: OPENAI_DEFAULT_MODEL,
    providerId: OPENAI_DEFAULT_ID,
    displayName: OPENAI_DEFAULT_MODEL,
    capabilities: OPENAI_DEFAULT_CAPABILITIES,
  });

  bootstrapped = true;
}
