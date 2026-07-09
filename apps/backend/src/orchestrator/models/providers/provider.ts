import type {
  ChatRequest,
  ChatResponse,
  ProviderCapability,
  ProviderConfig,
} from "./provider.types.js";

export interface Provider {
  readonly id: string;

  readonly name: string;

  readonly capabilities: readonly ProviderCapability[];

  initialize(
    config: ProviderConfig,
  ): Promise<void>;

  chat(
    request: ChatRequest,
  ): Promise<ChatResponse>;

  health(): Promise<boolean>;
}
